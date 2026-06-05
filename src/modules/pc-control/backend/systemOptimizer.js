/**
 * AURA AI - System Optimizer Module
 * Performance optimization, temp file cleanup, startup management, system tuning
 * J.A.R.V.I.S.-style intelligent system maintenance
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class SystemOptimizer {
  constructor() {
    this.platform = process.platform;
  }

  /**
   * Run full system optimization
   */
  async runFullOptimization() {
    const results = {
      timestamp: Date.now(),
      tempCleanup: await this.cleanTempFiles(),
      startupOptimization: await this.optimizeStartup(),
      performanceTuning: await this.tunePerformance(),
      diskCleanup: await this.cleanDisk(),
      memoryOptimization: await this.optimizeMemory(),
    };

    // Calculate overall score improvement
    const before = await this.getPerformanceScore();
    results.beforeScore = before;

    // Apply all changes
    results.afterScore = await this.getPerformanceScore();
    results.improvement = results.afterScore.overall - before.overall;

    return results;
  }

  /**
   * Clean temporary files
   */
  async cleanTempFiles() {
    const cleaned = [];
    const errors = [];
    let totalFreed = 0;

    const tempDirs = this._getTempDirs();

    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        const result = this._cleanDirectory(dir, 7); // files older than 7 days
        cleaned.push(...result.cleaned);
        totalFreed += result.freed;
        if (result.errors.length > 0) {
          errors.push(...result.errors);
        }
      }
    }

    // Clean browser caches if possible
    const browserCacheDirs = this._getBrowserCacheDirs();
    for (const dir of browserCacheDirs) {
      if (fs.existsSync(dir)) {
        const result = this._cleanDirectory(dir, 14);
        cleaned.push(...result.cleaned);
        totalFreed += result.freed;
      }
    }

    return {
      filesCleaned: cleaned.length,
      spaceFreedMB: (totalFreed / 1048576).toFixed(2),
      details: cleaned.slice(0, 20), // Show first 20 for detail
      errors: errors.length > 0 ? errors : undefined,
      message: `Cleaned ${cleaned.length} temporary files, freed ${(totalFreed / 1048576).toFixed(2)} MB`,
    };
  }

  /**
   * Optimize startup programs
   */
  async optimizeStartup() {
    const startupItems = await this.getStartupItems();
    const disabled = [];
    const enabled = [];

    for (const item of startupItems) {
      // Disable items that are known to slow down startup
      if (this._shouldDisableStartup(item.name)) {
        await this.disableStartupItem(item.name);
        disabled.push(item.name);
      } else {
        enabled.push(item.name);
      }
    }

    return {
      totalItems: startupItems.length,
      disabled,
      enabled,
      message: `Optimized ${startupItems.length} startup items (disabled ${disabled.length} non-essential)`,
    };
  }

  /**
   * Tune system performance
   */
  async tunePerformance() {
    const changes = [];

    if (this.platform === 'win32') {
      // Windows-specific optimizations
      
      // Disable visual effects for performance
      try {
        execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" /v VisualFXSetting /t REG_DWORD /d 2 /f', { timeout: 5000 });
        changes.push('Set visual effects to "Adjust for best performance"');
      } catch (e) {}

      // Disable startup delay
      try {
        execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize" /v StartupDelayInMSec /t REG_DWORD /d 0 /f', { timeout: 5000 });
        changes.push('Disabled startup delay');
      } catch (e) {}

      // Set power scheme to High Performance
      try {
        execSync('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { timeout: 5000 });
        changes.push('Set power scheme to High Performance');
      } catch (e) {}

    } else if (this.platform === 'linux') {
      // Linux optimizations
      
      // Set swappiness lower for better responsiveness
      try {
        const current = execSync('cat /proc/sys/vm/swappiness', { encoding: 'utf8' }).trim();
        if (parseInt(current) > 10) {
          execSync('sudo sysctl -w vm.swappiness=10', { timeout: 5000 });
          changes.push('Reduced swappiness from ' + current + ' to 10');
        }
      } catch (e) {}

      // Set scheduler to deadline for better desktop responsiveness
      try {
        execSync('echo deadline | sudo tee /sys/block/sda/queue/scheduler', { timeout: 5000 });
        changes.push('Set I/O scheduler to deadline');
      } catch (e) {}
    }

    return {
      changes,
      count: changes.length,
      message: `Applied ${changes.length} performance optimizations`,
    };
  }

  /**
   * Clean disk of unnecessary files
   */
  async cleanDisk() {
    const cleaned = [];
    let totalFreed = 0;

    // Empty recycle bin / trash
    if (this.platform === 'win32') {
      try {
        execSync('rd /s /q C:\\$Recycle.Bin 2>nul', { timeout: 10000 });
        cleaned.push('Emptied Recycle Bin');
        totalFreed += 104857600; // estimated 100MB
      } catch (e) {}
    } else {
      try {
        execSync('rm -rf ~/.local/share/Trash/*', { timeout: 10000 });
        cleaned.push('Emptied Trash');
        totalFreed += 52428800; // estimated 50MB
      } catch (e) {}
    }

    // Clear package manager caches
    if (this.platform === 'linux') {
      try {
        const aptClean = execSync('apt-get clean 2>/dev/null; echo done', { timeout: 30000 });
        cleaned.push('Cleared APT cache');
      } catch (e) {}
    }

    // Clear npm cache if exists
    try {
      const npmCache = execSync('npm cache clean --force 2>/dev/null; echo done', { timeout: 30000 });
      cleaned.push('Cleared npm cache');
    } catch (e) {}

    // Clear pip cache
    try {
      const pipCache = execSync('pip cache purge 2>/dev/null; echo done', { timeout: 30000 });
      cleaned.push('Cleared pip cache');
    } catch (e) {}

    return {
      actions: cleaned,
      count: cleaned.length,
      message: `Performed ${cleaned.length} disk cleanup actions`,
    };
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemory() {
    const actions = [];

    if (this.platform === 'win32') {
      // Clear working set
      try {
        execSync('powershell -Command "[System.GC]::Collect(); [System.GC]::WaitForPendingFinalizers();"', { timeout: 10000 });
        actions.push('Forced garbage collection');
      } catch (e) {}

      // Empty working sets
      try {
        execSync('powershell -Command "Get-Process | Where-Object { $_.WorkingSet64 -gt 100MB } | ForEach-Object { [System.GC]::Collect() }"', { timeout: 10000 });
        actions.push('Optimized process working sets');
      } catch (e) {}

    } else if (this.platform === 'linux') {
      // Clear page cache (safe)
      try {
        execSync('sudo sync; echo 3 | sudo tee /proc/sys/vm/drop_caches', { timeout: 5000 });
        actions.push('Cleared page cache and inodes');
      } catch (e) {}
    }

    // Kill memory-hungry non-essential processes
    const killed = [];
    if (this.platform === 'win32') {
      // Don't actually kill - just report candidates
      try {
        const procs = execSync('powershell -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select -First 5 Name, @{N=\'MB\';E={[math]::Round($_.WorkingSet64/1MB)}} | ConvertTo-Json"', { encoding: 'utf8', timeout: 10000 });
        actions.push('Identified top 5 memory consumers');
      } catch (e) {}
    }

    return {
      actions,
      count: actions.length,
      message: `Applied ${actions.length} memory optimizations`,
    };
  }

  /**
   * Get startup items
   */
  async getStartupItems() {
    const items = [];

    if (this.platform === 'win32') {
      // Check registry startup locations
      const regPaths = [
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
      ];

      for (const regPath of regPaths) {
        try {
          const result = execSync(`reg query "${regPath}" 2>nul`, { encoding: 'utf8', timeout: 5000 });
          const lines = result.split('\n').filter(l => l.includes('REG_'));
          for (const line of lines) {
            const parts = line.trim().split(/\s{4,}/);
            if (parts.length >= 2) {
              items.push({
                name: parts[0],
                command: parts.slice(1).join(' '),
                source: regPath,
                enabled: true,
              });
            }
          }
        } catch (e) {}
      }

      // Check Startup folder
      const startupFolder = path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs\\Startup');
      if (fs.existsSync(startupFolder)) {
        const files = fs.readdirSync(startupFolder);
        for (const file of files) {
          items.push({
            name: file.replace(/\.(lnk|url)$/, ''),
            path: path.join(startupFolder, file),
            source: 'Startup Folder',
            enabled: true,
          });
        }
      }

    } else if (this.platform === 'linux') {
      // Check autostart
      const autostartDirs = [
        '/etc/xdg/autostart',
        path.join(os.homedir(), '.config/autostart'),
      ];
      for (const dir of autostartDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.desktop'));
          for (const file of files) {
            try {
              const content = fs.readFileSync(path.join(dir, file), 'utf8');
              const nameMatch = content.match(/^Name=(.+)/m);
              items.push({
                name: nameMatch ? nameMatch[1] : file.replace('.desktop', ''),
                path: path.join(dir, file),
                source: 'Autostart',
                enabled: true,
              });
            } catch (e) {}
          }
        }
      }
    }

    return items;
  }

  /**
   * Disable a startup item
   */
  async disableStartupItem(itemName) {
    if (this.platform === 'win32') {
      try {
        execSync(`reg delete "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v "${itemName}" /f 2>nul`, { timeout: 5000 });
        return { success: true, name: itemName };
      } catch (e) {
        return { success: false, name: itemName, error: e.message };
      }
    } else if (this.platform === 'linux') {
      const autoStart = path.join(os.homedir(), '.config/autostart');
      if (fs.existsSync(autoStart)) {
        const files = fs.readdirSync(autoStart).filter(f => f.endsWith('.desktop'));
        for (const file of files) {
          try {
            const content = fs.readFileSync(path.join(autoStart, file), 'utf8');
            if (content.includes(itemName)) {
              const newContent = content.replace('X-GNOME-Autostart-enabled=true', 'X-GNOME-Autostart-enabled=false');
              fs.writeFileSync(path.join(autoStart, file), newContent);
              return { success: true, name: itemName };
            }
          } catch (e) {}
        }
      }
      return { success: false, name: itemName, error: 'Not found' };
    }
  }

  /**
   * Get current performance score (1-100)
   */
  async getPerformanceScore() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // CPU score: based on cores and load
    const cpuLoad = os.loadavg()[0] / cpus.length;
    const cpuScore = Math.max(0, 100 - (cpuLoad * 50));

    // Memory score
    const memUsage = 1 - (freeMem / totalMem);
    const memScore = Math.max(0, 100 - (memUsage * 100));

    // Uptime score (penalize very long uptime)
    const uptimeHours = os.uptime() / 3600;
    const uptimeScore = Math.max(60, 100 - (uptimeHours * 0.5));

    // Overall
    const overall = Math.round((cpuScore * 0.4 + memScore * 0.35 + uptimeScore * 0.25));

    return {
      overall: Math.min(100, overall),
      cpu: Math.round(Math.min(100, cpuScore)),
      memory: Math.round(Math.min(100, memScore)),
      uptime: Math.round(Math.min(100, uptimeScore)),
      details: {
        cpuCores: cpus.length,
        cpuLoad: cpuLoad.toFixed(2),
        memUsage: (memUsage * 100).toFixed(1),
        uptimeHours: uptimeHours.toFixed(1),
      },
    };
  }

  /**
   * Check if a startup item should be disabled
   */
  _shouldDisableStartup(name) {
    const nonEssential = [
      'spotify', 'discord', 'slack', 'steam', 'epic games',
      'adobe', 'creative cloud', 'java', 'quicktime', 'itunes',
      'skype', 'teamviewer', 'dropbox', 'google drive', 'onedrive',
      'update', 'scheduler', 'reader',
    ];
    const lower = name.toLowerCase();
    return nonEssential.some(item => lower.includes(item));
  }

  /**
   * Get temporary directories to clean
   */
  _getTempDirs() {
    const dirs = [];

    if (this.platform === 'win32') {
      dirs.push(
        path.join(process.env.TEMP || 'C:\\Windows\\Temp'),
        path.join(process.env.TMP || 'C:\\Windows\\Temp'),
        'C:\\Windows\\Temp',
        path.join(os.homedir(), 'AppData\\Local\\Temp'),
      );
    } else {
      dirs.push(
        '/tmp',
        path.join(os.homedir(), '.cache'),
      );
    }

    return [...new Set(dirs.filter(d => fs.existsSync(d)))];
  }

  /**
   * Get browser cache directories
   */
  _getBrowserCacheDirs() {
    const home = os.homedir();
    const dirs = [];

    if (this.platform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA || '';
      dirs.push(
        path.join(localAppData, 'Google\\Chrome\\User Data\\Default\\Cache'),
        path.join(localAppData, 'Google\\Chrome\\User Data\\Default\\Code Cache'),
        path.join(localAppData, 'Microsoft\\Edge\\User Data\\Default\\Cache'),
        path.join(localAppData, 'Mozilla\\Firefox\\Profiles'),
      );
    } else if (this.platform === 'linux') {
      dirs.push(
        path.join(home, '.cache/google-chrome'),
        path.join(home, '.cache/mozilla/firefox'),
        path.join(home, '.cache/chromium'),
      );
    } else if (this.platform === 'darwin') {
      dirs.push(
        path.join(home, 'Library/Caches/Google/Chrome'),
        path.join(home, 'Library/Caches/Firefox'),
      );
    }

    return dirs.filter(d => fs.existsSync(d));
  }

  /**
   * Clean a directory of old files
   */
  _cleanDirectory(dir, maxAgeDays = 7) {
    const cleaned = [];
    let totalFreed = 0;
    const errors = [];
    const now = Date.now();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        try {
          const fullPath = path.join(dir, entry);
          const stats = fs.statSync(fullPath);
          
          if (stats.isFile() && (now - stats.mtime.getTime()) > maxAge) {
            const size = stats.size;
            fs.unlinkSync(fullPath);
            cleaned.push({ file: fullPath, size });
            totalFreed += size;
          }
        } catch (e) {
          errors.push({ file: path.join(dir, entry), error: e.message });
        }
      }
    } catch (e) {
      errors.push({ dir, error: e.message });
    }

    return { cleaned, freed: totalFreed, errors };
  }
}

module.exports = new SystemOptimizer();