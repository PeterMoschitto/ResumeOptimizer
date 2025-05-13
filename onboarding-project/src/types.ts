export interface ResumeAnalysis {
  overallScore: number;
  improvements: string[];
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

export class APIError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
} 