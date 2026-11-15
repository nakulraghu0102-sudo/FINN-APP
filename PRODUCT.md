# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: a portfolio manager at a lean public-markets investment firm (ENAM Holdings), on a phone, between meetings during the trading day in office light. They triage in 30-second bursts with one thumb: what changed in the portfolio, does it need me, and if so, dig in. Secondary (confirmed by the brief): ENAM's hiring panel, who open the link on a phone and judge product sense, creativity, judgment and architecture.

## Product Purpose
FINN is a mobile-first financial investment agent for Indian listed equities (NSE/BSE). Push: it tells the investor what changed across an 18-stock portfolio and why they should care, with routine filings buried. Pull: on demand, it builds an analyst's first-hour dossier on any NSE company from primary sources. Success: the investor spends less time and sees only what is material; the first screen proves the filtering.

## Positioning
FINN's judgment is explicit and auditable. Every filing is classified by rules into the exchange taxonomy and scored for materiality, including the size of any rupee amount against the company's market cap ("₹1.6 lakh penalty — immaterial vs ₹13.1L cr market cap"). Research checks management's spoken guidance against the quarters reported afterwards ("promise vs delivery"). The engine runs at zero model cost; models refine but never do the arithmetic.

## Operating Context
- Indian market rhythm: filings arrive all day under SEBI LODR Regulation 30; prices are end-of-day (close 15:30 IST); fiscal years run April–March (Q2 FY27 = Jul–Sep 2026); money in ₹ crore / lakh crore with Indian digit grouping.
- Push sources: NSE announcements RSS, BSE announcements via screener.in, exchange PDFs. Prices: Yahoo Finance EOD.
- Pull sources: filed financials, annual reports, concall transcripts only. No news, broker notes or model outside knowledge.
- Two runtime modes: live (FastAPI server polling filings, SSE push) and snapshot (static JSON for phone-friendly hosting).

## Capabilities and Constraints
- Four sections, confirmed to keep: Brief (windowed digest: needs you / worth a glance / routine handled; default 24h, user-chosen window), Tripwires (configurable price-move, volume-multiple, 52-week and filing-category alerts, with a 60-session noise meter), Research (dossier lenses: overview, numbers, trajectory, balance sheet, cash quality, promise vs delivery, bull/bear, business), Holdings (portfolio list).
- Confirmed to keep: swipe-to-clear on brief cards with a "cleared" progress count; the current copy and wording.
- Results cards show Revenue, EBITDA, PBT, PAT QoQ and YoY (lenders get net interest income instead of EBITDA). Management-change cards show the appointee's profile from the filing and a LinkedIn search link.
- Stack: vanilla HTML/CSS/JS, no build step; must also publish as a static page (fonts from Google Fonts only, no other external hosts).
- Everything else (layout, composition, visual system, IA inside a tab) is open.

## Evidence on Hand
- Real data: web/data/snapshot.json (portfolio of 18, 30-day classified filings, 1-year EOD), web/data/research/*.json (22 dossiers), generated 15 Nov 2026 from live sources.
- No testimonials, customers, users, or performance claims exist; none may be invented.

## Product Principles
1. Filter, don't aggregate: the count of things that need you is the headline; noise is visibly handled, never deleted.
2. Show the judgment: every surfaced item carries its one-line reason and its size relative to the company.
3. Numbers before narrative: computed from filings, sourced, and honest about what cannot be measured.
4. One thumb, thirty seconds: decisions first, depth one tap away.
