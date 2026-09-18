# CivicHelp AI — AWS S3 Knowledge Vault Specification

This document details the exact Amazon S3 resource configuration, pricing/cost breakdown, CLI commands, and teardown steps.

---

## 1. Resource Specification

* **Resource**: Amazon S3 Bucket (Standard Storage Class)
* **Bucket Name Pattern**: `civichelp-knowledge-vault-<your-account-id-or-initials>`
* **Region**: `ap-south-1` (Asia Pacific - Mumbai) or `us-east-1`
* **Purpose**: Immutable, cloud-hosted document repository for authoritative citizen service JSON factsheets.
* **Objects to Store**:
  * `schemes/aadhaar_lost_pvc.json`
  * `schemes/aadhaar_address_mobile_update.json`
  * `schemes/pan_card_services.json`
  * `schemes/passport_services.json`
  * `schemes/driving_licence_services.json`
  * `schemes/voter_id_services.json`
  * `metadata/registry.json`

---

## 2. Rigorous Cost & Pricing Analysis

| Metric | Hackathon Usage Estimate | AWS Free Tier Allowance (12 Mo.) | Out-of-Free-Tier Standard Rate | Total Expected Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Storage** | ~60 KB (7 JSON files) | Up to 5 GB / month | $0.023 per GB/month | **$0.00000138** |
| **PUT Requests** | ~10 to 20 uploads (syncs) | 2,000 PUT requests / month | $0.005 per 1,000 requests | **$0.0001** |
| **GET Requests** | ~100 to 200 demo queries | 20,000 GET requests / month | $0.0004 per 1,000 requests | **$0.00008** |
| **Data Transfer Out** | < 1 MB | 100 GB / month free | $0.09 per GB | **$0.00** |
| **Total Cost** | — | — | — | **< $0.0002 (~₹0.02)** |

*Under the AWS Free Tier, the actual charge will be **$0.00**.*

---

## 3. Exact AWS CLI Commands (Ready for Execution)

### A. Create the S3 Bucket
```bash
aws s3api create-bucket \
    --bucket civichelp-knowledge-vault-prod \
    --region ap-south-1 \
    --create-bucket-configuration LocationConstraint=ap-south-1
```
*(If using `us-east-1`, omit `--create-bucket-configuration`)*

### B. Upload/Sync Local Knowledge Vault to S3
```bash
aws s3 sync ./knowledge_vault s3://civichelp-knowledge-vault-prod/schemes/ --exclude "registry.json"
aws s3 cp ./knowledge_vault/registry.json s3://civichelp-knowledge-vault-prod/metadata/registry.json
```

### C. Verify Bucket Contents
```bash
aws s3 ls s3://civichelp-knowledge-vault-prod/ --recursive
```

---

## 4. Teardown / Deletion Commands (Post-Hackathon)

To immediately terminate and delete all created AWS resources so no future cost is ever incurred:

```bash
# Deletes all objects and removes the bucket in one command
aws s3 rb s3://civichelp-knowledge-vault-prod --force
```

---

## 5. Security & Access Rules
* **No Public Write Access**: The bucket is private.
* **Authentication**: Application accesses S3 using standard IAM credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) stored strictly in `.env` (never committed to Git).
