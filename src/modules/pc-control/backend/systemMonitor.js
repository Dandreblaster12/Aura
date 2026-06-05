/**
 * AURA AI - System Monitor Module
 * Real-time system monitoring dashboard
 * J.A.R.V.I.S.-style holographic data display
 * Tracks: CPU, RAM, Disk, Network, GPU, Processes, Temperatures
 */

'use strict';

const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');

class SystemMonitor {
  constructor() {
    this.platform = process.platform;
    this._historySize = 60; // 60 samples
    this._samplingInterval = 1000; // 1 second
    this._history = {
      cpu: [],
      memory: [],
      disk: [],
      network: [],
    };
    this._prevNetworkStats = null;
    this._lastSampleTime = Date.now();
  }

  /**
   * Get current system snapshot
   */
  async getSnapshot() {
    const snapshot = {
      timestamp: Date.now(),
      cpu: await this.getCPU(),
      memory: await this.getMemory(),
      disk: await this.getDisk(),
      network: await this.getNetwork(),
      gpu: await this.getGPU(),
      processes: await this.getProcessSummary(),
      temperatures: await this.getTemperatures(),
      uptime: os.uptime(),
    };

    // Update history
    this._updateHistory(snapshot);

    return snapshot;
  }

  /**
   * Get historical data for charts
   */
  getHistory(duration = 30) {
    const samples = Math.min(duration, this._historySize);
    const history = {};

    for (const [key, values] of Object.entries(this._history)) {
      history[key] = values.slice(-samples);
    }

    return history;
  }

  /**
   * CPU monitoring data
   */
  async getCPU() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Calculate per-core usage
    const cpuUsage = await this._getCPUUsage();

    const cores = cpus.map((cpu, i) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return {
        core: i,
        model: cpu.model,
        speed: cpu.speed,
        usagePercent: total > 0 ? ((1 - idle / total) * 100).toFixed(1) : 0,
      };
    });

    return {
      usagePercent: cpuUsage,
      cores,
      count: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      loadAverage: {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2),
      },
    };
  }

  /**
   * Memory monitoring data
   */
  async getMemory() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get swap info if available
    let swapTotal = 0;
    let swapUsed = 0;
    let swapFree = 0;

    if (this.platform === 'linux') {
      try {
        const swapInfo = execSync('free -b | grep Swap', { encoding: 'utf8' });
        const parts = swapInfo.split(/\s+/);
        if (parts.length >= 4) {
          swapTotal = parseInt(parts[1]) || 0;
          swapUsed = parseInt(parts[2]) || 0;
          swapFree = parseInt(parts[3]) || 0;
        }
      } catch (e) {}
    }

    return {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usagePercent: ((usedMem / totalMem) * 100).toFixed(1),
      totalGB: (totalMem / 1073741824).toFixed(2),
      usedGB: (usedMem / 1073741824).toFixed(2),
      freeGB: (freeMem / 1073741824).toFixed(2),
      swap: {
        total: swapTotal,
        used: swapUsed,
        free: swapFree,
      },
    };
  }

  /**
   * Disk monitoring data
   */
  async getDisk() {
    const disks = [];

    if (this.platform === 'win32') {
      const result = execSync('wmic logicaldisk get Name,Size,FreeSpace /format:csv', { encoding: 'utf8', timeout: 5000 });
      const lines = result.split('\n').filter(l => l.trim());
      for (const line of lines.slice(1)) {
        const parts = line.split(',');
        if (parts.length >= 4 && parts[2] && parts[3]) {
          const total = parseInt(parts[2]);
          const free = parseInt(parts[3]);
          if (total > 0) {
            disks.push({
              drive: parts[1]?.trim(),
              total: total,
              used: total - free,
              free: free,
              usagePercent: ((total - free) / total * 100).toFixed(1),
              totalGB: (total / 1073741824).toFixed(2),
              freeGB: (free / 1073741824).toFixed(2),
            });
          }
        }
      }
    } else {
      const result = execSync('df -B1 --output=source,size,used,avail,pcent,target 2>/dev/null || df -B1 /', { encoding: 'utf8' });
      const lines = result.split('\n').filter(l => l.trim());
      for (const line of lines.slice(1)) {
        const parts = line.split(/\s+/);
        if (parts.length >= 5 && parts[1] !== '0') {
          const total = parseInt(parts[1]);
          const used = parseInt(parts[2]);
          const free = parseInt(parts[3]);
          if (total > 0) {
            disks.push({
              drive: parts[0],
              total,
              used,
              free,
              usagePercent: (used / total * 100).toFixed(1),
              totalGB: (total / 1073741824).toFixed(2),
              freeGB: (free / 1073741824).toFixed(2),
              mount: parts[5] || '',
            });
          }
        }
      }
    }

    return disks;
  }

  /**
   * Network monitoring data
   */
  async getNetwork() {
    const interfaces = os.networkInterfaces();
    const networkInfo = [];

    // Calculate network speed
    const currentBytes = this._getNetworkBytes();
    const now = Date.now();
    const elapsed = (now - this._lastSampleTime) / 1000;

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        const nonInternal = addrs.filter(a => !a.internal);
        if (nonInternal.length > 0) {
          const iface = nonInternal[0];
          const prevStats = this._prevNetworkStats ? this._prevNetworkStats[name] : null;
          
          const currentRx = currentBytes[name]?.rx || 0;
          const currentTx = currentBytes[name]?.tx || 0;
          
          let rxSpeed = 0;
          let txSpeed = 0;
          
          if (prevStats && elapsed > 0) {
            rxSpeed = Math.max(0, (currentRx - prevStats.rx) / elapsed);
            txSpeed = Math.max(0, (currentTx - prevStats.tx) / elapsed);
          }

          networkInfo.push({
            interface: name,
            address: iface.address,
            mac: iface.mac,
            rxBytes: currentRx,
            txBytes: currentTx,
            rxFriendly: this._formatBytes(currentRx),
            txFriendly: this._formatBytes(currentTx),
            rxSpeed: rxSpeed,
            txSpeed: txSpeed,
            rxSpeedFriendly: this._formatSpeed(rxSpeed),
            txSpeedFriendly: this._formatSpeed(txSpeed),
          });
        }
      }
    }

    this._prevNetworkStats = currentBytes;
    this._lastSampleTime = now;

    return {
      interfaces: networkInfo,
      hostname: os.hostname(),
    };
  }

  /**
   * Get network byte counts
   */
  _getNetworkBytes() {
    const stats = {};

    if (this.platform === 'linux') {
      try {
        const content = fs.readFileSync('/proc/net/dev', 'utf8');
        const lines = content.split('\n').filter(l => l.includes(':'));
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const name = parts[0].replace(':', '');
          stats[name] = {
            rx: parseInt(parts[1]) || 0,
            tx: parseInt(parts[9]) || 0,
          };
        }
      } catch (e) {}
    } else {
      // Fallback: return zeros
      const interfaces = os.networkInterfaces();
      for (const [name] of Object.entries(interfaces)) {
        stats[name] = { rx: 0, tx: 0 };
      }
    }

    return stats;
  }

  /**
   * GPU monitoring
   */
  async getGPU() {
    const gpus = [];

    // Try nvidia-smi first (cross-platform for NVIDIA)
    try {
      const result = execSync('nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader 2>/dev/null', { encoding: 'utf8', timeout: 5000 });
      const lines = result.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const parts = line.split(', ');
        if (parts.length >= 6) {
          gpus.push({
            index: parseInt(parts[0]),
            name: parts[1],
            utilization: parts[2],
            memoryUsed: parts[3],
            memoryTotal: parts[4],
            temperature: parts[5],
          });
        }
      }
    } catch (e) {
      // nvidia-smi not available
    }

    return gpus;
  }

  /**
   * Temperature monitoring
   */
  async getTemperatures() {
    const temps = [];

    if (this.platform === 'linux') {
      // Read from thermal zones
      try {
        const zones = fs.readdirSync('/sys/class/thermal').filter(d => d.startsWith('thermal_zone'));
        for (const zone of zones) {
          try {
            const type = fs.readFileSync(`/sys/class/thermal/${zone}/type`, 'utf8').trim();
            const temp = parseInt(fs.readFileSync(`/sys/class/thermal/${zone}/temp`, 'utf8').trim());
            if (temp > 0) {
              temps.push({
                name: type,
                tempC: (temp / 1000).toFixed(1),
                tempF: ((temp / 1000) * 9 / 5 + 32).toFixed(1),
              });
            }
          } catch (e) {}
        }
      } catch (e) {}

      // Try hwmon as well
      try {
        const hwmonDirs = fs.readdirSync('/sys/class/hwmon');
        for (const hwmon of hwmonDirs) {
          try {
            const name = fs.readFileSync(`/sys/class/hwmon/${hwmon}/name`, 'utf8').trim();
            const inputs = fs.readdirSync(`/sys/class/hwmon/${hwmon}`).filter(f => f.startsWith('temp') && f.endsWith('_input'));
            for (const input of inputs) {
              const label = fs.readFileSync(`/sys/class/hwmon/${hwmon}/${input.replace('_input', '_label')}`, 'utf8').trim();
              const temp = parseInt(fs.readFileSync(`/sys/class/hwmon/${hwmon}/${input}`, 'utf8').trim());
              temps.push({
                name: `${name}: ${label}`,
                tempC: (temp / 1000).toFixed(1),
                tempF: ((temp / 1000) * 9 / 5 + 32).toFixed(1),
              });
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    return temps;
  }

  /**
   * Process summary
   */
  async getProcessSummary() {
    let total = 0;
    let running = 0;

    if (this.platform === 'win32') {
      try {
        const result = execSync('tasklist /FO CSV', { encoding: 'utf8', timeout: 5000 });
        total = result.split('\n').filter(l => l.trim()).length - 1;
      } catch (e) {}
    } else {
      try {
        const result = execSync('ps aux | wc -l', { encoding: 'utf8' });
        total = parseInt(result) - 1;
        const runningResult = execSync('ps aux | grep -c "Rl"', { encoding: 'utf8' });
        running = parseInt(runningResult);
      } catch (e) {}
    }

    return {
      total,
      running,
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  async _getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = { idle: 0, total: 0 };
      const cpus1 = os.cpus();
      
      for (const cpu of cpus1) {
        for (const type in cpu.times) {
          startMeasure.total += cpu.times[type];
        }
        startMeasure.idle += cpu.times.idle;
      }

      setTimeout(() => {
        const endMeasure = { idle: 0, total: 0 };
        const cpus2 = os.cpus();
        
        for (const cpu of cpus2) {
          for (const type in cpu.times) {
            endMeasure.total += cpu.times[type];
          }
          endMeasure.idle += cpu.times.idle;
        }

        const idleDiff = endMeasure.idle - startMeasure.idle;
        const totalDiff = endMeasure.total - startMeasure.total;
        const usage = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;
        
        resolve(Math.round(usage * 10) / 10);
      }, 500);
    });
  }

  /**
   * Update history arrays
   */
  _updateHistory(snapshot) {
    this._history.cpu.push({
      time: snapshot.timestamp,
      value: snapshot.cpu.usagePercent,
    });
    
    this._history.memory.push({
      time: snapshot.timestamp,
      value: parseFloat(snapshot.memory.usagePercent),
    });

    if (snapshot.disk.length > 0) {
      this._history.disk.push({
        time: snapshot.timestamp,
        value: parseFloat(snapshot.disk[0].usagePercent),
      });
    }

    if (snapshot.network.interfaces.length > 0) {
      this._history.network.push({
        time: snapshot.timestamp,
        value: snapshot.network.interfaces[0].rxSpeed,
      });
    }

    // Trim history
    for (const key of Object.keys(this._history)) {
      if (this._history[key].length > this._historySize) {
        this._history[key].shift();
      }
    }
  }

  /**
   * Format bytes to human readable
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  _formatSpeed(bytesPerSec) {
    if (bytesPerSec === 0) return '0 B/s';
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(1024));
    return `${(bytesPerSec / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }
}

module.exports = new SystemMonitor();