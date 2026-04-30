export interface ErrorInfo {
  message: string;
  code?: string;
  retryAfter?: number;
  userFriendly?: string;
}

export class ResumeAnalysisError extends Error {
  public code?: string;
  public retryAfter?: number;
  public userFriendly?: string;

  constructor(info: ErrorInfo) {
    super(info.message);
    this.name = 'ResumeAnalysisError';
    this.code = info.code;
    this.retryAfter = info.retryAfter;
    this.userFriendly = info.userFriendly;
  }
}

export const handleAPIError = (error: any): ResumeAnalysisError => {
  console.error('API Error:', error);

  // Handle rate limiting
  if (error.message?.includes('rate limit') || error.status === 429) {
    return new ResumeAnalysisError({
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT',
      retryAfter: 60,
      userFriendly: 'Too many requests. Please wait a minute and try again.'
    });
  }

  // Handle quota exceeded
  if (error.message?.includes('quota') || error.status === 402) {
    return new ResumeAnalysisError({
      message: 'API quota exceeded',
      code: 'QUOTA_EXCEEDED',
      userFriendly: 'API quota exceeded. Please check your OpenAI account billing.'
    });
  }

  // Handle authentication errors
  if (error.status === 401) {
    return new ResumeAnalysisError({
      message: 'Invalid API key',
      code: 'AUTH_ERROR',
      userFriendly: 'Invalid API key. Please check your configuration.'
    });
  }

  // Handle model errors
  if (error.message?.includes('model')) {
    return new ResumeAnalysisError({
      message: 'Model error',
      code: 'MODEL_ERROR',
      userFriendly: 'AI model error. Please try again.'
    });
  }

  // Handle network errors (fetch failed: offline, wrong URL, or backend not running)
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return new ResumeAnalysisError({
      message: 'Network error',
      code: 'NETWORK_ERROR',
      userFriendly:
        'Could not reach the API server. Start the backend (port 5001 by default), check REACT_APP_API_URL, or verify your connection.'
    });
  }

  // Default error
  return new ResumeAnalysisError({
    message: error.message || 'Unknown error',
    code: 'UNKNOWN_ERROR',
    userFriendly: 'An unexpected error occurred. Please try again.'
  });
}; 