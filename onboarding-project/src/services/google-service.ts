import { AIProviderService, getResumeAnalysisPrompt, parseAnalysisResponse } from './ai-provider-base';
import { ResumeAnalysis, APIError } from '../types';
import { API_CONFIG } from '../constants';

/**
 * Google Gemini AI Provider Service
 */
export class GoogleService implements AIProviderService {
  readonly providerId = 'google';
  readonly providerName = 'Google Gemini';
  
  private apiKey: string | null = null;
  
  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_API_KEY || null;
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
      throw new APIError('Google API key not configured', 500);
    }
    
    onProgress?.(10);
    
    try {
      const prompt = getResumeAnalysisPrompt(jobTitle);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${prompt}\n\nPlease analyze this resume for a ${jobTitle} position:\n\n${resume}`
              }]
            }],
            generationConfig: {
              temperature: API_CONFIG.TEMPERATURE,
              maxOutputTokens: API_CONFIG.MAX_TOKENS
            }
          })
        }
      );
      
      onProgress?.(50);
      
      if (!response.ok) {
        const error = await response.json();
        throw new APIError(
          error.error?.message || 'Failed to analyze resume with Google Gemini',
          response.status
        );
      }
      
      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      onProgress?.(90);
      
      const analysis = parseAnalysisResponse(content);
      
      onProgress?.(100);
      
      return analysis;
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error.message || 'Failed to analyze resume with Google Gemini',
        500
      );
    }
  }
}

export const googleService = new GoogleService();
