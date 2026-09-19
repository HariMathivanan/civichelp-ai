# ==============================================================================
# CivicHelp AI — Production Multi-Service Container
# Packages: React Frontend (Compiled), Express Gateway, Python FastAPI RAG
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React + Vite Frontend
# ------------------------------------------------------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Unified Production Runtime (Python 3.12 + Node.js 20)
# ------------------------------------------------------------------------------
FROM python:3.12-slim-bookworm AS production

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    FASTAPI_URL=http://127.0.0.1:8000 \
    PORT=5000 \
    KNOWLEDGE_VAULT_PATH=/app/knowledge_vault

WORKDIR /app

# 1. Install Node.js and curl for container health probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python RAG dependencies (CPU-only PyTorch + sentence-transformers + fastapi)
COPY ai-service/requirements.txt /app/ai-service/
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r /app/ai-service/requirements.txt

# 3. Pre-cache all-MiniLM-L6-v2 embeddings model into the container layer
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# 4. Install Node.js backend production dependencies
COPY backend/package*.json /app/backend/
WORKDIR /app/backend
RUN npm install --omit=dev

WORKDIR /app

# 5. Copy verified knowledge vault and application source code
COPY knowledge_vault/ /app/knowledge_vault/
COPY ai-service/ /app/ai-service/
COPY backend/ /app/backend/
COPY scripts/start-production.sh /app/scripts/start-production.sh
RUN chmod +x /app/scripts/start-production.sh

# 6. Copy compiled React frontend assets from Stage 1 into /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Expose default application port (Express)
EXPOSE 5000

# Launch production entrypoint
CMD ["/app/scripts/start-production.sh"]
