"""CivicHelp AI — FastAPI Endpoints Test Suite"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

AI_SERVICE_ROOT = Path(__file__).resolve().parent.parent
if str(AI_SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_ROOT))

from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_api_health_endpoint(client):
    """Verify GET /health returns 200 and healthy service status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["indexed_sources"] == 6
    print("\n[PASS] API /health endpoint functioning properly.")

def test_api_sources_endpoint(client):
    """Verify GET /rag/sources returns all 6 curated services."""
    response = client.get("/rag/sources")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 6
    assert len(data["sources"]) == 6
    print("\n[PASS] API /rag/sources returned 6 verified official sources.")

def test_api_query_aadhaar(client):
    """Verify POST /rag/query with realistic citizen question."""
    payload = {
        "query": "I lost my Aadhaar card and my registered mobile number is not working. What is the fee to order a replacement PVC card?",
        "language": "en"
    }
    response = client.post("/rag/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["service_name"] != ""
    assert data["confidence_score"] > 0.4
    assert len(data["steps"]) > 0
    assert len(data["official_sources"]) > 0
    assert "myaadhaar.uidai.gov.in" in data["official_sources"][0]["official_url"]
    print("\n[PASS] API /rag/query returned grounded answer for Aadhaar PVC query.")

def test_api_query_unanswerable(client):
    """Verify POST /rag/query with out-of-scope query refuses to hallucinate."""
    payload = {
        "query": "Where can I buy a pet dinosaur in Mumbai?",
        "language": "en"
    }
    response = client.post("/rag/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["insufficient_information"] is True
    assert data["confidence_score"] < 0.35
    print("\n[PASS] API /rag/query safely rejected out-of-scope query.")
