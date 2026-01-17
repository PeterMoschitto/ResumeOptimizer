import { ComparisonAnalysis, AIProvider } from '../types';
import { ResumeContext } from '../components/ResumeForm';
import { apiClient } from './api-client';

/**
 * Multi-AI Orchestrator Service
 * Coordinates analysis across multiple AI providers via backend API
 */
export class MultiAIOrchestrator {
  private configuredProviders: AIProvider[] = [];
  private initialized = false;
  
  /**
   * Initialize and fetch configured providers from backend
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const data = await apiClient.getProviders();
      this.configuredProviders = data.providers as AIProvider[];
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize providers:', error);
      this.configuredProviders = [];
    }
  }
  
  /**
   * Get list of configured providers
   */
  async getConfiguredProviders(): Promise<AIProvider[]> {
    await this.initialize();
    return this.configuredProviders;
  }
  
  /**
   * Get list of configured providers (synchronous, may be empty if not initialized)
   */
  getConfiguredProvidersSync(): AIProvider[] {
    return this.configuredProviders;
  }
  
  /**
   * Analyze resume with all configured providers in parallel
   */
  async analyzeWithAllProviders(
    resume: string,
    jobTitle: string,
    context?: ResumeContext,
    onProgress?: (provider: AIProvider, progress: number) => void
  ): Promise<ComparisonAnalysis> {
    await this.initialize();
    return apiClient.analyzeWithMultipleProviders(resume, jobTitle, context, undefined, onProgress);
  }
  
  /**
   * Analyze resume with specific providers
   */
  async analyzeWithProviders(
    resume: string,
    jobTitle: string,
    context?: ResumeContext,
    providers?: AIProvider[],
    onProgress?: (provider: AIProvider, progress: number) => void
  ): Promise<ComparisonAnalysis> {
    await this.initialize();
    return apiClient.analyzeWithMultipleProviders(resume, jobTitle, context, providers, onProgress);
  }
}

export const multiAIOrchestrator = new MultiAIOrchestrator();
