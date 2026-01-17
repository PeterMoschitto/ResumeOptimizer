import { AIProviderService, getResumeAnalysisPrompt, parseAnalysisResponse } from './ai-provider-base';
import { ResumeAnalysis, APIError } from '../types';
import { API_CONFIG } from '../constants';
import { resumeCache } from './cache';

/**
 * OpenAI GPT-4 AI Provider Service
 */
export class OpenAIService implements AIProviderService {
  readonly providerId = 'openai';
  readonly providerName = 'OpenAI GPT-4';
  
  private apiKey: string | null = null;
  
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || null;
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  async analyzeResume(
    resume: string,
    jobTitle: string,
    onProgress?: (progress: number) => void
  ): Promise<ResumeAnalysis> {
    if (!this.apiKey) {
      throw new APIError('OpenAI API key not configured', 500);
    }
    
    // Check cache first
    const cachedResult = resumeCache.get(resume, jobTitle);
    if (cachedResult) {
      onProgress?.(100);
      return cachedResult;
    }
    
    onProgress?.(10);
    
    try {
      const prompt = getResumeAnalysisPrompt(jobTitle);
      
      const response = await this.retryWithBackoff(async () => {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: prompt
              },
              {
                role: 'user',
                content: `Please analyze this resume for a ${jobTitle} position:\n\n${resume}`
              }
            ],
            temperature: API_CONFIG.TEMPERATURE,
            max_tokens: API_CONFIG.MAX_TOKENS
          })
        });
        
        if (!res.ok) {
          const error = await res.json();
          if (error.error?.message?.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Retrying...');
          }
          throw new APIError(
            error.error?.message || 'Failed to analyze resume with OpenAI',
            res.status
          );
        }
        
        return res;
      });
      
      onProgress?.(50);
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      onProgress?.(90);
      
      const analysis = parseAnalysisResponse(content);
      
      onProgress?.(100);
      
      // Cache the result
      resumeCache.set(resume, jobTitle, analysis);
      
      return analysis;
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error.message || 'Failed to analyze resume with OpenAI',
        500
      );
    }
  }
  
  private async retryWithBackoff(
    fn: () => Promise<Response>,
    retries: number = API_CONFIG.MAX_RETRIES,
    delay: number = API_CONFIG.RETRY_DELAY
  ): Promise<Response> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries === 0 || !error.message?.includes('rate limit')) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(fn, retries - 1, delay * 2);
    }
  }
}

export const openaiService = new OpenAIService();

// Keep the old function for backward compatibility
export { analyzeResumeOptimized } from './openai-optimized';
