import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.schemas.civic_schema import (
    CivicQueryRequest,
    CivicGuidanceResponse,
    IngestResponse,
    SourceCitation
)
from app.rag.retriever import CivicRetriever
from app.llm.generator import CivicLLMGenerator
from app.guardrails.pii_filter import PIISanitizer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("civichelp-ai")

# Singleton Services
retriever: CivicRetriever = None
generator: CivicLLMGenerator = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global retriever, generator
    logger.info("Initializing CivicHelp AI RAG Service...")
    retriever = CivicRetriever(
        vault_path=settings.KNOWLEDGE_VAULT_PATH,
        db_url=settings.DATABASE_URL,
        embedding_model=settings.EMBEDDING_MODEL_NAME
    )
    generator = CivicLLMGenerator(
        api_key=settings.GEMINI_API_KEY,
        model_name=settings.GEMINI_MODEL
    )
    
    # Ingest knowledge vault on startup
    try:
        sources_count, chunks_count = retriever.ingest_vault()
        logger.info(f"Startup Ingestion: {sources_count} sources and {chunks_count} chunks indexed.")
    except Exception as e:
        logger.error(f"Startup ingestion failed: {e}")
        
    yield
    logger.info("Shutting down CivicHelp AI RAG Service...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Precision RAG service for verified Indian government citizen assistance.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Express gateway and Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
def health_check():
    """Service health and component readiness probe."""
    return {
        "status": "healthy",
        "service": "CivicHelp AI - RAG Engine",
        "environment": settings.ENVIRONMENT,
        "indexed_sources": len(retriever.sources_cache) if retriever else 0,
        "postgres_connected": retriever.vector_store.use_postgres if retriever else False
    }

@app.post("/rag/query", response_model=CivicGuidanceResponse, status_code=status.HTTP_200_OK)
def query_civic_service(request: CivicQueryRequest):
    """Processes natural language citizen query through PII filter, vector retrieval, and grounded LLM generation."""
    if not retriever or not generator:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG Engine is not yet initialized."
        )

    # 1. Citizen Privacy & PII Filter
    sanitized_query, pii_detected = PIISanitizer.sanitize_query(request.query)
    if pii_detected:
        logger.warning(f"Sensitive citizen PII pattern detected and sanitized from incoming query.")

    # 2. Semantic Context Retrieval
    matches = retriever.retrieve(
        query=sanitized_query,
        top_k=settings.TOP_K_RETRIEVAL,
        threshold=settings.SIMILARITY_THRESHOLD
    )

    retrieved_chunks = [match[0] for match in matches]
    confidence = matches[0][1] if matches else 0.0

    # 3. Extract Authoritative Citations
    citations = retriever.extract_sources_cited(retrieved_chunks)

    # 4. Generate Grounded Response with Schema Validation
    guidance = generator.generate_guidance(
        query=sanitized_query,
        retrieved_chunks=retrieved_chunks,
        sources_cited=citations,
        confidence_score=confidence
    )

    return guidance

@app.post("/rag/ingest", response_model=IngestResponse, status_code=status.HTTP_200_OK)
def trigger_reingest():
    """Reloads knowledge vault files from disk/S3 and refreshes the vector index."""
    if not retriever:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="RAG Engine is not yet initialized."
        )

    sources_count, chunks_count = retriever.ingest_vault()
    return IngestResponse(
        status="success",
        total_sources=sources_count,
        total_chunks=chunks_count,
        message=f"Successfully indexed {sources_count} sources and {chunks_count} semantic chunks."
    )

@app.get("/rag/sources")
def list_available_sources():
    """Lists all verified citizen service documents currently active in the knowledge vault."""
    if not retriever or not retriever.sources_cache:
        return {"sources": []}
    
    summary_list = [
        {
            "id": s.get("id"),
            "slug": s.get("slug"),
            "title": s.get("title"),
            "authority": s.get("authority"),
            "category": s.get("category"),
            "official_url": s.get("official_url"),
            "last_verified_at": s.get("last_verified_at"),
            "verification_status": s.get("verification_status")
        }
        for s in retriever.sources_cache
    ]
    return {"sources": summary_list, "count": len(summary_list)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
