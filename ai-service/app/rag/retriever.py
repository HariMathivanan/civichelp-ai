import logging
from typing import List, Tuple, Dict, Any
from app.schemas.civic_schema import KnowledgeChunk, SourceCitation
from app.data.loader import KnowledgeLoader
from app.rag.embeddings import EmbeddingEngine
from app.rag.vector_store import VectorStore

logger = logging.getLogger(__name__)

class CivicRetriever:
    """Orchestrates ingestion, embedding generation, and semantic retrieval of verified civic chunks."""

    def __init__(self, vault_path: str, db_url: str, embedding_model: str = "all-MiniLM-L6-v2"):
        self.loader = KnowledgeLoader(vault_path)
        self.embedding_engine = EmbeddingEngine(model_name=embedding_model)
        self.vector_store = VectorStore(db_url=db_url)
        self.sources_cache: List[Dict[str, Any]] = []

    def ingest_vault(self) -> Tuple[int, int]:
        """Loads verified scheme documents, generates embeddings, and indexes them into VectorStore."""
        logger.info("Starting ingestion of knowledge vault documents...")
        sources, chunks = self.loader.load_sources_and_chunks()
        self.sources_cache = sources

        if not chunks:
            logger.warning("No chunks created during ingestion.")
            return 0, 0

        texts = [chunk.text for chunk in chunks]
        embeddings = self.embedding_engine.embed_batch(texts)
        self.vector_store.save_chunks(sources, chunks, embeddings)
        
        logger.info(f"Ingestion complete: {len(sources)} sources, {len(chunks)} chunks indexed.")
        return len(sources), len(chunks)

    def retrieve(self, query: str, top_k: int = 4, threshold: float = 0.35) -> List[Tuple[KnowledgeChunk, float]]:
        """Retrieves verified context chunks matching the user's citizen query."""
        query_embedding = self.embedding_engine.embed_text(query)
        matches = self.vector_store.search_similar(query_embedding, top_k=top_k, threshold=threshold)
        logger.info(f"Retrieved {len(matches)} relevant chunks for query: '{query[:50]}...'")
        return matches

    def extract_sources_cited(self, chunks: List[KnowledgeChunk]) -> List[SourceCitation]:
        """Deduplicates and returns official source metadata for cited chunks."""
        seen_ids = set()
        citations = []
        for chunk in chunks:
            if chunk.source_id not in seen_ids:
                seen_ids.add(chunk.source_id)
                citations.append(
                    SourceCitation(
                        id=chunk.source_id,
                        title=chunk.title,
                        authority=chunk.authority,
                        official_url=chunk.official_url,
                        category=chunk.category,
                        last_verified_at=chunk.metadata.get("last_verified_at", "2026-09-18")
                    )
                )
        return citations
