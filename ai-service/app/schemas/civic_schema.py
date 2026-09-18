from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CivicQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000, description="Citizen query in natural language")
    language: str = Field(default="en", description="Language code: en (English) or ta (Tamil)")

class SourceCitation(BaseModel):
    id: str
    title: str
    authority: str
    official_url: str
    category: str
    last_verified_at: str

class CivicGuidanceResponse(BaseModel):
    problem_understood: str = Field(..., description="Summary of the citizen's core question or situation")
    service_name: str = Field(..., description="Official name of the relevant government service")
    authority: str = Field(..., description="Government department or statutory authority responsible")
    summary: str = Field(..., description="Plain-language explanation of what to do")
    eligibility: Optional[str] = Field(None, description="Who is eligible under official rules")
    required_documents: List[str] = Field(default_factory=list, description="List of required verified documents")
    steps: List[str] = Field(default_factory=list, description="Step-by-step actionable procedure")
    fees: Optional[str] = Field(None, description="Official fee amount and payment method")
    timeline: Optional[str] = Field(None, description="Expected processing and delivery timeline")
    warnings: List[str] = Field(default_factory=list, description="Important warnings and fraud advisories")
    official_sources: List[SourceCitation] = Field(default_factory=list, description="Authoritative sources cited")
    action_checklist: List[str] = Field(default_factory=list, description="Interactive checklist items for the citizen")
    confidence_score: float = Field(default=1.0, description="Retrieval confidence score between 0.0 and 1.0")
    insufficient_information: bool = Field(default=False, description="True if no verified source could answer the query")

class KnowledgeChunk(BaseModel):
    id: str
    source_id: str
    slug: str
    title: str
    authority: str
    category: str
    official_url: str
    section_type: str
    text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class IngestResponse(BaseModel):
    status: str
    total_sources: int
    total_chunks: int
    message: str
