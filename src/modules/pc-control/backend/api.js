/**
 * AURA AI - PC Control REST API Server
 * Express-style API for the frontend to communicate with system modules
 * J.A.R.V.I.S.-style holographic command center API
 */

'use strict';

const express = require('express');
const cors = require('cors');
const pcControl = require('./index');

/**
 * Create and configure the PC Control API router
 */
function createRouter() {
  const router = express.Router();

  // CORS for Electron/React frontend
  router.use(cors());
  router.use(express.json());

  // ============== System Status ==============

  // Get overall system report
  router.get('/status', async (req, res) => {
    try {
      const report = await pcControl.getSystemReport();
      res.json({ success: true, data: report });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get real-time snapshot
  router.get('/monitor/snapshot', async (req, res) => {
    try {
      const snapshot = await pcControl.monitor.getSnapshot();
      res.json({ success: true, data: snapshot });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get monitoring history
  router.get('/monitor/history', async (req, res) => {
    try {
      const duration = parseInt(req.query.duration) || 30;
      const history = pcControl.monitor.getHistory(duration);
      res.json({ success: true, data: history });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============== Hardware ==============

  // Full hardware deep scan
  router.get('/hardware/deep-scan', async (req, res) => {
    try {
      const scan = await pcControl.hardware.deepScan();
      res.json({ success: true, data: scan });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // CPU info
  router.get('/hardware/cpu', async (req, res) => {
    try {
      const info = await pcControl.hardware.getCPUInfo();
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GPU info
  router.get('/hardware/gpu', async (req, res) => {
    try {
      const info = await pcControl.hardware.getGPUInfo();
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Memory info
  router.get('/hardware/memory', async (req, res) => {
    try {
      const info = await pcControl.hardware.getMemoryInfo();
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Storage info
  router.get('/hardware/storage', async (req, res) => {
    try {
      const info = await pcControl.hardware.getStorageInfo();
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Temperatures
  router.get('/hardware/temperatures', async (req, res) => {
    try {
      const temps = await pcControl.hardware.getTemperatures();
      res.json({ success: true, data: temps });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // System/OS info
  router.get('/hardware/system', async (req, res) => {
    try {
      const info = await pcControl.hardware.getSystemInfo();
      const osInfo = await pcControl.hardware.getOSInfo();
      res.json({ success: true, data: { system: info, os: osInfo } });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Top processes
  router.get('/hardware/processes', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const processes = await pcControl.hardware.getTopProcesses(limit);
      res.json({ success: true, data: processes });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============== App Launcher ==============

  // Launch an app
  router.post('/launch', async (req, res) => {
    try {
      const { app, args } = req.body;
      if (!app) {
        return res.status(400).json({ success: false, error: 'App name required' });
      }
      const result = await pcControl.launcher.launch(app, args || []);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Search apps
  router.get('/launch/search', async (req, res) => {
    try {
      const query = req.query.q || '';
      const results = await pcControl.launcher.searchApps(query);
      res.json({ success: true, data: results });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Kill an app
  router.post('/launch/kill', async (req, res) => {
    try {
      const { app } = req.body;
      if (!app) {
        return res.status(400).json({ success: false, error: 'App name required' });
      }
      const result = await pcControl.launcher.killApp(app);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // List running apps
  router.get('/launch/running', async (req, res) => {
    try {
      const apps = await pcControl.launcher.listRunning();
      res.json({ success: true, data: apps });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============== File Manager ==============

  // List directory
  router.get('/files/list', async (req, res) => {
    try {
      const dirPath = req.query.path || '';
      const listing = await pcControl.files.listDir(dirPath);
      res.json({ success: true, data: listing });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Search files
  router.get('/files/search', async (req, res) => {
    try {
      const options = {
        pattern: req.query.q || '',
        rootDir: req.query.root || '',
        maxResults: parseInt(req.query.limit) || 100,
        fileTypes: req.query.types ? req.query.types.split(',') : [],
      };
      const results = await pcControl.files.searchFiles(options);
      res.json({ success: true, data: results });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get file info
  router.get('/files/info', async (req, res) => {
    try {
      const filePath = req.query.path || '';
      const info = await pcControl.files.getInfo(filePath);
      res.json({ success: true, data: info });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Copy files
  router.post('/files/copy', async (req, res) => {
    try {
      const { source, destination } = req.body;
      const result = await pcControl.files.copy(source, destination);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Move files
  router.post('/files/move', async (req, res) => {
    try {
      const { source, destination } = req.body;
      const result = await pcControl.files.move(source, destination);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete files
  router.post('/files/delete', async (req, res) => {
    try {
      const { paths, permanent } = req.body;
      const result = await pcControl.files.delete(paths, permanent);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create directory
  router.post('/files/mkdir', async (req, res) => {
    try {
      const { path: dirPath } = req.body;
      const result = await pcControl.files.createDir(dirPath);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create file
  router.post('/files/create', async (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      const result = await pcControl.files.createFile(filePath, content || '');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Read file
  router.get('/files/read', async (req, res) => {
    try {
      const filePath = req.query.path || '';
      const result = await pcControl.files.readFile(filePath);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Open file with default app
  router.post('/files/open', async (req, res) => {
    try {
      const { path: filePath } = req.body;
      const result = await pcControl.files.open(filePath);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Quick access directories
  router.get('/files/quick-access', async (req, res) => {
    try {
      const dirs = await pcControl.files.getQuickAccess();
      res.json({ success: true, data: dirs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============== Script Runner ==============

  // Run a command
  router.post('/scripts/run', async (req, res) => {
    try {
      const { command, options } = req.body;
      if (!command) {
        return res.status(400).json({ success: false, error: 'Command required' });
      }
      const result = await pcControl.scripts.runCommand(command, options);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Run inline code
  router.post('/scripts/run-code', async (req, res) => {
    try {
      const { code, language, options } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: 'Code required' });
      }
      const result = await pcControl.scripts.runInlineCode(code, language, options);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Run a script file
  router.post('/scripts/run-file', async (req, res) => {
    try {
      const { scriptPath, args, options } = req.body;
      if (!scriptPath) {
        return res.status(400).json({ success: false, error: 'Script path required' });
      }
      const result = await pcControl.scripts.runScript(scriptPath, args, options);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get supported languages
  router.get('/scripts/languages', async (req, res) => {
    try {
      const languages = pcControl.scripts.getSupportedLanguages();
      res.json({ success: true, data: languages });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get script history
  router.get('/scripts/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const history = pcControl.scripts.getHistory(limit);
      res.json({ success: true, data: history });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============== System Optimization ==============

  // Full optimization
  router.post('/optimize/full', async (req, res) => {
    try {
      const result = await pcControl.optimizer.runFullOptimization();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clean temp files
  router.post('/optimize/clean-temp', async (req, res) => {
    try {
      const result = await pcControl.optimizer.cleanTempFiles();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Optimize startup
  router.post('/optimize/startup', async (req, res) => {
    try {
      const result = await pcControl.optimizer.optimizeStartup();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Tune performance
  router.post('/optimize/performance', async (req, res) => {
    try {
      const result = await pcControl.optimizer.tunePerformance();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clean disk
  router.post('/optimize/disk', async (req, res) => {
    try {
      const result = await pcControl.optimizer.cleanDisk();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Optimize memory
  router.post('/optimize/memory', async (req, res) => {
    try {
      const result = await pcControl.optimizer.optimizeMemory();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get performance score
  router.get('/optimize/score', async (req, res) => {
    try {
      const score = await pcControl.optimizer.getPerformanceScore();
      res.json({ success: true, data: score });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get startup items
  router.get('/optimize/startup-items', async (req, res) => {
    try {
      const items = await pcControl.optimizer.getStartupItems();
      res.json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ============== Voice Command Endpoint ==============

  // Execute a natural language voice command
  router.post('/voice-command', async (req, res) => {
    try {
      const { command } = req.body;
      if (!command) {
        return res.status(400).json({ success: false, error: 'Voice command text required' });
      }
      const result = await pcControl.executeVoiceCommand(command);
      res.json({ success: true, data: result, command });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

// Export for integration into main server
module.exports = { createRouter, pcControl };