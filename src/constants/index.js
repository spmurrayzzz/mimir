/**
 * Application constants
 */

// File types and extensions
export const FILE_TYPES = {
  JAVASCRIPT: { name: 'JavaScript', extensions: ['.js', '.jsx', '.mjs'] },
  TYPESCRIPT: { name: 'TypeScript', extensions: ['.ts', '.tsx'] },
  VUE: { name: 'Vue', extensions: ['.vue'] },
  HTML: { name: 'HTML', extensions: ['.html', '.htm'] },
  CSS: { name: 'CSS', extensions: ['.css', '.scss', '.sass', '.less'] },
  JSON: { name: 'JSON', extensions: ['.json'] },
  MARKDOWN: { name: 'Markdown', extensions: ['.md', '.markdown'] }
};

// Supported languages for code editor
export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'html',
  'css',
  'json',
  'markdown',
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby'
];

// AI model options
export const AI_MODELS = {
  COMPLETION: [
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'claude-3', name: 'Claude 3', provider: 'anthropic' },
    { id: 'llama-3', name: 'Llama 3', provider: 'meta' }
  ],
  CODE: [
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'claude-3', name: 'Claude 3', provider: 'anthropic' },
    { id: 'code-llama', name: 'Code Llama', provider: 'meta' }
  ]
};

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'dark',
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: true,
    lineNumbers: true,
    formatOnSave: true
  },
  ai: {
    defaultCompletionModel: 'gpt-4',
    defaultCodeModel: 'claude-3',
    temperature: 0.7,
    maxTokens: 2048
  }
};

// Routes
export const ROUTES = {
  HOME: '/',
  EDITOR: '/editor',
  PROJECTS: '/projects',
  SETTINGS: '/settings'
};

// IPC Channel names
export const IPC_CHANNELS = {
  FILE_OPEN: 'file:open',
  FILE_SAVE: 'file:save',
  FILE_SAVE_AS: 'file:saveAs',
  DB_GET_PROJECTS: 'db:getProjects',
  DB_GET_PROJECT: 'db:getProject',
  DB_SAVE_PROJECT: 'db:saveProject',
  DB_DELETE_PROJECT: 'db:deleteProject',
  AI_COMPLETION: 'ai:completion',
  AI_CODE: 'ai:code',
  APP_VERSION: 'app:version',
  SYSTEM_INFO: 'system:info',
  THEME_CHANGED: 'theme:changed',
  STATUS_UPDATE: 'status:update'
};