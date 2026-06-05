/**
 * AURA AI - File Manager Module
 * Voice-controlled file operations: browse, search, copy, move, delete, create
 * Cross-platform with J.A.R.V.I.S.-style smart file handling
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class FileManager {
  constructor() {
    this.platform = process.platform;
  }

  /**
   * List directory contents with details
   */
  async listDir(dirPath = os.homedir()) {
    dirPath = this._resolvePath(dirPath);

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const items = [];

      for (const entry of entries) {
        try {
          const fullPath = path.join(dirPath, entry.name);
          const stats = fs.statSync(fullPath);
          
          items.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            isSymlink: entry.isSymbolicLink(),
            size: stats.size,
            sizeFormatted: this._formatSize(stats.size),
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
            permissions: this._getPermissions(stats),
            extension: path.extname(entry.name).toLowerCase(),
          });
        } catch (e) {
          // Skip inaccessible entries
          items.push({
            name: entry.name,
            path: path.join(dirPath, entry.name),
            isDirectory: entry.isDirectory(),
            error: 'Access denied',
          });
        }
      }

      // Sort: directories first, then by name
      items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return {
        path: dirPath,
        parent: path.dirname(dirPath),
        items,
        total: items.length,
        drives: await this._getDrives(),
      };
    } catch (err) {
      throw new Error(`Cannot list directory ${dirPath}: ${err.message}`);
    }
  }

  /**
   * Search files recursively with pattern matching
   */
  async searchFiles(options = {}) {
    const {
      pattern = '',
      rootDir = os.homedir(),
      maxResults = 100,
      fileTypes = [],
      minSize = 0,
      maxSize = Infinity,
      modifiedAfter = null,
      modifiedBefore = null,
    } = options;

    const results = [];
    const searchPattern = pattern.toLowerCase();

    const walk = (dir) => {
      if (results.length >= maxResults) return;
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (results.length >= maxResults) return;
          if (entry.name.startsWith('.') && !pattern.startsWith('.')) continue;
          
          const fullPath = path.join(dir, entry.name);

          try {
            if (entry.isDirectory()) {
              // Recurse into subdirectories (skip node_modules, .git, etc.)
              if (!entry.name.startsWith('node_modules') && 
                  entry.name !== '.git' && 
                  entry.name !== '.cache') {
                walk(fullPath);
              }
            } else if (entry.isFile()) {
              const stats = fs.statSync(fullPath);
              const nameMatch = !pattern || entry.name.toLowerCase().includes(searchPattern);
              
              // Check file type filter
              const ext = path.extname(entry.name).toLowerCase();
              const typeMatch = fileTypes.length === 0 || fileTypes.includes(ext);
              
              // Check size filter
              const sizeMatch = stats.size >= minSize && stats.size <= maxSize;
              
              // Check date filters
              const afterMatch = !modifiedAfter || stats.mtime >= new Date(modifiedAfter);
              const beforeMatch = !modifiedBefore || stats.mtime <= new Date(modifiedBefore);

              if (nameMatch && typeMatch && sizeMatch && afterMatch && beforeMatch) {
                results.push({
                  name: entry.name,
                  path: fullPath,
                  directory: dir,
                  size: stats.size,
                  sizeFormatted: this._formatSize(stats.size),
                  extension: ext,
                  modified: stats.mtime,
                  created: stats.birthtime,
                });
              }
            }
          } catch (e) {
            // Skip inaccessible files
          }
        }
      } catch (e) {
        // Skip inaccessible directories
      }
    };

    walk(rootDir);
    return { results, total: results.length, query: pattern };
  }

  /**
   * Copy files or directories
   */
  async copy(sourcePaths, destPath) {
    sourcePaths = Array.isArray(sourcePaths) ? sourcePaths : [sourcePaths];
    const results = [];

    for (const src of sourcePaths) {
      const resolvedSrc = this._resolvePath(src);
      const resolvedDest = this._resolvePath(destPath);
      
      try {
        const stats = fs.statSync(resolvedSrc);
        const destFullPath = path.join(resolvedDest, path.basename(resolvedSrc));
        
        if (stats.isDirectory()) {
          this._copyDirSync(resolvedSrc, destFullPath);
        } else {
          fs.copyFileSync(resolvedSrc, destFullPath);
        }
        
        results.push({
          success: true,
          source: resolvedSrc,
          destination: destFullPath,
        });
      } catch (err) {
        results.push({
          success: false,
          source: resolvedSrc,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Move files or directories
   */
  async move(sourcePaths, destPath) {
    sourcePaths = Array.isArray(sourcePaths) ? sourcePaths : [sourcePaths];
    const results = [];

    for (const src of sourcePaths) {
      const resolvedSrc = this._resolvePath(src);
      const resolvedDest = this._resolvePath(destPath);
      
      try {
        const destFullPath = path.join(resolvedDest, path.basename(resolvedSrc));
        fs.renameSync(resolvedSrc, destFullPath);
        
        results.push({
          success: true,
          source: resolvedSrc,
          destination: destFullPath,
        });
      } catch (err) {
        results.push({
          success: false,
          source: resolvedSrc,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Delete files or directories (to trash if possible)
   */
  async delete(sourcePaths, permanent = false) {
    sourcePaths = Array.isArray(sourcePaths) ? sourcePaths : [sourcePaths];
    const results = [];

    for (const src of sourcePaths) {
      const resolvedSrc = this._resolvePath(src);
      
      try {
        if (!permanent) {
          // Move to trash using platform-specific methods
          await this._moveToTrash(resolvedSrc);
        } else {
          const stats = fs.statSync(resolvedSrc);
          if (stats.isDirectory()) {
            fs.rmSync(resolvedSrc, { recursive: true, force: true });
          } else {
            fs.unlinkSync(resolvedSrc);
          }
        }
        
        results.push({
          success: true,
          path: resolvedSrc,
          permanent,
        });
      } catch (err) {
        results.push({
          success: false,
          path: resolvedSrc,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Create a new directory
   */
  async createDir(dirPath) {
    const resolved = this._resolvePath(dirPath);
    
    try {
      fs.mkdirSync(resolved, { recursive: true });
      return { success: true, path: resolved };
    } catch (err) {
      return { success: false, path: resolved, error: err.message };
    }
  }

  /**
   * Create a new empty file
   */
  async createFile(filePath, content = '') {
    const resolved = this._resolvePath(filePath);
    
    try {
      fs.writeFileSync(resolved, content);
      return { success: true, path: resolved, size: content.length };
    } catch (err) {
      return { success: false, path: resolved, error: err.message };
    }
  }

  /**
   * Read file contents (text files)
   */
  async readFile(filePath, maxSize = 1048576) {
    const resolved = this._resolvePath(filePath);
    
    try {
      const stats = fs.statSync(resolved);
      if (stats.size > maxSize) {
        return { success: false, error: 'File too large to read', path: resolved, size: stats.size };
      }
      
      const content = fs.readFileSync(resolved, 'utf8');
      return { success: true, path: resolved, content, size: stats.size };
    } catch (err) {
      return { success: false, path: resolved, error: err.message };
    }
  }

  /**
   * Get file/folder information
   */
  async getInfo(filePath) {
    const resolved = this._resolvePath(filePath);
    
    try {
      const stats = fs.statSync(resolved);
      return {
        name: path.basename(resolved),
        path: resolved,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        isSymlink: stats.isSymbolicLink(),
        size: stats.size,
        sizeFormatted: this._formatSize(stats.size),
        permissions: this._getPermissions(stats),
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        extension: path.extname(resolved),
      };
    } catch (err) {
      return { success: false, path: resolved, error: err.message };
    }
  }

  /**
   * Open file or folder with default application
   */
  async open(filePath) {
    const resolved = this._resolvePath(filePath);
    
    try {
      const cmd = this.platform === 'win32' ? `start "" "${resolved}"`
        : this.platform === 'darwin' ? `open "${resolved}"`
        : `xdg-open "${resolved}"`;
      
      execSync(cmd);
      return { success: true, path: resolved };
    } catch (err) {
      return { success: false, path: resolved, error: err.message };
    }
  }

  /**
   * Get quick-access/recent directories
   */
  async getQuickAccess() {
    const quickDirs = [
      { name: 'Desktop', path: path.join(os.homedir(), 'Desktop') },
      { name: 'Downloads', path: path.join(os.homedir(), 'Downloads') },
      { name: 'Documents', path: path.join(os.homedir(), 'Documents') },
      { name: 'Pictures', path: path.join(os.homedir(), 'Pictures') },
      { name: 'Music', path: path.join(os.homedir(), 'Music') },
      { name: 'Videos', path: path.join(os.homedir(), 'Videos') },
      { name: 'Home', path: os.homedir() },
    ];

    const valid = [];
    for (const dir of quickDirs) {
      if (fs.existsSync(dir.path)) {
        try {
          const stats = fs.statSync(dir.path);
          const entries = fs.readdirSync(dir.path);
          valid.push({ ...dir, itemCount: entries.length, modified: stats.mtime });
        } catch (e) {
          valid.push(dir);
        }
      }
    }
    return valid;
  }

  /**
   * Get available drives/volumes
   */
  async _getDrives() {
    const drives = [];

    if (this.platform === 'win32') {
      for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        const drivePath = `${letter}:\\`;
        if (fs.existsSync(drivePath)) {
          try {
            const stats = fs.statSync(drivePath);
            drives.push({
              drive: drivePath,
              label: `${letter}:`,
              type: 'Local',
            });
          } catch (e) {
            // skip
          }
        }
      }
    } else {
      drives.push({
        drive: '/',
        label: 'Root',
        type: 'Local',
      });
    }

    return drives;
  }

  // ==================== Utility Methods ====================

  _resolvePath(inputPath) {
    if (!inputPath) return os.homedir();
    if (inputPath.startsWith('~')) {
      return path.join(os.homedir(), inputPath.slice(1));
    }
    // Handle environment variables
    if (inputPath.includes('%')) {
      const parts = inputPath.split(/[\\/]/);
      const resolvedParts = parts.map(p => {
        const match = p.match(/^%([^%]+)%$/);
        return match ? (process.env[match[1]] || p) : p;
      });
      return path.resolve(resolvedParts.join(path.sep));
    }
    return path.resolve(inputPath);
  }

  _formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  _getPermissions(stats) {
    const mode = stats.mode;
    if (this.platform === 'win32') {
      return 'Windows ACL';
    }
    return ((mode & parseInt('400', 8)) ? 'r' : '-') +
           ((mode & parseInt('200', 8)) ? 'w' : '-') +
           ((mode & parseInt('100', 8)) ? 'x' : '-') +
           ((mode & parseInt('40', 8))  ? 'r' : '-') +
           ((mode & parseInt('20', 8))  ? 'w' : '-') +
           ((mode & parseInt('10', 8))  ? 'x' : '-') +
           ((mode & parseInt('4', 8))   ? 'r' : '-') +
           ((mode & parseInt('2', 8))   ? 'w' : '-') +
           ((mode & parseInt('1', 8))   ? 'x' : '-');
  }

  _copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this._copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async _moveToTrash(filePath) {
    if (this.platform === 'darwin') {
      execSync(`osascript -e 'tell app "Finder" to delete POSIX file "${filePath}"'`);
    } else {
      // Fallback: create a .Trash directory
      const trashDir = path.join(os.homedir(), '.Trash');
      if (!fs.existsSync(trashDir)) {
        fs.mkdirSync(trashDir, { recursive: true });
      }
      fs.renameSync(filePath, path.join(trashDir, path.basename(filePath)));
    }
  }
}

module.exports = new FileManager();