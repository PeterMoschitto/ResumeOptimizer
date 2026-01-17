// API Configuration
export const API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.3,
  CHUNK_SIZE: 1000, // Process resume in chunks of 1000 characters
} as const;

// File Processing
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PAGES: 10,
  MAX_TEXT_LENGTH: 50000,
  SUPPORTED_TYPES: ['application/pdf', 'text/plain'],
  SUPPORTED_EXTENSIONS: ['.pdf', '.txt'],
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  DURATION: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// UI Configuration
export const UI_CONFIG = {
  PROGRESS_STEPS: [
    { icon: '📄', text: 'Reading Resume' },
    { icon: '🔍', text: 'Analyzing Content' },
    { icon: '📊', text: 'Evaluating Skills' },
    { icon: '💡', text: 'Generating Insights' },
  ],
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  BACKEND_CONNECTION_ERROR: 'Cannot connect to backend server. Please ensure the backend is running on port 5001.',
  FILE_TOO_LARGE: 'File too large. Please upload a smaller file (max 10MB).',
  UNSUPPORTED_FORMAT: 'Please upload a PDF or text file.',
  NO_TEXT_FOUND: 'No text found in PDF. Please ensure the PDF contains selectable text.',
  PROCESSING_ERROR: 'Error processing file. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  QUOTA_EXCEEDED: 'API quota exceeded. Please check your API account billing.',
  RATE_LIMIT: 'Too many requests. Please wait a minute and try again.',
  NO_PROVIDERS_CONFIGURED: 'No AI providers configured. Please set up API keys in the backend .env file.',
} as const; 