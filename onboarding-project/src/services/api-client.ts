import { ResumeAnalysis, ComparisonAnalysis, ProviderAnalysis, AIProvider } from '../types';
import { ResumeContext } from '../components/ResumeForm';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * API Client for backend communication
 * All AI provider calls go through the backend for security
 */
class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<{ status: string; providers: string[] }> {
    const response = await fetch(`${this.baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error('Backend server is not available');
    }
    return response.json();
  }

  /**
   * Get list of configured providers
   */
  async getProviders(): Promise<{ providers: string[]; providerNames: Record<string, string> }> {
    const response = await fetch(`${this.baseUrl}/api/providers`);
    if (!response.ok) {
      throw new Error('Failed to fetch providers');
    }
    return response.json();
  }

  /**
   * Analyze resume with a single provider
   */
  async analyzeWithProvider(
    resume: string,
    jobTitle: string,
    provider: AIProvider,
    context?: ResumeContext,
    onProgress?: (progress: number) => void
  ): Promise<ProviderAnalysis> {
    onProgress?.(10);

    const response = await fetch(`${this.baseUrl}/api/analyze/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resume, jobTitle, context })
    });

    onProgress?.(50);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to analyze with ${provider}`);
    }

    onProgress?.(90);

    const data = await response.json();
    
    onProgress?.(100);

    return {
      provider: data.provider,
      providerName: data.providerName,
      analysis: data.analysis,
      timestamp: data.timestamp,
      responseTime: data.responseTime
    };
  }

  /**
   * Analyze resume with multiple providers in parallel
   */
  async analyzeWithMultipleProviders(
    resume: string,
    jobTitle: string,
    context?: ResumeContext,
    providers?: AIProvider[],
    onProgress?: (provider: AIProvider, progress: number) => void
  ): Promise<ComparisonAnalysis> {
    // If no providers specified, get all configured providers
    let providersToUse = providers;
    if (!providersToUse || providersToUse.length === 0) {
      const providersData = await this.getProviders();
      providersToUse = providersData.providers as AIProvider[];
    }

    if (providersToUse.length === 0) {
      throw new Error('No AI providers are configured');
    }

    // Update progress for each provider
    providersToUse.forEach(provider => onProgress?.(provider, 10));

    const response = await fetch(`${this.baseUrl}/api/analyze/multi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resume, jobTitle, context, providers: providersToUse })
    });

    providersToUse.forEach(provider => onProgress?.(provider, 50));

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to analyze resume');
    }

    const data = await response.json();

    providersToUse.forEach(provider => onProgress?.(provider, 100));

    // Transform backend response to frontend ComparisonAnalysis format
    const analyses: ProviderAnalysis[] = data.analyses.map((a: any) => ({
      provider: a.provider,
      providerName: a.providerName,
      analysis: a.analysis || ({} as ResumeAnalysis),
      timestamp: a.timestamp,
      responseTime: a.responseTime,
      error: a.error
    }));

    const successfulAnalyses = analyses.filter(a => !a.error && a.analysis.overallScore);

    // Generate comparison insights
    let consensus = {
      averageScore: 0,
      scoreRange: { min: 0, max: 0 },
      scoreStdDev: 0,
      agreedImprovements: [] as string[],
      agreedMissingSkills: [] as string[],
      scoreVariance: 0
    };

    let divergence = {
      scoreDifferences: [] as Array<{ provider1: AIProvider; provider2: AIProvider; difference: number }>,
      uniqueImprovements: [] as Array<{ provider: AIProvider; improvements: string[] }>,
      conflictingRecommendations: [] as any[]
    };

    let insights = {
      mostConsistentProvider: 'openai' as AIProvider,
      mostOptimisticProvider: 'openai' as AIProvider,
      mostCriticalProvider: 'openai' as AIProvider,
      keyAgreements: [] as string[],
      keyDisagreements: [] as string[]
    };

    if (successfulAnalyses.length > 0) {
      const scores = successfulAnalyses.map(a => a.analysis.overallScore);
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
      const scoreStdDev = Math.sqrt(variance);

      // Find agreed improvements
      const allImprovements = successfulAnalyses.flatMap(a => a.analysis.improvements);
      const improvementCounts = new Map<string, number>();
      allImprovements.forEach(imp => {
        improvementCounts.set(imp, (improvementCounts.get(imp) || 0) + 1);
      });
      const agreedImprovements = Array.from(improvementCounts.entries())
        .filter(([_, count]) => count >= successfulAnalyses.length * 0.5)
        .map(([imp, _]) => imp);

      // Find agreed missing skills
      const allMissingSkills = successfulAnalyses.flatMap(a => a.analysis.skills.missing);
      const missingSkillCounts = new Map<string, number>();
      allMissingSkills.forEach(skill => {
        missingSkillCounts.set(skill, (missingSkillCounts.get(skill) || 0) + 1);
      });
      const agreedMissingSkills = Array.from(missingSkillCounts.entries())
        .filter(([_, count]) => count >= successfulAnalyses.length * 0.5)
        .map(([skill, _]) => skill);

      consensus = {
        averageScore,
        scoreRange: { min: minScore, max: maxScore },
        scoreStdDev,
        agreedImprovements,
        agreedMissingSkills,
        scoreVariance: variance
      };

      // Calculate score differences
      const scoreDifferences: typeof divergence.scoreDifferences = [];
      for (let i = 0; i < successfulAnalyses.length; i++) {
        for (let j = i + 1; j < successfulAnalyses.length; j++) {
          const diff = Math.abs(
            successfulAnalyses[i].analysis.overallScore - 
            successfulAnalyses[j].analysis.overallScore
          );
          scoreDifferences.push({
            provider1: successfulAnalyses[i].provider,
            provider2: successfulAnalyses[j].provider,
            difference: diff
          });
        }
      }

      // Find unique improvements
      const uniqueImprovements = successfulAnalyses.map(analysis => ({
        provider: analysis.provider,
        improvements: analysis.analysis.improvements.filter(
          imp => !agreedImprovements.includes(imp)
        )
      }));

      divergence = {
        scoreDifferences,
        uniqueImprovements,
        conflictingRecommendations: []
      };

      // Find most optimistic and critical
      const mostOptimistic = successfulAnalyses.reduce((prev, curr) => 
        curr.analysis.overallScore > prev.analysis.overallScore ? curr : prev
      );
      const mostCritical = successfulAnalyses.reduce((prev, curr) => 
        curr.analysis.overallScore < prev.analysis.overallScore ? curr : prev
      );
      const mostConsistent = successfulAnalyses.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.analysis.overallScore - averageScore);
        const currDiff = Math.abs(curr.analysis.overallScore - averageScore);
        return currDiff < prevDiff ? curr : prev;
      });

      insights = {
        mostConsistentProvider: mostConsistent.provider,
        mostOptimisticProvider: mostOptimistic.provider,
        mostCriticalProvider: mostCritical.provider,
        keyAgreements: [
          `Average score: ${averageScore.toFixed(1)}/100`,
          `${agreedImprovements.length} agreed improvements`,
          `${agreedMissingSkills.length} agreed missing skills`
        ],
        keyDisagreements: [
          `Score range: ${minScore} - ${maxScore} (${(maxScore - minScore).toFixed(1)} point difference)`,
          `${uniqueImprovements.reduce((sum, u) => sum + u.improvements.length, 0)} unique recommendations`
        ]
      };
    }

    return {
      analyses,
      consensus,
      divergence,
      insights,
      actionPlan: data.actionPlan || undefined
    };
  }
}

export const apiClient = new APIClient();
