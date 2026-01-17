import { ResumeAnalysis } from '../types';

/**
 * Base interface for all AI provider services
 */
export interface AIProviderService {
  /**
   * Unique identifier for the provider
   */
  readonly providerId: string;
  
  /**
   * Human-readable name for the provider
   */
  readonly providerName: string;
  
  /**
   * Check if the provider is configured and available
   */
  isConfigured(): boolean;
  
  /**
   * Analyze a resume for a specific job title
   * @param resume The resume text content
   * @param jobTitle The target job title
   * @param onProgress Optional progress callback (0-100)
   * @returns Promise resolving to ResumeAnalysis
   */
  analyzeResume(
    resume: string,
    jobTitle: string,
    onProgress?: (progress: number) => void
  ): Promise<ResumeAnalysis>;
}

/**
 * Standard prompt template for resume analysis
 * All providers should use this structure for consistency
 */
export const getResumeAnalysisPrompt = (jobTitle: string): string => {
  return `You are an expert resume analyzer and career coach. Analyze the provided resume for a ${jobTitle} position and provide a comprehensive assessment.

IMPORTANT: Return ONLY a valid JSON object with the following structure. Do not include any markdown formatting or additional text.

{
  "overallScore": number (60-100, where 85-95 is excellent, 75-84 is good, 65-74 is average, 60-64 needs improvement),
  "improvements": ["specific improvement 1", "specific improvement 2", ...],
  "rewrites": [
    {
      "section": "section name",
      "original": "original text",
      "improved": "improved version"
    }
  ],
  "skills": {
    "matching": ["skill 1", "skill 2", ...],
    "missing": ["missing skill 1", "missing skill 2", ...],
    "suggested": ["suggested skill 1", "suggested skill 2", ...]
  },
  "keywords": ["keyword 1", "keyword 2", ...],
  "formatting": {
    "issues": ["issue 1", "issue 2", ...],
    "suggestions": ["suggestion 1", "suggestion 2", ...]
  },
  "impact": {
    "strengths": ["strength 1", "strength 2", ...],
    "weaknesses": ["weakness 1", "weakness 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...]
  },
  "competitorAnalysis": {
    "marketPosition": "brief market position assessment",
    "competitiveAdvantages": ["advantage 1", "advantage 2", ...],
    "competitiveDisadvantages": ["disadvantage 1", "disadvantage 2", ...],
    "differentiationStrategies": ["strategy 1", "strategy 2", ...],
    "industryBenchmarks": {
      "averageScore": 75,
      "topPerformersScore": 90,
      "yourScore": number
    },
    "industryAnalysis": {
      "trends": ["trend 1", "trend 2", ...],
      "inDemandSkills": ["skill 1", "skill 2", ...],
      "salaryRange": {
        "entry": "$X-$Y",
        "mid": "$X-$Y",
        "senior": "$X-$Y"
      },
      "topCompanies": ["company 1", "company 2", ...],
      "growthAreas": ["area 1", "area 2", ...]
    },
    "careerProgression": {
      "currentLevel": "entry/mid/senior/lead",
      "nextSteps": {
        "shortTerm": ["step 1", "step 2", ...],
        "mediumTerm": ["step 1", "step 2", ...],
        "longTerm": ["step 1", "step 2", ...]
      },
      "skillGaps": {
        "technical": ["gap 1", "gap 2", ...],
        "soft": ["gap 1", "gap 2", ...],
        "industry": ["gap 1", "gap 2", ...]
      },
      "certifications": {
        "recommended": ["cert 1", "cert 2", ...],
        "priority": ["priority cert 1", "priority cert 2", ...]
      },
      "careerPaths": {
        "primary": "primary path",
        "alternatives": ["alt 1", "alt 2", ...],
        "requirements": {
          "path1": ["req 1", "req 2", ...],
          "path2": ["req 1", "req 2", ...]
        }
      }
    }
  }
}`;
};

/**
 * Validate and parse JSON response from AI providers
 */
export const parseAnalysisResponse = (content: string): ResumeAnalysis => {
  // Remove markdown code blocks if present
  let cleaned = content.replace(/```json\s*|```/gi, '').trim();
  
  // Extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON object found in response');
  }
  
  const parsed = JSON.parse(jsonMatch[0]);
  
  // Validate required fields
  const requiredFields = [
    'overallScore',
    'improvements',
    'skills',
    'formatting',
    'impact',
    'competitorAnalysis'
  ];
  
  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Invalid response: missing required field '${field}'`);
    }
  }
  
  // Validate score range
  if (typeof parsed.overallScore !== 'number' || 
      parsed.overallScore < 60 || 
      parsed.overallScore > 100) {
    throw new Error('Invalid score: must be between 60 and 100');
  }
  
  return parsed as ResumeAnalysis;
};
