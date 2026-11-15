"""Model routing: the cheapest thing that can do each job, cached forever.

Tier      Job                                               Default model
--------  ------------------------------------------------  ---------------------------
rules     classify filings, compute numbers, check promises  none (plain Python)
extract   read a filing/transcript snippet -> strict JSON    claude-haiku-5-5  | local Ollama
reason    write the verdict from already-verified facts      claude-opus-5-5 (effort low)

* Inputs are pre-shrunk by the rules tier (a 50k-char transcript becomes ~20 numbered
  candidate sentences), so the model reads ~5% of the document.
* Every response is cached under sha256(task, model, prompt) — the same filing is never
  paid for twice; restarts are free.
* Every call is written to the `llm` ledger with tokens and $ cost (shown in the app).
* No key configured -> every call returns None and the rules tier stands alone.

Config (env): ANTHROPIC_API_KEY, FINN_LLM=auto|anthropic|ollama|off,
FINN_OLLAMA_MODEL (e.g. qwen2.5:3b), FINN_EXTRACT_MODEL, FINN_REASON_MODEL.
"""
from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import time
from typing import Any

import requests

from . import store

log = logging.getLogger("finn.llm")

PRICES = {  # $ per 1M tokens (input, output)
    "claude-haiku-5-5": (0.10, 0.50), "claude-opus-5-5": (4.0, 20.0), "claude-sonnet-5-5": (2.0, 10.0),
}
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")


def _anthropic_ready() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN"))


def _ollama_model() -> str | None:
    m = os.environ.get("FINN_OLLAMA_MODEL")
    if not m:
        return None
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        names = {x["name"] for x in r.json().get("models", [])}
        return m if m in names or f"{m}:latest" in names else None
    except Exception:
        return None


def status() -> dict:
    mode = os.environ.get("FINN_LLM", "auto").lower()
    provider = None
    if mode != "off":
        if mode in ("auto", "anthropic") and _anthropic_ready():
            provider = "anthropic"
        elif mode in ("auto", "ollama") and _ollama_model():
            provider = "ollama"
    if provider == "anthropic":
        models = {"extract": os.environ.get("FINN_EXTRACT_MODEL", "claude-haiku-5-5"),
                  "reason": os.environ.get("FINN_REASON_MODEL", "claude-opus-5-5")}
    elif provider == "ollama":
        m = _ollama_model()
        models = {"extract": m, "reason": os.environ.get("FINN_OLLAMA_REASON_MODEL", m)}
    else:
        models = {"extract": None, "reason": None}
    return {"provider": provider, "models": models, "ledger": store.llm_summary()}


_client = None


def _anthropic():
    global _client
    if _client is None:
        import anthropic
        _client = anthropic.Anthropic(max_retries=2, timeout=120)
    return _client


def _cost(model: str, i: int, o: int) -> float:
    p = PRICES.get(model)
    return (i * p[0] + o * p[1]) / 1e6 if p else 0.0


def _call_anthropic(model: str, tier: str, system: str, content: Any, schema: dict | None,
                    max_tokens: int, tools: list | None = None) -> tuple[str, int, int]:
    import anthropic
    kw: dict = {"model": model, "max_tokens": max_tokens, "system": system,
                "messages": [{"role": "user", "content": content}]}
    if schema:
        kw["output_config"] = {"format": {"type": "json_schema", "schema": schema}}
    if model.startswith("claude-opus") or model.startswith("claude-haiku"):
        kw.setdefault("output_config", {})["effort"] = "low"
    if tools:
        kw["tools"] = tools
    client = _anthropic()
    resp = None
    if model == "claude-opus-5-5":
        # server-side refusal fallback (opt-in); retried without it if the account rejects the beta
        try:
            resp = client.beta.messages.create(betas=["server-side-fallback-2026-07-01"], fallbacks="default", **kw)
        except anthropic.BadRequestError:
            resp = None
    if resp is None:
        resp = client.messages.create(**kw)
    # server tools (web search) may pause a long turn; resume a couple of times
    turns = 0
    while getattr(resp, "stop_reason", None) == "pause_turn" and turns < 3:
        kw["messages"] = kw["messages"] + [{"role": "assistant", "content": resp.content}]
        resp = client.messages.create(**kw)
        turns += 1
    if resp.stop_reason == "refusal":
        raise RuntimeError("model declined")
    text = "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
    return text, resp.usage.input_tokens, resp.usage.output_tokens


def _call_ollama(model: str, system: str, content: Any, schema: dict | None, max_tokens: int) -> tuple[str, int, int]:
    if not isinstance(content, str):
        content = "\n".join(c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text")
    body = {"model": model, "stream": False, "options": {"temperature": 0, "num_predict": max_tokens, "num_ctx": 8192},
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": content}]}
    if schema:
        body["format"] = schema
    r = requests.post(f"{OLLAMA_URL}/api/chat", json=body, timeout=600)
    r.raise_for_status()
    j = r.json()
    return j["message"]["content"], j.get("prompt_eval_count", 0), j.get("eval_count", 0)


def run(task: str, tier: str, system: str, content: Any, schema: dict | None = None,
        max_tokens: int = 2000, tools: list | None = None, anthropic_only: bool = False) -> Any:
    """Run one model call through the router. Returns parsed JSON (if schema) / text, or None."""
    st = status()
    provider, model = st["provider"], st["models"].get(tier)
    if not provider or not model or (anthropic_only and provider != "anthropic"):
        return None
    raw_key = json.dumps([task, model, system, content if isinstance(content, str) else
                          [c if c.get("type") == "text" else {"doc": hashlib.sha256(json.dumps(c, sort_keys=True).encode()).hexdigest()}
                           for c in content], schema, bool(tools)], sort_keys=True, default=str)
    key = "llm:" + hashlib.sha256(raw_key.encode()).hexdigest()
    hit = store.kv_get(key)
    if hit is not None:
        store.llm_log(task=task, tier=tier, provider=provider, model=model, cache_hit=True)
        return hit
    t0 = time.time()
    try:
        if provider == "anthropic":
            text, i, o = _call_anthropic(model, tier, system, content, schema, max_tokens, tools)
        else:
            text, i, o = _call_ollama(model, system, content, schema, max_tokens)
    except Exception as e:  # any provider failure degrades to the rules tier
        log.warning("llm %s failed: %s", task, e)
        return None
    out: Any = text
    if schema:
        try:
            s = text[text.find("{"): text.rfind("}") + 1]
            out = json.loads(s)
        except Exception:
            log.warning("llm %s returned non-JSON", task)
            return None
    store.kv_set(key, out)
    store.llm_log(task=task, tier=tier, provider=provider, model=model, in_tokens=i, out_tokens=o,
                  cost_usd=_cost(model, i, o), cache_hit=False)
    log.info("llm %s %s %.1fs in=%d out=%d", task, model, time.time() - t0, i, o)
    return out


def pdf_block(body: bytes) -> dict:
    return {"type": "document", "source": {"type": "base64", "media_type": "application/pdf",
                                           "data": base64.standard_b64encode(body).decode()}}
