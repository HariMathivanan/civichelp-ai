import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.schemas.civic_schema import KnowledgeChunk

logger = logging.getLogger(__name__)

class KnowledgeLoader:
    """Loads authoritative citizen scheme JSON files and parses them into semantic chunks."""

    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)

    def load_sources_and_chunks(self) -> Tuple[List[Dict[str, Any]], List[KnowledgeChunk]]:
        registry_file = self.vault_path / "registry.json"
        if not registry_file.exists():
            raise FileNotFoundError(f"Registry not found at {registry_file}")

        with open(registry_file, "r", encoding="utf-8") as f:
            registry = json.load(f)

        sources = []
        chunks = []

        for item in registry.get("sources", []):
            file_path = self.vault_path / item["file_name"]
            if not file_path.exists():
                logger.warning(f"Knowledge file missing: {file_path}")
                continue

            with open(file_path, "r", encoding="utf-8") as f:
                doc = json.load(f)

            sources.append(doc)
            doc_chunks = self._chunk_document(doc)
            chunks.extend(doc_chunks)

        logger.info(f"Loaded {len(sources)} sources and created {len(chunks)} chunks.")
        return sources, chunks

    def _chunk_document(self, doc: Dict[str, Any]) -> List[KnowledgeChunk]:
        chunks: List[KnowledgeChunk] = []
        doc_id = doc["id"]
        title = doc["title"]
        authority = doc["authority"]
        category = doc["category"]
        official_url = doc["official_url"]
        slug = doc["slug"]

        # Chunk 1: Overview & Eligibility
        overview_text = (
            f"Service: {title}\n"
            f"Authority: {authority}\n"
            f"Category: {category}\n"
            f"Overview: {doc.get('overview', '')}\n"
            f"Eligibility: {doc.get('eligibility', '')}\n"
            f"Official Portal: {doc.get('official_portal_name', '')} ({official_url})"
        )
        chunks.append(
            KnowledgeChunk(
                id=f"{doc_id}_overview",
                source_id=doc_id,
                slug=slug,
                title=title,
                authority=authority,
                category=category,
                official_url=official_url,
                section_type="overview_and_eligibility",
                text=overview_text,
                metadata={"last_verified_at": doc.get("last_verified_at", "")}
            )
        )

        # Chunk 2: Fees & Timeline
        fees = doc.get("fees", {})
        timeline = doc.get("timeline", {})
        fees_text = (
            f"Service: {title}\n"
            f"Authority: {authority}\n"
            f"Official Fees: {fees.get('amount', 'Free of cost')}\n"
            f"Fee Details: {fees.get('breakdown', '')}\n"
            f"Payment Mode: {fees.get('payment_mode', '')}\n"
            f"Processing Timeline: {timeline.get('dispatch', '')} {timeline.get('delivery', '')}"
        )
        chunks.append(
            KnowledgeChunk(
                id=f"{doc_id}_fees_timeline",
                source_id=doc_id,
                slug=slug,
                title=title,
                authority=authority,
                category=category,
                official_url=official_url,
                section_type="fees_and_timeline",
                text=fees_text,
                metadata={"last_verified_at": doc.get("last_verified_at", "")}
            )
        )

        # Chunk 3: Required Documents
        docs_list = "\n- ".join(doc.get("required_documents", []))
        docs_text = (
            f"Service: {title}\n"
            f"Authority: {authority}\n"
            f"Mandatory Required Documents:\n- {docs_list}\n"
            f"Official Source: {official_url}"
        )
        chunks.append(
            KnowledgeChunk(
                id=f"{doc_id}_documents",
                source_id=doc_id,
                slug=slug,
                title=title,
                authority=authority,
                category=category,
                official_url=official_url,
                section_type="required_documents",
                text=docs_text,
                metadata={"last_verified_at": doc.get("last_verified_at", "")}
            )
        )

        # Chunk 4: Step-by-Step Procedure
        steps_list = "\n".join([f"{i+1}. {step}" for i, step in enumerate(doc.get("steps", []))])
        steps_text = (
            f"Service: {title}\n"
            f"Authority: {authority}\n"
            f"Official Step-by-Step Procedure:\n{steps_list}\n"
            f"Official Portal Link: {official_url}"
        )
        chunks.append(
            KnowledgeChunk(
                id=f"{doc_id}_steps",
                source_id=doc_id,
                slug=slug,
                title=title,
                authority=authority,
                category=category,
                official_url=official_url,
                section_type="procedure_steps",
                text=steps_text,
                metadata={"last_verified_at": doc.get("last_verified_at", "")}
            )
        )

        # Chunk 5: Warnings & Fraud Advisory
        warnings_list = "\n- ".join(doc.get("warnings_and_fraud_prevention", []))
        warnings_text = (
            f"Service: {title}\n"
            f"Authority: {authority}\n"
            f"Important Warnings & Anti-Fraud Advisory:\n- {warnings_list}\n"
            f"Official URL: {official_url}"
        )
        chunks.append(
            KnowledgeChunk(
                id=f"{doc_id}_warnings",
                source_id=doc_id,
                slug=slug,
                title=title,
                authority=authority,
                category=category,
                official_url=official_url,
                section_type="warnings_and_fraud",
                text=warnings_text,
                metadata={"last_verified_at": doc.get("last_verified_at", "")}
            )
        )

        return chunks
