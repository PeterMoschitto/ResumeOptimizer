import { AIProviderService, getResumeAnalysisPrompt, parseAnalysisResponse } from './ai-provider-base';
import { ResumeAnalysis, APIError } from '../types';
import { API_CONFIG } from '../constants';

/**
 * Anthropic Claude AI Provider Service
 */
export class AnthropicService implements AIProviderService {
  readonly providerId = 'anthropic';
  readonly providerName = 'Anthropic Claude';
  
  private apiKey: string | null = null;
  
  constructor() {
    this.apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || null;
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
      throw new APIError('Anthropic API key not configured', 500);
    }
    
    onProgress?.(10);
    
    try {
      const prompt = getResumeAnalysisPrompt(jobTitle);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: API_CONFIG.MAX_TOKENS,
          temperature: API_CONFIG.TEMPERATURE,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nPlease analyze this resume for a ${jobTitle} position:\n\n${resume}`
            }
          ]
        })
      });
      
      onProgress?.(50);
      
      if (!response.ok) {
        const error = await response.json();
        throw new APIError(
          error.error?.message || 'Failed to analyze resume with Anthropic',
          response.status
        );
      }
      
      const data = await response.json();
      const content = data.content[0].text;
      
      onProgress?.(90);
      
      const analysis = parseAnalysisResponse(content);
      
      onProgress?.(100);
      
      return analysis;
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(
        error.message || 'Failed to analyze resume with Anthropic',
        500
      );
    }
  }
}

export const anthropicService = new AnthropicService();
