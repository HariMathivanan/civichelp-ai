import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
VAULT_DIR = BASE_DIR.parent / "knowledge_vault"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "CivicHelp AI - RAG Service"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # LLM Settings (Primary: Google Gemini)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Embedding Settings (Local Sentence-Transformers)
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384
    
    # Database Settings (PostgreSQL with pgvector)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/civichelp"
    
    # Vault Path
    KNOWLEDGE_VAULT_PATH: str = str(VAULT_DIR)
    
    # RAG Settings
    TOP_K_RETRIEVAL: int = 4
    SIMILARITY_THRESHOLD: float = 0.35

settings = Settings()
