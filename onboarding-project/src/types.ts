export interface PrioritizedImprovement {
  text: string;
  impact: number; // 1-10 scale
  effort: 'low' | 'medium' | 'high';
  category: 'content' | 'formatting' | 'skills' | 'keywords' | 'structure';
  estimatedScoreIncrease?: number; // Estimated points this could add
  efficiency?: number; // impact / effort (calculated)
  relatedSectionIds?: string[]; // IDs of resume sections this improvement relates to
  isCompleted?: boolean; // Whether user has completed this improvement
}

export interface ResumeAnalysis {
  overallScore: number;
  improvements: string[];
  prioritizedImprovements?: PrioritizedImprovement[]; // New prioritized format
  rewrites: {
    section: string;
    original: string;
    improved: string;
  }[];
  skills: {
    matching: string[];
    missing: string[];
    suggested: string[];
  };
  keywords: string[];
  formatting: {
    issues: string[];
    suggestions: string[];
  };
  impact: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  competitorAnalysis: {
    marketPosition: string;
    competitiveAdvantages: string[];
    competitiveDisadvantages: string[];
    differentiationStrategies: string[];
    industryBenchmarks: {
      averageScore: number;
      topPerformersScore: number;
      yourScore: number;
    };
    industryAnalysis: {
      trends: string[];
      inDemandSkills: string[];
      salaryRange: {
        entry: string;
        mid: string;
        senior: string;
      };
      topCompanies: string[];
      growthAreas: string[];
    };
    careerProgression: {
      currentLevel: string;
      nextSteps: {
        shortTerm: string[];
        mediumTerm: string[];
        longTerm: string[];
      };
      skillGaps: {
        technical: string[];
        soft: string[];
        industry: string[];
      };
      certifications: {
        recommended: string[];
        priority: string[];
      };
      careerPaths: {
        primary: string;
        alternatives: string[];
        requirements: {
          [path: string]: string[];
        };
      };
    };
  };
}

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'cohere';

export interface ProviderAnalysis {
  provider: AIProvider;
  providerName: string;
  analysis: ResumeAnalysis;
  timestamp: number;
  responseTime?: number;
  error?: string;
}

export interface PrioritizedActionPlan {
  quickWins: PrioritizedImprovement[]; // High impact, low effort
  strategic: PrioritizedImprovement[]; // High impact, high effort
  lowPriority: PrioritizedImprovement[]; // Low impact
  allPrioritized: PrioritizedImprovement[]; // All sorted by efficiency
}

export interface ComparisonAnalysis {
  analyses: ProviderAnalysis[];
  consensus: {
    averageScore: number;
    scoreRange: { min: number; max: number };
    scoreStdDev: number;
    agreedImprovements: string[];
    agreedMissingSkills: string[];
    scoreVariance: number;
  };
  actionPlan?: PrioritizedActionPlan; // New prioritized action plan
  divergence: {
    scoreDifferences: Array<{
      provider1: AIProvider;
      provider2: AIProvider;
      difference: number;
    }>;
    uniqueImprovements: Array<{
      provider: AIProvider;
      improvements: string[];
    }>;
    conflictingRecommendations: Array<{
      topic: string;
      providers: Array<{
        provider: AIProvider;
        recommendation: string;
      }>;
    }>;
  };
  insights: {
    mostConsistentProvider: AIProvider;
    mostOptimisticProvider: AIProvider;
    mostCriticalProvider: AIProvider;
    keyAgreements: string[];
    keyDisagreements: string[];
  };
}

export class APIError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
} 