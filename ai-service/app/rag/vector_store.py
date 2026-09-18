import json
import logging
from typing import List, Tuple, Optional, Dict, Any
import numpy as np
from app.schemas.civic_schema import KnowledgeChunk

logger = logging.getLogger(__name__)

class VectorStore:
    """Manages PostgreSQL + pgvector storage and cosine similarity retrieval for knowledge chunks."""

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url
        self.use_postgres = False
        self._memory_chunks: List[KnowledgeChunk] = []
        self._memory_embeddings: Optional[np.ndarray] = None
        self._init_db()

    def _init_db(self):
        if not self.db_url:
            logger.info("No DATABASE_URL configured. Operating in in-memory vector mode.")
            return

        try:
            import psycopg
            from pgvector.psycopg import register_vector

            with psycopg.connect(self.db_url, autocommit=True) as conn:
                # Enable pgvector extension
                conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                register_vector(conn)

                # Create sources table
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS knowledge_sources (
                        id VARCHAR(100) PRIMARY KEY,
                        slug VARCHAR(100) UNIQUE NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        authority VARCHAR(255) NOT NULL,
                        category VARCHAR(100) NOT NULL,
                        official_url VARCHAR(500) NOT NULL,
                        last_verified_at VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)

                # Create chunks table with 384-dimension vector embedding
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS knowledge_chunks (
                        id VARCHAR(150) PRIMARY KEY,
                        source_id VARCHAR(100) REFERENCES knowledge_sources(id) ON DELETE CASCADE,
                        slug VARCHAR(100) NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        authority VARCHAR(255) NOT NULL,
                        category VARCHAR(100) NOT NULL,
                        official_url VARCHAR(500) NOT NULL,
                        section_type VARCHAR(100) NOT NULL,
                        chunk_text TEXT NOT NULL,
                        metadata JSONB DEFAULT '{}',
                        embedding vector(384),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                self.use_postgres = True
                logger.info("Successfully connected to PostgreSQL and initialized pgvector tables.")
        except Exception as e:
            logger.warning(f"PostgreSQL connection / pgvector init skipped ({e}). Operating in in-memory vector mode.")
            self.use_postgres = False

    def save_chunks(self, sources: List[Dict[str, Any]], chunks: List[KnowledgeChunk], embeddings: List[List[float]]):
        """Saves sources and knowledge chunks with their vector embeddings."""
        self._memory_chunks = chunks
        self._memory_embeddings = np.array(embeddings, dtype=np.float32)

        if self.use_postgres:
            try:
                import psycopg
                from pgvector.psycopg import register_vector

                with psycopg.connect(self.db_url, autocommit=True) as conn:
                    register_vector(conn)
                    
                    # Upsert sources
                    for s in sources:
                        conn.execute("""
                            INSERT INTO knowledge_sources (id, slug, title, authority, category, official_url, last_verified_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO UPDATE SET
                                title = EXCLUDED.title,
                                authority = EXCLUDED.authority,
                                category = EXCLUDED.category,
                                official_url = EXCLUDED.official_url,
                                last_verified_at = EXCLUDED.last_verified_at;
                        """, (
                            s["id"], s["slug"], s["title"], s["authority"],
                            s["category"], s["official_url"], s.get("last_verified_at", "")
                        ))

                    # Upsert chunks
                    for chunk, emb in zip(chunks, embeddings):
                        conn.execute("""
                            INSERT INTO knowledge_chunks (id, source_id, slug, title, authority, category, official_url, section_type, chunk_text, metadata, embedding)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT (id) DO UPDATE SET
                                chunk_text = EXCLUDED.chunk_text,
                                embedding = EXCLUDED.embedding;
                        """, (
                            chunk.id, chunk.source_id, chunk.slug, chunk.title,
                            chunk.authority, chunk.category, chunk.official_url,
                            chunk.section_type, chunk.text, json.dumps(chunk.metadata),
                            emb
                        ))
                logger.info(f"Persisted {len(chunks)} chunks to PostgreSQL/pgvector.")
            except Exception as e:
                logger.error(f"Failed to persist to PostgreSQL: {e}")

    def search_similar(self, query_embedding: List[float], top_k: int = 4, threshold: float = 0.35) -> List[Tuple[KnowledgeChunk, float]]:
        """Finds top-k most similar knowledge chunks using cosine distance."""
        if self.use_postgres:
            try:
                import psycopg
                from pgvector.psycopg import register_vector

                with psycopg.connect(self.db_url) as conn:
                    register_vector(conn)
                    query_vec = np.array(query_embedding, dtype=np.float32)
                    
                    # Cosine distance operator <=> returns 1 - cosine_similarity
                    cursor = conn.execute("""
                        SELECT id, source_id, slug, title, authority, category, official_url, section_type, chunk_text, metadata, (1 - (embedding <=> %s)) AS similarity
                        FROM knowledge_chunks
                        ORDER BY embedding <=> %s
                        LIMIT %s;
                    """, (query_vec, query_vec, top_k))
                    
                    results = []
                    for row in cursor.fetchall():
                        sim = float(row[10])
                        if sim >= threshold:
                            chunk = KnowledgeChunk(
                                id=row[0],
                                source_id=row[1],
                                slug=row[2],
                                title=row[3],
                                authority=row[4],
                                category=row[5],
                                official_url=row[6],
                                section_type=row[7],
                                text=row[8],
                                metadata=row[9] if isinstance(row[9], dict) else json.loads(row[9] or "{}")
                            )
                            results.append((chunk, sim))
                    return results
            except Exception as e:
                logger.warning(f"PostgreSQL pgvector search failed ({e}), using in-memory vector search.")

        # In-Memory Cosine Similarity Calculation
        if self._memory_embeddings is None or len(self._memory_chunks) == 0:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32)
        norm_q = np.linalg.norm(q_vec)
        if norm_q == 0:
            return []
        
        norms = np.linalg.norm(self._memory_embeddings, axis=1)
        # Avoid division by zero
        norms[norms == 0] = 1e-10
        
        cosine_sims = np.dot(self._memory_embeddings, q_vec) / (norms * norm_q)
        top_indices = np.argsort(cosine_sims)[::-1][:top_k]

        results = []
        for idx in top_indices:
            sim = float(cosine_sims[idx])
            if sim >= threshold:
                results.append((self._memory_chunks[idx], sim))

        return results
