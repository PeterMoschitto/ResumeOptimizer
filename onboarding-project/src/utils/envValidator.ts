/**
 * Environment configuration
 * NOTE: API keys are now stored on the backend for security
 * The frontend only needs the backend API URL
 */
export interface EnvironmentConfig {
  API_URL: string;
  NODE_ENV: string;
}

export const validateEnvironment = (): EnvironmentConfig => {
  const config: Partial<EnvironmentConfig> = {
    API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
    NODE_ENV: process.env.NODE_ENV || 'development',
  };

  return config as EnvironmentConfig;
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  try {
    return validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
}; 