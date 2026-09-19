const fs = require('fs');
const path = require('path');
const aiServiceClient = require('../services/aiServiceClient');
const config = require('../config/env');

async function analyzeCivicQuery(req, res, next) {
  try {
    const query = req.sanitizedQuery || req.body.query;
    const language = req.body.language || 'en';

    if (!query) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A valid citizen query is required.'
      });
    }

    const aiResponse = await aiServiceClient.analyzeQuery(query, language);

    return res.status(200).json({
      ...aiResponse,
      gateway_meta: {
        pii_detected_and_redacted: req.piiDetected || false,
        processed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getVerifiedServices(req, res, next) {
  try {
    // Attempt to fetch live from FastAPI RAG service
    const aiSources = await aiServiceClient.getSources().catch(() => null);

    if (aiSources && aiSources.sources && aiSources.sources.length > 0) {
      return res.status(200).json({
        source: 'ai-service',
        count: aiSources.count,
        services: aiSources.sources
      });
    }

    // Fallback directly to local registry.json if AI service is bootstrapping
    const registryPath = path.join(config.KNOWLEDGE_VAULT_PATH, 'registry.json');
    if (fs.existsSync(registryPath)) {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
      return res.status(200).json({
        source: 'knowledge-vault-manifest',
        count: registry.sources.length,
        services: registry.sources
      });
    }

    return res.status(200).json({
      source: 'empty',
      count: 0,
      services: []
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeCivicQuery,
  getVerifiedServices
};
