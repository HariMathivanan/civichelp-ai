const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const civicRoutes = require('./routes/civicRoutes');
const awsRoutes = require('./routes/awsRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount API Routes under /api
app.use('/api', healthRoutes);
app.use('/api', civicRoutes);
app.use('/api', awsRoutes);

// Static Asset Serving for Compiled React Frontend (frontend/dist)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const hasBuiltFrontend = fs.existsSync(frontendDistPath);

if (hasBuiltFrontend) {
  // Serve static files from frontend/dist
  app.use(express.static(frontendDistPath));

  // SPA Fallback: All non-API GET requests return index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Development fallback when frontend is not yet built
  app.get('/', (req, res) => {
    res.status(200).json({
      message: 'CivicHelp AI — API Gateway & Knowledge Vault Service',
      docs: '/api/health',
      version: '1.0.0',
      note: 'Frontend build not detected in frontend/dist. Run npm run build in frontend/ for production static serving.'
    });
  });
}

// 404 Route Handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Catch-all 404 for any remaining non-GET requests
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
