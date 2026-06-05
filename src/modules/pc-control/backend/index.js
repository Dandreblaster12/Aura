/**
 * AURA AI - PC Control Module
 * Main entry point that exports all system control capabilities
 * J.A.R.V.I.S.-style PC Command & Control Center
 */

'use strict';

const hardwareScanner = require('./hardwareScanner');
const appLauncher = require('./appLauncher');
const fileManager = require('./fileManager');
const scriptRunner = require('./scriptRunner');
const systemOptimizer = require('./systemOptimizer');
const systemMonitor = require('./systemMonitor');

class PCControlModule {
  constructor() {
    this.hardware = hardwareScanner;
    this.launcher = appLauncher;
    this.files = fileManager;
    this.scripts = scriptRunner;
    this.optimizer = systemOptimizer;
    this.monitor = systemMonitor;
    this.initialized = true;
  }

  /**
   * Initialize the PC Control module
   */
  async init() {
    console.log('[AURA] PC Control module initialized');
    return {
      status: 'ready',
      platform: process.platform,
      hostname: require('os').hostname(),
      modules: [
        'hardwareScanner',
        'appLauncher',
        'fileManager',
        'scriptRunner',
        'systemOptimizer',
        'systemMonitor',
      ],
    };
  }

  /**
   * Get full system report (for voice query: "What's my system status?")
   */
  async getSystemReport() {
    const snapshot = await this.monitor.getSnapshot();
    const info = await this.hardware.getSystemInfo();
    const osInfo = await this.hardware.getOSInfo();
    
    return {
      summary: `System: ${osInfo.platform} ${osInfo.version} | CPU: ${snapshot.cpu.model} (${snapshot.cpu.count} cores) at ${snapshot.cpu.usagePercent}% | RAM: ${snapshot.memory.usedGB}/${snapshot.memory.totalGB} GB (${snapshot.memory.usagePercent}%) | Uptime: ${this._formatUptime(os.uptime())}`,
      detailed: {
        system: info,
        os: osInfo,
        cpu: snapshot.cpu,
        memory: snapshot.memory,
        disk: snapshot.disk,
        processes: snapshot.processes,
      },
    };
  }

  /**
   * Execute a voice command (main entry point for voice control)
   */
  async executeVoiceCommand(command) {
    const lower = command.toLowerCase().trim();
    
    // Pattern matching for common commands
    if (lower.startsWith('launch ') || lower.startsWith('open ')) {
      const appName = lower.replace(/^(launch|open)\s+/, '');
      return await this.launcher.launch(appName);
    }
    
    if (lower.startsWith('kill ') || lower.startsWith('close ') || lower.startsWith('stop ')) {
      const appName = lower.replace(/^(kill|close|stop)\s+/, '');
      return await this.launcher.killApp(appName);
    }

    if (lower.includes('system status') || lower.includes('system report') || lower === 'status') {
      return await this.getSystemReport();
    }

    if (lower.includes('system scan') || lower.includes('deep scan') || lower.includes('hardware scan')) {
      return await this.hardware.deepScan();
    }

    if (lower.includes('optimize') || lower.includes('clean up') || lower.includes('performance')) {
      return await this.optimizer.runFullOptimization();
    }

    if (lower.includes('disk') || lower.includes('storage')) {
      return await this.hardware.getStorageInfo();
    }

    if (lower.includes('memory') || lower.includes('ram')) {
      return await this.hardware.getMemoryInfo();
    }

    if (lower.includes('cpu') || lower.includes('processor')) {
      const cpu = await this.hardware.getCPUInfo();
      const snapshot = await this.monitor.getCPU();
      return { ...cpu, currentUsage: snapshot.usagePercent };
    }

    if (lower.includes('gpu') || lower.includes('graphics') || lower.includes('video card')) {
      return await this.hardware.getGPUInfo();
    }

    if (lower.includes('temperature') || lower.includes('temp') || lower.includes('heat')) {
      return await this.hardware.getTemperatures();
    }

    if (lower.includes('process') || lower.includes('running')) {
      return await this.hardware.getTopProcesses(15);
    }

    if (lower.includes('list files') || lower.includes('browse files') || lower.includes('show files')) {
      const dirMatch = lower.match(/in\s+(.+)/i);
      const dir = dirMatch ? dirMatch[1] : require('os').homedir();
      return await this.files.listDir(dir);
    }

    // Default: try to launch as an app
    return await this.launcher.launch(lower);
  }

  _formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }
}

// Export a singleton instance
const pcControl = new PCControlModule();
module.exports = pcControl;

// Export individual modules for direct access
module.exports.hardwareScanner = hardwareScanner;
module.exports.appLauncher = appLauncher;
module.exports.fileManager = fileManager;
module.exports.scriptRunner = scriptRunner;
module.exports.systemOptimizer = systemOptimizer;
module.exports.systemMonitor = systemMonitor;