#!/usr/bin/env node

/**
 * AURA AI - PC Control API Server
 * Standalone Express server exposing PC control capabilities
 * Default port: 3001
 * 
 * Start with: node server.js
 * Or: npm start
 */

const express = require('express');
const cors = require('cors');
const { createRouter } = require('./api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount PC Control API
const pcControlRouter = createRouter();
app.use('/api/pc-control', pcControlRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    module: 'AURA AI - PC Control',
    version: '1.0.0',
    platform: process.platform,
    timestamp: Date.now(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'AURA AI - PC Command & Control Module',
    description: 'J.A.R.V.I.S.-style system control center',
    version: '1.0.0',
    platform: process.platform,
    endpoints: {
      health: 'GET /health',
      status: 'GET /api/pc-control/status',
      monitor: 'GET /api/pc-control/monitor/snapshot',
      hardware: 'GET /api/pc-control/hardware/deep-scan',
      launch: 'POST /api/pc-control/launch',
      files: 'GET /api/pc-control/files/list',
      scripts: 'POST /api/pc-control/scripts/run',
      optimize: 'POST /api/pc-control/optimize/full',
      voice: 'POST /api/pc-control/voice-command',
    },
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ╔═══════════════════════════════════════════════╗`);
  console.log(`  ║  AURA AI - PC Command & Control Module      ║`);
  console.log(`  ║  J.A.R.V.I.S. System Online                 ║`);
  console.log(`  ║                                             ║`);
  console.log(`  ║  API:      http://0.0.0.0:${PORT}              ║`);
  console.log(`  ║  Health:   http://0.0.0.0:${PORT}/health      ║`);
  console.log(`  ║  Platform: ${process.platform.padEnd(27)}║`);
  console.log(`  ╚═══════════════════════════════════════════════╝\n`);
});

module.exports = app;