"""CivicHelp AI — RAG Engine & Grounding Test Suite"""

import os
import sys
from pathlib import Path
import pytest

AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(AI_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.data.loader import KnowledgeLoader
from app.rag.embeddings import EmbeddingEngine
from app.rag.vector_store import VectorStore
from app.rag.retriever import CivicRetriever
from app.llm.generator import CivicLLMGenerator
from app.guardrails.pii_filter import PIISanitizer
from app.schemas.civic_schema import CivicGuidanceResponse, CivicQueryRequest

VAULT_PATH = Path(__file__).resolve().parent.parent.parent / "knowledge_vault"

@pytest.fixture(scope="module")
def knowledge_loader():
    return KnowledgeLoader(str(VAULT_PATH))

@pytest.fixture(scope="module")
def retriever():
    r = CivicRetriever(
        vault_path=str(VAULT_PATH),
        db_url="postgresql://invalid:invalid@localhost:5432/none", # tests graceful vector handling
        embedding_model="all-MiniLM-L6-v2"
    )
    r.ingest_vault()
    return r

@pytest.fixture(scope="module")
def generator():
    return CivicLLMGenerator()

def test_1_document_loading(knowledge_loader):
    """Test 1: Loads all 6 verified knowledge documents and generates structured chunks."""
    sources, chunks = knowledge_loader.load_sources_and_chunks()
    
    assert len(sources) == 6, f"Expected 6 sources, got {len(sources)}"
    assert len(chunks) >= 24, f"Expected at least 24 chunks (4-5 per doc), got {len(chunks)}"
    
    # Verify presence of essential schemes
    slugs = [s["slug"] for s in sources]
    assert "aadhaar-lost-pvc-reprint" in slugs
    assert "pan-card-services-reprint-instant" in slugs
    assert "passport-fresh-tatkaal-application" in slugs
    assert "driving-licence-renewal-duplicate" in slugs
    assert "voter-id-registration-correction-epic" in slugs
    print(f"\n[PASS] Test 1: {len(sources)} sources & {len(chunks)} chunks loaded successfully.")

def test_2_embedding_generation():
    """Test 2: Embedding engine generates correct 384-dimensional normalized vectors."""
    engine = EmbeddingEngine(model_name="all-MiniLM-L6-v2")
    sample_text = "How do I order a PVC reprint of my lost Aadhaar card?"
    embedding = engine.embed_text(sample_text)
    
    assert isinstance(embedding, list)
    assert len(embedding) == 384, f"Expected 384 dimensions, got {len(embedding)}"
    print(f"\n[PASS] Test 2: 384-dim dense embedding generated successfully.")

def test_3_semantic_retrieval(retriever):
    """Test 3: Semantic search retrieves correct government scheme for realistic citizen queries."""
    # Query: Lost Aadhaar
    matches_aadhaar = retriever.retrieve("I lost my Aadhaar card, how do I get a new physical card?", top_k=3)
    assert len(matches_aadhaar) > 0
    top_chunk, sim = matches_aadhaar[0]
    assert top_chunk.source_id == "aadhaar_lost_pvc"
    assert sim > 0.45
    print(f"\n[PASS] Test 3a: Retrieved '{top_chunk.title}' with similarity {sim:.4f}")

    # Query: Tatkaal Passport
    matches_passport = retriever.retrieve("What is the fee and timeline for Tatkaal passport application?", top_k=3)
    assert len(matches_passport) > 0
    top_chunk_p, sim_p = matches_passport[0]
    assert top_chunk_p.source_id == "passport_services"
    assert sim_p > 0.45
    print(f"\n[PASS] Test 3b: Retrieved '{top_chunk_p.title}' with similarity {sim_p:.4f}")

def test_4_grounded_answer_and_schema_validation(retriever, generator):
    """Test 4: Generates structured guidance conforming to Pydantic CivicGuidanceResponse."""
    query = "How to apply for an instant PAN card online?"
    matches = retriever.retrieve(query, top_k=3)
    chunks = [m[0] for m in matches]
    citations = retriever.extract_sources_cited(chunks)
    
    response = generator.generate_guidance(
        query=query,
        retrieved_chunks=chunks,
        sources_cited=citations,
        confidence_score=matches[0][1]
    )
    
    assert isinstance(response, CivicGuidanceResponse)
    assert response.service_name != ""
    assert len(response.steps) > 0
    assert len(response.official_sources) > 0
    assert response.official_sources[0].official_url.startswith("https://")
    assert response.insufficient_information is False
    print(f"\n[PASS] Test 4: Response validated with schema. Service: '{response.service_name}'")

def test_5_out_of_scope_unanswerable_query(retriever, generator):
    """Test 5: Correctly identifies out-of-scope query and returns safe refusal without hallucinations."""
    unrelated_query = "How do I adopt a wild giant panda in Antarctica?"
    matches = retriever.retrieve(unrelated_query, top_k=3, threshold=0.35)
    
    # Matches should be empty or have very low similarity
    chunks = [m[0] for m in matches] if matches else []
    confidence = matches[0][1] if matches else 0.0
    citations = retriever.extract_sources_cited(chunks)
    
    response = generator.generate_guidance(
        query=unrelated_query,
        retrieved_chunks=chunks,
        sources_cited=citations,
        confidence_score=confidence
    )
    
    assert response.insufficient_information is True
    assert "Insufficient verified official information" in response.summary
    assert len(response.official_sources) == 0
    print(f"\n[PASS] Test 5: Out-of-scope query cleanly handled with zero hallucination.")

def test_6_pii_sanitization():
    """Test 6: Protects citizen privacy by detecting and redacting Aadhaar, PAN, and OTPs."""
    raw_query = "My Aadhaar is 2345 6789 0123 and PAN is ABCDE1234F. My otp: 882910. How to update?"
    sanitized, pii_detected = PIISanitizer.sanitize_query(raw_query)
    
    assert pii_detected is True
    assert "2345 6789 0123" not in sanitized
    assert "ABCDE1234F" not in sanitized
    assert "882910" not in sanitized
    assert "[REDACTED_AADHAAR_NUMBER]" in sanitized
    assert "[REDACTED_PAN_NUMBER]" in sanitized
    print(f"\n[PASS] Test 6: PII successfully redacted: '{sanitized}'")
