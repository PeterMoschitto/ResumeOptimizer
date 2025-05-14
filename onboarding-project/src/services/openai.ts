import { ResumeAnalysis, APIError } from '../types';
import { resumeCache } from './cache';

const CHUNK_SIZE = 1000; // Process resume in chunks of 1000 characters
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Get API key from environment
const getApiKey = () => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please check your environment variables.');
  }
  return apiKey;
};

// Validate the response structure
const validateAnalysisResponse = (data: any): ResumeAnalysis => {
  const requiredFields = [
    'overallScore',
    'improvements',
    'skills',
    'formatting',
    'impact',
    'competitorAnalysis'
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Invalid response: missing required field '${field}'`);
    }
  }

  // Validate score range
  if (typeof data.overallScore !== 'number' || 
      data.overallScore < 60 || 
      data.overallScore > 100) {
    throw new Error('Invalid score: must be between 60 and 100');
  }

  return data as ResumeAnalysis;
};

// Retry mechanism for API calls
const retryWithBackoff = async (
  fn: () => Promise<any>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || !error.message?.includes('rate limit')) {
      throw error;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

export const analyzeResume = async (
  resume: string,
  jobTitle: string,
  onProgress?: (progress: number) => void
): Promise<ResumeAnalysis> => {
  try {
    // Check cache first
    const cachedResult = resumeCache.get(resume, jobTitle);
    if (cachedResult) {
      onProgress?.(100);
      return cachedResult;
    }

    const apiKey = getApiKey();

    // Initialize progress
    onProgress?.(0);

    // Split resume into chunks
    const chunks = [];
    for (let i = 0; i < resume.length; i += CHUNK_SIZE) {
      chunks.push(resume.slice(i, i + CHUNK_SIZE));
    }

    // Process each chunk with retry mechanism
    const chunkResults = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const response = await retryWithBackoff(async () => {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `You are a professional resume analyzer. Analyze the following resume section for a ${jobTitle} position. Focus on extracting key information, skills, and achievements. Return ONLY a JSON object with the following structure:
                {
                  "skills": string[],
                  "achievements": string[],
                  "experience": string[],
                  "education": string[]
                }`
              },
              {
                role: 'user',
                content: chunk
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (!res.ok) {
          const error = await res.json();
          if (error.error?.message?.includes('rate limit')) {
            throw new Error('Rate limit exceeded. Retrying...');
          }
          throw new Error(error.error?.message || 'Failed to analyze resume');
        }

        return res;
      });

      const data = await response.json();
      const chunkResult = data.choices[0].message.content;
      
      try {
        // Ensure the chunk result is valid JSON
        const parsedChunk = JSON.parse(chunkResult);
        chunkResults.push(parsedChunk);
      } catch (e) {
        console.error('Error parsing chunk result:', e);
        throw new Error('Failed to parse chunk analysis');
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / chunks.length) * 100);
      onProgress?.(progress);
    }

    // Combine and process results
    const combinedResult = JSON.stringify(chunkResults);
    
    // Final analysis with retry mechanism
    const finalResponse = await retryWithBackoff(async () => {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are a professional resume analyzer. Based on the analyzed sections, provide a comprehensive analysis for a ${jobTitle} position. Return ONLY a JSON object with the following structure. For scoring:
              - Scores should be whole numbers between 60 and 100
              - Average scores should be between 70-80
              - Top performer scores should be between 85-95
              - Your score should be based on content quality, skills match, and formatting
              Example scores:
              - Strong resume: 85-95
              - Good resume: 75-84
              - Average resume: 65-74
              - Needs improvement: 60-64

              {
                "overallScore": number,
                "improvements": string[],
                "rewrites": [{"section": string, "original": string, "improved": string}],
                "skills": {
                  "matching": string[],
                  "missing": string[],
                  "suggested": string[]
                },
                "keywords": string[],
                "formatting": {
                  "issues": string[],
                  "suggestions": string[]
                },
                "impact": {
                  "strengths": string[],
                  "weaknesses": string[],
                  "recommendations": string[]
                },
                "competitorAnalysis": {
                  "marketPosition": string,
                  "competitiveAdvantages": string[],
                  "competitiveDisadvantages": string[],
                  "differentiationStrategies": string[],
                  "industryBenchmarks": {
                    "averageScore": number,
                    "topPerformersScore": number,
                    "yourScore": number
                  },
                  "industryAnalysis": {
                    "trends": string[],
                    "inDemandSkills": string[],
                    "salaryRange": {
                      "entry": string,
                      "mid": string,
                      "senior": string
                    },
                    "topCompanies": string[],
                    "growthAreas": string[]
                  },
                  "careerProgression": {
                    "currentLevel": string,
                    "nextSteps": {
                      "shortTerm": string[],
                      "mediumTerm": string[],
                      "longTerm": string[]
                    },
                    "skillGaps": {
                      "technical": string[],
                      "soft": string[],
                      "industry": string[]
                    },
                    "certifications": {
                      "recommended": string[],
                      "priority": string[]
                    },
                    "careerPaths": {
                      "primary": string,
                      "alternatives": string[],
                      "requirements": {
                        "[path]": string[]
                      }
                    }
                  }
                }
              }`
            },
            {
              role: 'user',
              content: combinedResult
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!res.ok) {
        const error = await res.json();
        if (error.error?.message?.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Retrying...');
        }
        throw new Error(error.error?.message || 'Failed to generate final analysis');
      }

      return res;
    });

    const finalResult = await finalResponse.json();
    const analysis = JSON.parse(finalResult.choices[0].message.content);
    
    // Validate the final analysis
    const validatedAnalysis = validateAnalysisResponse(analysis);

    // Update progress to 100%
    onProgress?.(100);

    // Cache the result before returning
    resumeCache.set(resume, jobTitle, validatedAnalysis);
    return validatedAnalysis;
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    throw new APIError(
      error.message || 'Failed to analyze resume',
      error.status || 500
    );
  }
}; 