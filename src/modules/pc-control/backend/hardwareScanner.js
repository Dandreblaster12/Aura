/**
 * AURA AI - Hardware Scanner Module
 * J.A.R.V.I.S.-style deep system scan engine
 * 
 * Cross-platform: Windows (primary), Linux/macOS (secondary)
 * Scans: CPU, GPU, RAM, Storage, Motherboard, Network, Temperatures
 */

'use strict';

const os = require('os');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class HardwareScanner {
  constructor() {
    this.platform = process.platform;
    this.cache = {};
    this.cacheTTL = 5000; // 5 second cache
  }

  /**
   * Run a command and return stdout, handling errors gracefully
   */
  _exec(cmd) {
    try {
      return execSync(cmd, { encoding: 'utf8', timeout: 10000 }).trim();
    } catch (err) {
      return null;
    }
  }

  /**
   * Full system deep-scan
   */
  async deepScan() {
    const scan = {
      timestamp: Date.now(),
      system: await this.getSystemInfo(),
      cpu: await this.getCPUInfo(),
      gpu: await this.getGPUInfo(),
      memory: await this.getMemoryInfo(),
      storage: await this.getStorageInfo(),
      network: await this.getNetworkInfo(),
      temps: await this.getTemperatures(),
      processes: await this.getTopProcesses(),
      os: await this.getOSInfo(),
    };
    return scan;
  }

  /**
   * Basic system info
   */
  async getSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      loadavg: os.loadavg(),
    };
  }

  /**
   * CPU information
   */
  async getCPUInfo() {
    const cpus = os.cpus();
    const model = cpus.length > 0 ? cpus[0].model : 'Unknown';
    const cores = cpus.length;
    const physicalCores = this._getPhysicalCores();

    // Get CPU usage percentage
    const cpuUsage = await this._getCPUUsage();

    // Get CPU speed
    const speed = cpus.length > 0 ? cpus[0].speed : 0;

    return {
      model,
      cores,
      physicalCores,
      logicalCores: cores,
      speedMHz: speed,
      speedGHz: (speed / 1000).toFixed(2),
      usagePercent: cpuUsage,
      architecture: os.arch(),
    };
  }

  /**
   * Get physical core count (platform-specific)
   */
  _getPhysicalCores() {
    if (this.platform === 'win32') {
      const result = this._exec('wmic cpu get NumberOfCores');
      if (result) {
        const match = result.match(/(\d+)/);
        if (match) return parseInt(match[1]);
      }
    } else if (this.platform === 'linux') {
      const result = this._exec('lscpu | grep "Core(s) per socket"');
      if (result) {
        const match = result.match(/(\d+)/);
        if (match) return parseInt(match[1]);
      }
    } else if (this.platform === 'darwin') {
      const result = this._exec('sysctl -n hw.physicalcpu');
      if (result) return parseInt(result);
    }
    return os.cpus().length; // fallback
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
        const usage = totalDiff > 0 ? 100 - (idleDiff / totalDiff) * 100 : 0;
        
        resolve(Math.round(usage * 10) / 10);
      }, 500);
    });
  }

  /**
   * GPU information
   */
  async getGPUInfo() {
    const gpus = [];

    if (this.platform === 'win32') {
      const result = this._exec('wmic path win32_VideoController get Name,AdapterRAM,DriverVersion,VideoModeDescription,CurrentHorizontalResolution,CurrentVerticalResolution /format:csv');
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines.slice(1)) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            gpus.push({
              name: parts[1]?.trim() || 'Unknown',
              vramMB: parts[2] ? Math.round(parseInt(parts[2]) / 1048576) : 'Unknown',
              driverVersion: parts[3]?.trim() || 'Unknown',
              resolution: parts[4] && parts[5] ? `${parts[4]}x${parts[5]}` : 'Unknown',
            });
          }
        }
      }
      
      // Fallback: try nvidia-smi
      const nvidia = this._exec('nvidia-smi --query-gpu=name,memory.total,driver_version,temperature.gpu --format=csv,noheader 2>nul');
      if (nvidia && gpus.length === 0) {
        const lines = nvidia.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const parts = line.split(', ');
          gpus.push({
            name: parts[0]?.trim() || 'NVIDIA GPU',
            vramMB: parts[1] ? this._parseVRAM(parts[1]) : 'Unknown',
            driverVersion: parts[2]?.trim() || 'Unknown',
            tempC: parts[3] ? parseInt(parts[3]) : null,
          });
        }
      }
    } else if (this.platform === 'linux') {
      const lspci = this._exec('lspci | grep -E "VGA|3D|Display"');
      if (lspci) {
        const lines = lspci.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const name = line.replace(/.*: /, '').trim();
          gpus.push({ name, vramMB: 'Unknown' });
        }
      }
      
      // Try nvidia-smi on Linux
      const nvidia = this._exec('nvidia-smi --query-gpu=name,memory.total,driver_version,temperature.gpu --format=csv,noheader 2>/dev/null');
      if (nvidia && gpus.length === 0) {
        const lines = nvidia.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const parts = line.split(', ');
          gpus.push({
            name: parts[0]?.trim() || 'NVIDIA GPU',
            vramMB: parts[1] ? this._parseVRAM(parts[1]) : 'Unknown',
            driverVersion: parts[2]?.trim() || 'Unknown',
            tempC: parts[3] ? parseInt(parts[3]) : null,
          });
        }
      }
    } else if (this.platform === 'darwin') {
      const result = this._exec('system_profiler SPDisplaysDataType | grep -E "Chipset Model|VRAM"');
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (let i = 0; i < lines.length; i += 2) {
          const name = lines[i]?.replace(/Chipset Model:\s*/, '').trim();
          const vram = lines[i+1]?.replace(/VRAM.*:\s*/, '').trim();
          gpus.push({
            name: name || 'Unknown',
            vramMB: vram || 'Unknown',
          });
        }
      }
    }

    // If no GPU detected, provide basic info
    if (gpus.length === 0) {
      gpus.push({
        name: 'GPU detection not available on this platform',
        vramMB: 'Unknown',
      });
    }

    return gpus;
  }

  /**
   * Parse VRAM string like "12 GB" to MB
   */
  _parseVRAM(str) {
    const match = str.match(/(\d+)\s*(MB|GB|GiB)/i);
    if (match) {
      const val = parseInt(match[1]);
      return match[2].toUpperCase().startsWith('G') ? val * 1024 : val;
    }
    return 'Unknown';
  }

  /**
   * Memory information
   */
  async getMemoryInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      totalGB: (totalMem / 1073741824).toFixed(2),
      usedGB: (usedMem / 1073741824).toFixed(2),
      freeGB: (freeMem / 1073741824).toFixed(2),
      usagePercent: ((usedMem / totalMem) * 100).toFixed(1),
      totalBytes: totalMem,
      usedBytes: usedMem,
      freeBytes: freeMem,
    };
  }

  /**
   * Storage/Disk information
   */
  async getStorageInfo() {
    const drives = [];

    if (this.platform === 'win32') {
      const result = this._exec('wmic logicaldisk get Name,Size,FreeSpace,VolumeName,FileSystem /format:csv');
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines.slice(1)) {
          const parts = line.split(',');
          if (parts.length >= 4 && parts[2] && parts[3]) {
            const total = parseInt(parts[2]);
            const free = parseInt(parts[3]);
            const used = total - free;
            drives.push({
              drive: parts[1]?.trim() || 'Unknown',
              label: parts[4]?.trim() || '',
              filesystem: parts[5]?.trim() || 'Unknown',
              totalGB: total > 0 ? (total / 1073741824).toFixed(2) : 'Unknown',
              usedGB: total > 0 ? (used / 1073741824).toFixed(2) : 'Unknown',
              freeGB: total > 0 ? (free / 1073741824).toFixed(2) : 'Unknown',
              usagePercent: total > 0 ? ((used / total) * 100).toFixed(1) : 'Unknown',
            });
          }
        }
      }
    } else {
      // Linux/macOS: use df
      const result = this._exec('df -h --output=source,fstype,size,used,avail,pcent,target 2>/dev/null || df -h /');
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines.slice(1)) {
          const parts = line.split(/\s+/);
          if (parts.length >= 6) {
            drives.push({
              drive: parts[0],
              filesystem: parts[1] || 'Unknown',
              totalGB: parts[2] || 'Unknown',
              usedGB: parts[3] || 'Unknown',
              freeGB: parts[4] || 'Unknown',
              usagePercent: parts[5]?.replace('%', '') || 'Unknown',
              mount: parts[6] || '',
            });
          }
        }
      }
    }

    // Fallback if no drives detected
    if (drives.length === 0) {
      drives.push({
        drive: os.platform() === 'win32' ? 'C:' : '/',
        totalGB: 'Unknown',
        usedGB: 'Unknown',
        freeGB: 'Unknown',
        usagePercent: 'Unknown',
      });
    }

    return drives;
  }

  /**
   * Network information
   */
  async getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkList = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        for (const addr of addrs) {
          if (!addr.internal) {
            networkList.push({
              interface: name,
              family: addr.family,
              address: addr.address,
              netmask: addr.netmask,
              mac: addr.mac,
              internal: addr.internal,
            });
          }
        }
      }
    }

    return {
      hostname: os.hostname(),
      interfaces: networkList,
    };
  }

  /**
   * Temperature monitoring
   */
  async getTemperatures() {
    const temps = [];

    if (this.platform === 'linux') {
      // Try reading from thermal zones
      const thermalDir = '/sys/class/thermal';
      if (fs.existsSync(thermalDir)) {
        const zones = fs.readdirSync(thermalDir).filter(d => d.startsWith('thermal_zone'));
        for (const zone of zones) {
          try {
            const type = fs.readFileSync(path.join(thermalDir, zone, 'type'), 'utf8').trim();
            const temp = parseInt(fs.readFileSync(path.join(thermalDir, zone, 'temp'), 'utf8').trim());
            if (temp > 0) {
              temps.push({
                sensor: zone,
                type,
                tempC: (temp / 1000).toFixed(1),
              });
            }
          } catch (e) {
            // skip unreadable zones
          }
        }
      }

      // Try lm-sensors
      const sensors = this._exec('sensors -u 2>/dev/null | grep -E "^  temp[0-9]+_input:"');
      if (sensors) {
        const lines = sensors.split('\n').filter(l => l.trim());
        for (let i = 0; i < lines.length; i++) {
          const val = lines[i].match(/([\d.]+)/);
          if (val) {
            temps.push({
              sensor: `Core ${i}`,
              type: 'CPU Core',
              tempC: val[1],
            });
          }
        }
      }
    } else if (this.platform === 'darwin') {
      // macOS: try powermetrics or osx-cpu-temp
      const result = this._exec('pmset -g therm 2>/dev/null');
      if (result) {
        const match = result.match(/CPU.*?(\d+)/i);
        if (match) {
          temps.push({
            sensor: 'CPU',
            type: 'CPU Die',
            tempC: match[1],
          });
        }
      }
    } else if (this.platform === 'win32') {
      // Windows: try wmic
      const result = this._exec('wmic /namespace:\\\\root\\wmi PATH MSAcpi_ThermalZoneTemperature get CurrentTemperature 2>nul');
      if (result) {
        const match = result.match(/(\d+)/);
        if (match) {
          const kelvin = parseInt(match[1]);
          const celsius = (kelvin / 10) - 273.15;
          temps.push({
            sensor: 'Thermal Zone',
            type: 'System',
            tempC: celsius.toFixed(1),
          });
        }
      }
    }

    if (temps.length === 0) {
      // Fallback: report CPU temp from usage as estimate
      const cpuUsage = await this._getCPUUsage();
      const estimatedTemp = 35 + (cpuUsage * 0.3); // rough estimate
      temps.push({
        sensor: 'CPU (estimated)',
        type: 'Estimated from load',
        tempC: estimatedTemp.toFixed(1),
      });
    }

    return temps;
  }

  /**
   * Get OS information
   */
  async getOSInfo() {
    const info = {
      platform: os.platform(),
      release: os.release(),
      version: '',
      kernel: os.version ? os.version() : os.release(),
      uptime: this._formatUptime(os.uptime()),
    };

    if (this.platform === 'win32') {
      const result = this._exec('wmic os get Caption,Version /format:csv');
      if (result) {
        const match = result.match(/Microsoft\s+(.*?)\s*\|/);
        if (match) info.version = match[1].trim();
        const lines = result.split('\n');
        for (const line of lines) {
          if (line.includes('Microsoft')) {
            info.version = line.replace(/.*?Microsoft\s+/, '').replace(/,.*/, '').trim();
          }
        }
      }
    } else if (this.platform === 'linux') {
      info.version = this._exec('cat /etc/os-release 2>/dev/null | grep "^PRETTY_NAME" | cut -d= -f2 | tr -d \'"\'') || 'Linux';
    } else if (this.platform === 'darwin') {
      info.version = this._exec('sw_vers -productVersion') || 'macOS';
    }

    return info;
  }

  /**
   * Top processes by CPU usage
   */
  async getTopProcesses(limit = 10) {
    const processes = [];

    if (this.platform === 'win32') {
      const result = this._exec(`wmic path Win32_PerfFormattedData_PerfProc_Process get Name,PercentProcessorTime,WorkingSetPrivate /format:csv 2>nul`);
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines.slice(1)) {
          const parts = line.split(',');
          if (parts.length >= 3) {
            const name = parts[1]?.trim() || 'Unknown';
            const cpu = parseFloat(parts[2]) || 0;
            const mem = parseInt(parts[3]) || 0;
            if (name !== '_Total' && !name.startsWith('Idle')) {
              processes.push({
                name,
                cpuPercent: cpu.toFixed(1),
                memoryMB: (mem / 1048576).toFixed(1),
              });
            }
          }
        }
      }
    } else {
      // Linux/macOS: use ps
      const result = this._exec('ps aux --sort=-%cpu 2>/dev/null | head -20');
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines.slice(1)) {
          const parts = line.split(/\s+/);
          if (parts.length >= 11) {
            processes.push({
              user: parts[0],
              pid: parts[1],
              cpuPercent: parts[2],
              memoryPercent: parts[3],
              name: parts[10],
            });
          }
        }
      }
    }

    return processes.slice(0, limit);
  }

  /**
   * Format uptime to human readable
   */
  _formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);
    
    return parts.join(' ');
  }
}

module.exports = new HardwareScanner();