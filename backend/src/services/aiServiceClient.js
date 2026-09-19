const axios = require('axios');
const config = require('../config/env');

const aiClient = axios.create({
  baseURL: config.FASTAPI_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function checkHealth() {
  try {
    const response = await aiClient.get('/health');
    return { isHealthy: true, data: response.data };
  } catch (error) {
    return {
      isHealthy: false,
      error: error.message,
      code: error.code
    };
  }
}

async function analyzeQuery(query, language = 'en') {
  const response = await aiClient.post('/rag/query', {
    query,
    language
  });
  return response.data;
}

async function getSources() {
  const response = await aiClient.get('/rag/sources');
  return response.data;
}

async function triggerIngest() {
  const response = await aiClient.post('/rag/ingest');
  return response.data;
}

module.exports = {
  checkHealth,
  analyzeQuery,
  getSources,
  triggerIngest
};
