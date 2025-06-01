/**
 * File utility functions
 */

/**
 * Get the file extension from a path
 * @param {string} path - File path
 * @returns {string} - File extension (with dot)
 */
export function getFileExtension(path) {
  if (!path) return '';
  const parts = path.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

/**
 * Get the file name from a path
 * @param {string} path - File path
 * @returns {string} - File name with extension
 */
export function getFileName(path) {
  if (!path) return '';
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1];
}

/**
 * Get the file name without extension
 * @param {string} path - File path
 * @returns {string} - File name without extension
 */
export function getFileNameWithoutExtension(path) {
  const fileName = getFileName(path);
  const extension = getFileExtension(path);
  return fileName.replace(extension, '');
}

/**
 * Determine language from file extension
 * @param {string} path - File path
 * @returns {string} - Language identifier
 */
export function getLanguageFromPath(path) {
  const extension = getFileExtension(path);
  
  const languageMap = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.vue': 'html',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.py': 'python',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby'
  };
  
  return languageMap[extension] || 'plaintext';
}

/**
 * Format file size in human-readable format
 * @param {number} size - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(size) {
  if (size === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}