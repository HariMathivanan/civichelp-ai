const s3Service = require('../services/s3Service');
const aiServiceClient = require('../services/aiServiceClient');

async function getVaultStatus(req, res, next) {
  try {
    const status = await s3Service.getVaultStatus();
    return res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}

async function syncVault(req, res, next) {
  try {
    // 1. Sync local knowledge vault to Amazon S3
    const s3Result = await s3Service.syncVaultToS3();

    // 2. Trigger fresh ingestion in FastAPI RAG engine
    let aiIngestResult = null;
    try {
      aiIngestResult = await aiServiceClient.triggerIngest();
    } catch (err) {
      aiIngestResult = {
        status: 'warning',
        message: 'Uploaded to S3, but AI service ingest trigger timed out or was offline.'
      };
    }

    return res.status(200).json({
      ...s3Result,
      rag_ingestion: aiIngestResult
    });
  } catch (error) {
    next(error);
  }
}

async function getDocument(req, res, next) {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ error: 'Missing document key parameter' });
    }

    const document = await s3Service.fetchDocumentFromS3(key);
    return res.status(200).json(document);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getVaultStatus,
  syncVault,
  getDocument
};
