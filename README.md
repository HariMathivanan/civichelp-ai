# CivicHelp AI

CivicHelp AI helps citizens understand government services by turning
complicated official information into simple, actionable,
step-by-step guidance.

## Current Status

Built during the WeMakeDevs First Commit 2026 hackathon.

## Architecture

```
React (Vite)
  ↓
Express (Node.js API Gateway)
  ↓
FastAPI RAG Service
  ↓
pgvector / Local Cosine Similarity Fallback
  ↓
Google Gemini

and separately:

Express
  ↓
AWS SDK for JavaScript v3 (@aws-sdk/client-s3)
  ↓
LocalStack (S3-compatible local API)
  ↓
7 Verified Government Scheme Documents
```

> **AWS Integration Note**: CivicHelp uses the AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`) to interact with an S3-compatible LocalStack environment locally. This allows the same AWS API integration to be developed and demonstrated without connecting to AWS cloud.

### Features & Implemented Stack
- **Knowledge Vault**: 6 verified citizen services + master manifest with 2026 fee revisions
- **Python FastAPI RAG**: Semantic embeddings (`all-MiniLM-L6-v2`), vector retrieval, grounded generation (`gemini-1.5-flash`)
- **Safety Guardrails**: Dual-layer PII sanitization (redacting Aadhaar, PAN, and credentials)
- **Node.js Express Gateway**: Proxy, validation, PII scrubbing, AWS SDK v3 vault status/sync
- **React Frontend**: Citizen-friendly structured cards, interactive action checklist, English/Tamil support
- **LocalStack S3 Integration**: AWS SDK v3 document vault management and synchronization

## AI Development Disclosure

CivicHelp AI was developed during the WeMakeDevs First Commit
hackathon with assistance from Google Antigravity.

AI tools were used for code generation, debugging assistance,
documentation, and development workflow support.

All generated code was reviewed, tested, modified where necessary,
and understood by the project author.