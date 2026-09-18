import logging
from typing import List
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingEngine:
    """Generates dense vector embeddings for text using SentenceTransformers (all-MiniLM-L6-v2, 384 dimensions)."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {self.model_name}...")
                self._model = SentenceTransformer(self.model_name)
                logger.info("Embedding model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load SentenceTransformer: {e}")
                raise e
        return self._model

    def embed_text(self, text: str) -> List[float]:
        """Embeds a single string into a 384-dim vector."""
        model = self._get_model()
        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embeds a list of strings into dense vectors."""
        if not texts:
            return []
        model = self._get_model()
        embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return embeddings.tolist()
