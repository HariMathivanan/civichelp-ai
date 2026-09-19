const app = require('./app');
const config = require('./config/env');

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CivicHelp AI Express Gateway running on port ${PORT}`);
  console.log(`📡 Connected FastAPI RAG URL: ${config.FASTAPI_URL}`);
  console.log(`☁️  Target AWS S3 Bucket: ${config.AWS_S3_BUCKET_NAME} (${config.AWS_REGION})`);
  console.log(`🌍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

// Handle graceful termination
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = server;
