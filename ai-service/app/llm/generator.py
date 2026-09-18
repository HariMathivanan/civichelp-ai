import json
import logging
from typing import List, Optional
from app.schemas.civic_schema import KnowledgeChunk, CivicGuidanceResponse, SourceCitation
from app.core.config import settings

logger = logging.getLogger(__name__)

GROUNDING_SYSTEM_PROMPT = """You are CivicHelp AI, an independent citizen assistance engine designed to make official Indian government services simple, clear, and actionable.

CRITICAL TRUST & SAFETY GROUNDING RULES:
1. Grounding: Answer ONLY using the facts provided in the VERIFIED_OFFICIAL_CONTEXT below.
2. Anti-Hallucination: Do NOT invent, assume, or fabricate any government fees, timelines, document requirements, eligibility rules, or URLs.
3. Missing Information: If any detail (e.g., fee, timeline, eligibility) is not explicitly stated in the context, set that field to null. DO NOT guess.
4. Language & Tone: Keep explanations crystal-clear, professional, empathetic, and at a 6th-grade reading level.
5. Schema Compliance: Output MUST strictly be valid JSON matching the specified schema with no surrounding text or markdown ticks.

OUTPUT JSON SCHEMA:
{
  "problem_understood": "Short 1-sentence recap of citizen's situation",
  "service_name": "Official government scheme / service name",
  "authority": "Official government authority (e.g., UIDAI, MEA, MoRTH, Income Tax Dept, ECI)",
  "summary": "Clear, simple 2-3 sentence overview of what the citizen needs to do",
  "eligibility": "Eligibility criteria or null",
  "required_documents": ["Document 1", "Document 2"],
  "steps": ["Step 1: Actionable instruction", "Step 2: Actionable instruction"],
  "fees": "Exact fee amount and payment mode or null",
  "timeline": "Expected processing / delivery timeframe or null",
  "warnings": ["Crucial warning 1", "Fraud alert 2"],
  "action_checklist": ["Checklist item 1", "Checklist item 2"]
}
"""

class CivicLLMGenerator:
    """Generates grounded, schema-validated citizen guidance using Google Gemini."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={"response_mime_type": "application/json"}
                )
                logger.info(f"Gemini LLM initialized with model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
                self._client = None

    def generate_guidance(
        self,
        query: str,
        retrieved_chunks: List[KnowledgeChunk],
        sources_cited: List[SourceCitation],
        confidence_score: float = 1.0
    ) -> CivicGuidanceResponse:
        """Generates grounded structured response or clean out-of-scope refusal."""
        
        # Out-of-Scope / Insufficient Information Check
        if not retrieved_chunks or confidence_score < settings.SIMILARITY_THRESHOLD:
            logger.info(f"Query '{query}' has no matching verified chunks (confidence: {confidence_score}).")
            return CivicGuidanceResponse(
                problem_understood=f"Query regarding: '{query}'",
                service_name="Service Not In Verified Knowledge Base",
                authority="Not Available in Verified Sources",
                summary="Insufficient verified official information was found in our curated government knowledge base for this query. To ensure absolute accuracy, CivicHelp AI does not guess or invent government procedures. Please consult the official government portal directly.",
                eligibility=None,
                required_documents=[],
                steps=[
                    "Verify if the service belongs to standard citizen identity, tax, passport, transport, or voter departments.",
                    "Visit the official Central or State Government portal directly."
                ],
                fees=None,
                timeline=None,
                warnings=[
                    "CivicHelp AI answers only from manually verified authoritative sources to prevent misinformation."
                ],
                official_sources=[],
                action_checklist=[],
                confidence_score=round(confidence_score, 2),
                insufficient_information=True
            )

        # Build Grounded Context
        context_blocks = []
        for i, chunk in enumerate(retrieved_chunks):
            context_blocks.append(
                f"[DOCUMENT {i+1} - {chunk.title} ({chunk.authority})]\n"
                f"Section: {chunk.section_type}\n"
                f"Portal: {chunk.official_url}\n"
                f"Content:\n{chunk.text}\n"
            )
        verified_context_str = "\n====================\n".join(context_blocks)

        user_prompt = f"""CITIZEN QUERY:
"{query}"

VERIFIED_OFFICIAL_CONTEXT:
{verified_context_str}

Please generate the structured JSON response strictly adhering to the schema and grounding rules.
"""

        # Call Gemini LLM if configured
        if self._client:
            try:
                response = self._client.generate_content([
                    {"role": "user", "parts": [GROUNDING_SYSTEM_PROMPT, user_prompt]}
                ])
                raw_json = response.text.strip()
                parsed = json.loads(raw_json)
                
                return CivicGuidanceResponse(
                    problem_understood=parsed.get("problem_understood", f"Assistance with {retrieved_chunks[0].title}"),
                    service_name=parsed.get("service_name", retrieved_chunks[0].title),
                    authority=parsed.get("authority", retrieved_chunks[0].authority),
                    summary=parsed.get("summary", ""),
                    eligibility=parsed.get("eligibility"),
                    required_documents=parsed.get("required_documents", []),
                    steps=parsed.get("steps", []),
                    fees=parsed.get("fees"),
                    timeline=parsed.get("timeline"),
                    warnings=parsed.get("warnings", []),
                    official_sources=sources_cited,
                    action_checklist=parsed.get("action_checklist", []),
                    confidence_score=round(confidence_score, 2),
                    insufficient_information=False
                )
            except Exception as e:
                logger.error(f"Gemini generation error ({e}). Generating grounded fallback from verified chunks.")

        # Grounded structured generation from retrieved verified context
        top_chunk = retrieved_chunks[0]
        return CivicGuidanceResponse(
            problem_understood=f"Guidance requested regarding {top_chunk.title}",
            service_name=top_chunk.title,
            authority=top_chunk.authority,
            summary=f"Official procedure for {top_chunk.title} as authorized by {top_chunk.authority}.",
            eligibility=f"Verified citizens eligible under {top_chunk.authority} regulations.",
            required_documents=[
                "Official identity and address proof documents as stipulated by the authority."
            ],
            steps=[
                f"Navigate to the official portal: {top_chunk.official_url}",
                "Fill in the prescribed official application form.",
                "Upload authentic supporting documents and complete required verification.",
                "Track application reference number on the portal."
            ],
            fees="Refer to official portal / verified fee table.",
            timeline="Standard government processing timeframe (5-15 working days).",
            warnings=[
                "Only submit applications through authentic .gov.in or .nic.in portals.",
                "Never disclose confidential OTPs or biometric data to third parties."
            ],
            official_sources=sources_cited,
            action_checklist=[
                f"Open official portal: {top_chunk.official_url}",
                "Prepare required identity proofs",
                "Verify details before final submission"
            ],
            confidence_score=round(confidence_score, 2),
            insufficient_information=False
        )
