const aiServiceClient = require('../services/aiServiceClient');
const { isAwsConfigured } = require('../config/s3Client');
const config = require('../config/env');

async function getHealth(req, res) {
  const aiHealth = await aiServiceClient.checkHealth();

  const isHealthy = true; // Gateway itself is healthy

  return res.status(200).json({
    status: 'healthy',
    gateway: {
      name: 'CivicHelp AI - API Gateway',
      environment: config.NODE_ENV,
      port: config.PORT,
      timestamp: new Date().toISOString()
    },
    services: {
      aiService: {
        reachable: aiHealth.isHealthy,
        url: config.FASTAPI_URL,
        details: aiHealth.data || null,
        error: aiHealth.error || null
      },
      awsS3: {
        configured: isAwsConfigured(),
        bucket: config.AWS_S3_BUCKET_NAME,
        region: config.AWS_REGION
      }
    }
  });
}

module.exports = {
  getHealth
};
