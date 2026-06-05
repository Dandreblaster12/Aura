/**
 * AURA AI - Script Runner Module
 * Execute scripts, commands, and automation tasks
 * Supports: PowerShell, Bash, Python, Node.js, and custom scripts
 */

'use strict';

const { exec, execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ScriptRunner {
  constructor() {
    this.platform = process.platform;
    this.scriptHistory = [];
    this.maxHistory = 100;
    this.allowedPaths = this._getAllowedPaths();
  }

  /**
   * Get allowed script execution paths (security)
   */
  _getAllowedPaths() {
    const paths = [os.homedir()];
    if (this.platform === 'win32') {
      paths.push(process.env.TEMP, process.env.TMP);
    }
    paths.push('/tmp', '/dev/shm');
    return paths;
  }

  /**
   * Execute a shell command
   */
  async runCommand(command, options = {}) {
    const {
      timeout = 30000,
      cwd = process.cwd(),
      env = {},
      captureOutput = true,
    } = options;

    const startTime = Date.now();

    return new Promise((resolve) => {
      const child = exec(command, {
        timeout,
        cwd,
        env: { ...process.env, ...env },
        maxBuffer: 10 * 1024 * 1024, // 10MB
        windowsHide: true,
      }, (error, stdout, stderr) => {
        const executionTime = Date.now() - startTime;
        
        const result = {
          command,
          exitCode: error ? (error.code || error.killed ? 137 : 1) : 0,
          stdout: captureOutput ? (stdout || '') : '[output captured]',
          stderr: captureOutput ? (stderr || '') : '',
          executionTime,
          success: !error,
          killed: error ? !!error.killed : false,
        };

        // Add to history
        this._addToHistory(result);

        resolve(result);
      });
    });
  }

  /**
   * Execute a shell script file
   */
  async runScript(scriptPath, args = [], options = {}) {
    const resolvedPath = path.resolve(scriptPath);
    
    // Security: check if script is in allowed path
    if (!this._isPathAllowed(resolvedPath)) {
      return {
        success: false,
        error: 'Security: Script path not in allowed directories',
        path: resolvedPath,
      };
    }

    if (!fs.existsSync(resolvedPath)) {
      return {
        success: false,
        error: `Script not found: ${resolvedPath}`,
        path: resolvedPath,
      };
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const interpreter = this._getInterpreter(ext);
    
    if (!interpreter) {
      return {
        success: false,
        error: `Unsupported script type: ${ext}`,
        path: resolvedPath,
      };
    }

    const cmd = `${interpreter} "${resolvedPath}" ${args.join(' ')}`;
    return this.runCommand(cmd, options);
  }

  /**
   * Execute inline code snippet
   */
  async runInlineCode(code, language = 'javascript', options = {}) {
    let cmd;

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js': {
        const tmpFile = path.join(os.tmpdir(), `aura-script-${Date.now()}.js`);
        fs.writeFileSync(tmpFile, code);
        cmd = `node "${tmpFile}"`;
        break;
      }
      case 'python':
      case 'py': {
        const tmpFile = path.join(os.tmpdir(), `aura-script-${Date.now()}.py`);
        fs.writeFileSync(tmpFile, code);
        cmd = `python3 "${tmpFile}" 2>/dev/null || python "${tmpFile}"`;
        break;
      }
      case 'powershell':
      case 'ps1':
        cmd = `powershell -Command "${code.replace(/"/g, '\\"')}"`;
        break;
      case 'bash':
      case 'sh':
        cmd = `bash -c '${code.replace(/'/g, "'\\''")}'`;
        break;
      case 'batch':
      case 'bat':
        cmd = `cmd /c "${code}"`;
        break;
      default:
        return { success: false, error: `Unsupported language: ${language}` };
    }

    return this.runCommand(cmd, options);
  }

  /**
   * Run a system command with elevated privileges (request UAC/sudo)
   */
  async runElevated(command, options = {}) {
    if (this.platform === 'win32') {
      // Create a VBS script to trigger UAC
      const vbsPath = path.join(os.tmpdir(), `aura-elevated-${Date.now()}.vbs`);
      const vbsContent = `
        Set UAC = CreateObject("Shell.Application")
        UAC.ShellExecute "cmd.exe", "/c ${command.replace(/"/g, '""')}", "", "runas", 1
      `;
      fs.writeFileSync(vbsPath, vbsContent);
      
      execSync(`cscript "${vbsPath}"`, { windowsHide: true });
      
      // Cleanup
      try { fs.unlinkSync(vbsPath); } catch (e) {}
      
      return { success: true, message: `Elevated command launched: ${command}` };
    } else {
      // Linux/macOS: use sudo
      return this.runCommand(`sudo ${command}`, options);
    }
  }

  /**
   * Run a batch of commands sequentially
   */
  async runBatch(commands, options = {}) {
    const results = [];
    const { stopOnError = false } = options;

    for (const cmd of commands) {
      const result = await this.runCommand(cmd, options);
      results.push(result);
      
      if (!result.success && stopOnError) {
        break;
      }
    }

    return results;
  }

  /**
   * Get script execution history
   */
  getHistory(limit = 20) {
    return this.scriptHistory.slice(-limit);
  }

  /**
   * Get supported script interpreters
   */
  getSupportedLanguages() {
    const runtimes = [];
    
    // Check which runtimes are available
    const checks = [
      { name: 'JavaScript/Node.js', cmd: 'node --version', lang: 'js' },
      { name: 'Python', cmd: 'python3 --version || python --version', lang: 'py' },
      { name: 'PowerShell', cmd: 'powershell -Command "$PSVersionTable.PSVersion"', lang: 'ps1' },
      { name: 'Bash', cmd: 'bash --version', lang: 'sh' },
      { name: 'Batch/CMD', cmd: 'cmd /c ver', lang: 'bat' },
    ];

    for (const check of checks) {
      try {
        const ver = execSync(check.cmd, { encoding: 'utf8', timeout: 3000 }).trim();
        runtimes.push({ ...check, version: ver.split('\n')[0].trim(), available: true });
      } catch (e) {
        runtimes.push({ ...check, version: null, available: false });
      }
    }

    return runtimes;
  }

  /**
   * Get appropriate interpreter for script file
   */
  _getInterpreter(ext) {
    const interpreters = {
      '.js': 'node',
      '.mjs': 'node',
      '.py': 'python3',
      '.sh': 'bash',
      '.ps1': 'powershell -ExecutionPolicy Bypass -File',
      '.bat': 'cmd /c',
      '.cmd': 'cmd /c',
      '.rb': 'ruby',
      '.pl': 'perl',
      '.php': 'php',
    };

    if (this.platform === 'win32') {
      // Windows specific overrides
      interpreters['.py'] = 'python';
    }

    return interpreters[ext] || null;
  }

  /**
   * Check if path is in allowed directories
   */
  _isPathAllowed(filePath) {
    const resolved = path.resolve(filePath);
    return this.allowedPaths.some(allowed => 
      resolved.startsWith(path.resolve(allowed))
    );
  }

  /**
   * Add command to history
   */
  _addToHistory(result) {
    this.scriptHistory.push({
      ...result,
      timestamp: Date.now(),
    });

    if (this.scriptHistory.length > this.maxHistory) {
      this.scriptHistory.shift();
    }
  }
}

module.exports = new ScriptRunner();