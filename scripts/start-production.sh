#!/bin/sh
set -e

echo "=========================================================="
echo "🚀 Starting CivicHelp AI Production Container"
echo "=========================================================="

# 1. Start Python FastAPI RAG Service in background on port 8000
echo "📡 Starting Python FastAPI RAG Engine on 127.0.0.1:8000..."
cd /app/ai-service
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
FASTAPI_PID=$!

# 2. Wait for FastAPI to initialize and index the knowledge vault
echo "⏳ Waiting for FastAPI RAG Engine readiness..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "✅ FastAPI RAG Engine is healthy and ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "⚠️ FastAPI health check timed out, proceeding with Express gateway startup..."
fi

# 3. Start Node.js Express Gateway (serves React frontend + /api routes) in foreground
echo "🌐 Starting Express API Gateway & React Static Server..."
cd /app/backend
exec node src/server.js
