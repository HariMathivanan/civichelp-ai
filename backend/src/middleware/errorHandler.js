function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err.stack || err.message);

  if (err.isAxiosError) {
    if (err.response) {
      return res.status(err.response.status).json({
        error: 'AI Service Error',
        message: err.response.data?.detail || err.response.data?.message || 'Error from RAG service',
        statusCode: err.response.status
      });
    } else if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'FastAPI RAG AI Service is currently offline. Please ensure the Python service is running on port 8000.',
        statusCode: 503
      });
    }
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
    statusCode
  });
}

module.exports = errorHandler;
