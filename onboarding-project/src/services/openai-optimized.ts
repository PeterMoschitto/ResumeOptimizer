import { ResumeAnalysis, APIError } from '../types';
import { ResumeContext } from '../components/ResumeForm';
import { resumeCache } from './cache';
import { apiClient } from './api-client';

/**
 * Legacy function for single OpenAI analysis
 * Now routes through backend for security
 */
export const analyzeResumeOptimized = async (
  resume: string,
  jobTitle: string,
  context?: ResumeContext,
  onProgress?: (progress: number) => void
): Promise<ResumeAnalysis> => {
  try {
    // Check cache first (using context as part of cache key)
    const cacheKey = `${resume}_${jobTitle}_${JSON.stringify(context)}`;
    const cachedResult = resumeCache.get(resume, jobTitle);
    if (cachedResult) {
      onProgress?.(100);
      return cachedResult;
    }

    // Use backend API instead of direct OpenAI call
    const result = await apiClient.analyzeWithProvider(
      resume,
      jobTitle,
      'openai',
      context,
      onProgress
    );

    // Cache the result
    resumeCache.set(resume, jobTitle, result.analysis);
    
    return result.analysis;
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    throw new APIError(
      error.message || 'Failed to analyze resume',
      error.status || 500
    );
  }
};
