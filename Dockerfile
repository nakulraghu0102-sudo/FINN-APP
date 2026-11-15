FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY finn ./finn
COPY web ./web
COPY scripts ./scripts
ENV FINN_DATA_DIR=/app/data PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn finn.server:app --host 0.0.0.0 --port ${PORT}"]
