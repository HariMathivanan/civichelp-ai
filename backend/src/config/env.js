const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FASTAPI_URL: process.env.FASTAPI_URL || 'http://localhost:8000',
  
  // AWS / S3-compatible LocalStack Configuration
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'civichelp-knowledge-vault-prod',
  AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL || process.env.AWS_ENDPOINT_URL_S3 || '',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  
  // Knowledge Vault Local Directory Path
  KNOWLEDGE_VAULT_PATH: path.resolve(__dirname, '../../../knowledge_vault')
};

module.exports = config;
