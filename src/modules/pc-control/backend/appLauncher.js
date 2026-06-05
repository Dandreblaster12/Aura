/**
 * AURA AI - App & Game Launcher
 * Voice-activated application and game launcher
 * Cross-platform: Windows, Linux, macOS
 */

'use strict';

const { exec, execSync, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

class AppLauncher {
  constructor() {
    this.platform = process.platform;
    this.runningProcesses = new Map();
    this._knownApps = this._buildKnownApps();
  }

  /**
   * Build a database of known applications for quick launch
   */
  _buildKnownApps() {
    const common = {
      browser: { win32: 'start chrome', linux: 'xdg-open https://google.com', darwin: 'open -a Safari' },
      chrome: { win32: 'start chrome', linux: 'google-chrome', darwin: 'open -a "Google Chrome"' },
      firefox: { win32: 'start firefox', linux: 'firefox', darwin: 'open -a Firefox' },
      edge: { win32: 'start msedge', linux: 'microsoft-edge', darwin: 'open -a "Microsoft Edge"' },
      vscode: { win32: 'code', linux: 'code', darwin: 'open -a "Visual Studio Code"' },
      terminal: { win32: 'start cmd', linux: 'gnome-terminal', darwin: 'open -a Terminal' },
      explorer: { win32: 'explorer', linux: 'nautilus', darwin: 'open .' },
      calculator: { win32: 'calc', linux: 'gnome-calculator', darwin: 'open -a Calculator' },
      notepad: { win32: 'notepad', linux: 'gedit', darwin: 'open -a TextEdit' },
      spotify: { win32: 'start spotify', linux: 'spotify', darwin: 'open -a Spotify' },
      discord: { win32: 'start discord', linux: 'discord', darwin: 'open -a Discord' },
      slack: { win32: 'start slack', linux: 'slack', darwin: 'open -a Slack' },
      steam: { win32: 'start steam', linux: 'steam', darwin: 'open -a Steam' },
      photos: { win32: 'start ms-photos:', linux: 'eog', darwin: 'open -a Photos' },
      settings: { win32: 'start ms-settings:', linux: 'gnome-control-center', darwin: 'open -a "System Settings"' },
    };
    return common;
  }

  /**
   * Launch an app by name - uses voice-friendly matching
   * @param {string} appName - name of the app to launch
   * @param {string[]} args - arguments to pass
   * @returns {Promise<object>}
   */
  async launch(appName, args = []) {
    appName = appName.toLowerCase().trim();
    
    // Check known apps database first
    if (this._knownApps[appName]) {
      const cmd = this._knownApps[appName][this.platform] || this._knownApps[appName].win32;
      return this._runCommand(cmd, args);
    }

    // Try fuzzy matching against known apps
    const fuzzyMatch = this._fuzzyFindApp(appName);
    if (fuzzyMatch) {
      const cmd = fuzzyMatch[this.platform] || fuzzyMatch.win32;
      return this._runCommand(cmd, args);
    }
    
    // Try launching as a direct command
    return this._runCommand(appName, args);
  }

  /**
   * Fuzzy find an app by partial name match
   */
  _fuzzyFindApp(name) {
    const keys = Object.keys(this._knownApps);
    // Exact match
    const exact = keys.find(k => k === name);
    if (exact) return this._knownApps[exact];
    
    // Starts with
    const startsWith = keys.find(k => k.startsWith(name));
    if (startsWith) return this._knownApps[startsWith];
    
    // Contains
    const contains = keys.find(k => k.includes(name));
    if (contains) return this._knownApps[contains];
    
    return null;
  }

  /**
   * Execute launch command
   */
  _runCommand(cmd, args = []) {
    return new Promise((resolve, reject) => {
      let proc;
      
      if (this.platform === 'win32') {
        // On Windows, use start or direct execution
        const fullCmd = args.length > 0 ? `${cmd} ${args.join(' ')}` : cmd;
        proc = exec(fullCmd, { windowsHide: true }, (error) => {
          if (error) {
            // If start fails, try direct exe
            reject(new Error(`Failed to launch: ${error.message}`));
          }
        });
      } else {
        // Linux/macOS
        const spawnCmd = cmd.split(' ')[0];
        const spawnArgs = [...cmd.split(' ').slice(1), ...args];
        proc = spawn(spawnCmd, spawnArgs, {
          detached: true,
          stdio: 'ignore',
        });
        proc.unref();
      }

      if (proc && proc.pid) {
        this.runningProcesses.set(appName, proc.pid);
      }

      resolve({
        success: true,
        app: appName,
        pid: proc?.pid || null,
        message: `Launched ${appName}`,
      });
    });
  }

  /**
   * Search for installed applications
   */
  async searchApps(query) {
    const results = [];

    if (this.platform === 'win32') {
      // Search Start Menu
      const startMenuPaths = [
        path.join(process.env.APPDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
        path.join(process.env.PROGRAMDATA || '', 'Microsoft\\Windows\\Start Menu\\Programs'),
      ];

      for (const dir of startMenuPaths) {
        if (fs.existsSync(dir)) {
          this._searchDir(dir, query, results);
        }
      }
    } else if (this.platform === 'linux') {
      // Search .desktop files
      const desktopDirs = [
        '/usr/share/applications',
        '/usr/local/share/applications',
        path.join(os.homedir(), '.local/share/applications'),
      ];

      for (const dir of desktopDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir).filter(f => f.endsWith('.desktop'));
          for (const file of files) {
            try {
              const content = fs.readFileSync(path.join(dir, file), 'utf8');
              const nameMatch = content.match(/^Name=(.+)/m);
              const execMatch = content.match(/^Exec=(.+)/m);
              if (nameMatch && nameMatch[1].toLowerCase().includes(query.toLowerCase())) {
                results.push({
                  name: nameMatch[1],
                  exec: execMatch ? execMatch[1] : file,
                  source: file,
                });
              }
            } catch (e) {
              // skip unreadable files
            }
          }
        }
      }
    } else if (this.platform === 'darwin') {
      // macOS: search /Applications
      const appDir = '/Applications';
      if (fs.existsSync(appDir)) {
        const apps = fs.readdirSync(appDir).filter(f => f.endsWith('.app'));
        for (const app of apps) {
          const name = app.replace('.app', '');
          if (name.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              name,
              exec: `open -a "${name}"`,
              source: app,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * Recursively search directory for shortcuts
   */
  _searchDir(dir, query, results) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (results.length < 50) {
            this._searchDir(path.join(dir, entry.name), query, results);
          }
        } else if (entry.isFile() && (entry.name.endsWith('.lnk') || entry.name.endsWith('.url'))) {
          const name = entry.name.replace(/\.(lnk|url)$/, '');
          if (name.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              name,
              path: path.join(dir, entry.name),
            });
          }
        }
      }
    } catch (e) {
      // skip unreadable directories
    }
  }

  /**
   * Kill a running application
   */
  async killApp(appName) {
    return new Promise((resolve) => {
      if (this.platform === 'win32') {
        exec(`taskkill /IM ${appName}.exe /F 2>nul`, (err) => {
          resolve({ success: !err, app: appName });
        });
      } else {
        exec(`pkill -f "${appName}" 2>/dev/null`, (err) => {
          resolve({ success: !err, app: appName });
        });
      }
    });
  }

  /**
   * List all running user applications
   */
  async listRunning() {
    const apps = [];
    
    if (this.platform === 'win32') {
      const result = this._exec('tasklist /FI "STATUS eq RUNNING" /FO CSV');
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines.slice(1)) {
          const parts = line.replace(/"/g, '').split(',');
          if (parts.length >= 2) {
            apps.push({
              name: parts[0],
              pid: parts[1],
              session: parts[2],
              memUsage: parts[3],
            });
          }
        }
      }
    } else {
      const result = this._exec('ps aux --sort=-%mem | head -20');
      if (result) {
        const lines = result.split('\n').filter(l => l.trim());
        for (const line of lines.slice(1)) {
          const parts = line.split(/\s+/);
          if (parts.length >= 11) {
            apps.push({
              user: parts[0],
              pid: parts[1],
              cpu: parts[2],
              mem: parts[3],
              name: parts[10],
            });
          }
        }
      }
    }

    return apps;
  }

  _exec(cmd) {
    try {
      return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
    } catch (err) {
      return null;
    }
  }
}

module.exports = new AppLauncher();