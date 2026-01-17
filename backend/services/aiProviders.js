const { OpenAI } = require('openai');

/**
 * Base prompt template for resume analysis
 */
const getResumeAnalysisPrompt = (jobTitle, context = null) => {
  // Build context description for fair comparison
  let contextDescription = '';
  if (context) {
    const experienceLabels = {
      'student': 'Student (College/University)',
      'entry-level': 'Entry Level (0-2 years)',
      'mid-level': 'Mid Level (3-7 years)',
      'senior': 'Senior (8-12 years)',
      'executive': 'Executive/Lead (13+ years)'
    };
    
    const educationLabels = {
      'high-school': 'High School',
      'associates': "Associate's Degree",
      'bachelors': "Bachelor's Degree",
      'masters': "Master's Degree",
      'phd': 'PhD/Doctorate',
      'professional': 'Professional Certification'
    };
    
    contextDescription = `\n\nCONTEXT FOR FAIR COMPARISON:\n`;
    contextDescription += `- Experience Level: ${experienceLabels[context.experienceLevel] || context.experienceLevel}\n`;
    contextDescription += `- Years of Experience: ${context.yearsOfExperience} years\n`;
    contextDescription += `- Education Level: ${educationLabels[context.educationLevel] || context.educationLevel}\n`;
    if (context.industry) {
      contextDescription += `- Industry: ${context.industry}\n`;
    }
    if (context.location) {
      contextDescription += `- Location: ${context.location}\n`;
    }
    contextDescription += `\n\nCRITICAL SCORING INSTRUCTIONS BASED ON CONTEXT:\n`;
    contextDescription += `1. COMPARISON BASIS: Compare this resume ONLY to other candidates with similar experience levels and backgrounds (${context.experienceLevel} with ${context.yearsOfExperience} years, ${context.educationLevel} education).\n`;
    contextDescription += `2. SCORE ADJUSTMENT: Adjust your scoring expectations based on the candidate's career stage:\n`;
    
    // Add specific scoring guidance based on experience level
    if (context.experienceLevel === 'student') {
      contextDescription += `   - For students: Focus on education, projects, internships, and potential. A score of 75-85 is excellent for a student resume.\n`;
      contextDescription += `   - Don't penalize for lack of work experience - evaluate what they DO have.\n`;
    } else if (context.experienceLevel === 'entry-level') {
      contextDescription += `   - For entry-level: Focus on foundational skills, learning ability, and early achievements. A score of 70-80 is good for entry-level.\n`;
      contextDescription += `   - Don't expect senior-level accomplishments - evaluate growth potential.\n`;
    } else if (context.experienceLevel === 'mid-level') {
      contextDescription += `   - For mid-level: Expect demonstrated impact and technical depth. A score of 75-85 is good for mid-level.\n`;
      contextDescription += `   - Look for leadership indicators and quantifiable results.\n`;
    } else if (context.experienceLevel === 'senior' || context.experienceLevel === 'executive') {
      contextDescription += `   - For senior/executive: Expect strategic impact, leadership, and innovation. A score of 80-95 is expected.\n`;
      contextDescription += `   - Evaluate against industry leaders and top performers.\n`;
    }
    
    contextDescription += `3. BENCHMARK ADJUSTMENT: Set industryBenchmarks.averageScore and topPerformersScore relative to ${context.experienceLevel} candidates, not all professionals.\n`;
    contextDescription += `4. FEEDBACK RELEVANCE: Provide suggestions appropriate for ${context.experienceLevel} candidates. Don't suggest things unrealistic for their career stage.\n`;
  }
  
  return `You are an expert resume analyzer and career coach. Analyze the provided resume for a ${jobTitle} position and provide a comprehensive assessment.${contextDescription}

SCORING METHODOLOGY:
Calculate the overallScore (60-100) based on these weighted criteria:
- Content Quality (40%): Relevance to job title, quantifiable achievements, clear language, action-oriented descriptions
- Skills Alignment (30%): Match between resume skills and job requirements, technical competency, soft skills presentation
- Formatting & Structure (20%): Professional appearance, logical organization, ATS compatibility, readability
- Market Competitiveness (10%): Industry standards alignment, differentiation factors, career progression clarity

Score Guidelines:
- 85-95: Excellent (top performers) - Strong in all areas, stands out from competition
- 75-84: Good (above average) - Solid resume with minor areas for improvement
- 65-74: Average (needs improvement) - Adequate but missing key elements
- 60-64: Needs significant improvement - Major gaps or issues present

PRIORITIZATION REQUIREMENTS:
For each improvement suggestion, provide:
- impact: number (1-10 scale, where 10 = highest potential score increase)
- effort: "low", "medium", or "high" (estimated time/complexity to implement)
- category: "content", "formatting", "skills", "keywords", or "structure"
- estimatedScoreIncrease: number (estimated points this improvement could add to overall score, typically 0.5-5 points)

IMPORTANT: Return ONLY a valid JSON object with the following structure. Do not include any markdown formatting or additional text.

{
  "overallScore": number (60-100, calculated using the weighted methodology above),
  "improvements": ["specific improvement 1", "specific improvement 2", ...],
  "prioritizedImprovements": [
    {
      "text": "specific improvement description",
      "impact": number (1-10),
      "effort": "low" | "medium" | "high",
      "category": "content" | "formatting" | "skills" | "keywords" | "structure",
      "estimatedScoreIncrease": number (0.5-5 points)
    },
    ...
  ],
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
 * Parse and validate AI response
 */
const parseAnalysisResponse = (content) => {
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
  
  // Validate prioritizedImprovements if present
  if (parsed.prioritizedImprovements) {
    for (const imp of parsed.prioritizedImprovements) {
      if (!imp.text || !imp.impact || !imp.effort || !imp.category) {
        throw new Error('Invalid prioritizedImprovements: missing required fields');
      }
      if (imp.impact < 1 || imp.impact > 10) {
        throw new Error('Invalid impact: must be between 1 and 10');
      }
      if (!['low', 'medium', 'high'].includes(imp.effort)) {
        throw new Error('Invalid effort: must be low, medium, or high');
      }
    }
  }
  
  // Validate score range
  if (typeof parsed.overallScore !== 'number' || 
      parsed.overallScore < 60 || 
      parsed.overallScore > 100) {
    throw new Error('Invalid score: must be between 60 and 100');
  }
  
  return parsed;
};

/**
 * OpenAI Provider
 */
const analyzeWithOpenAI = async (resume, jobTitle, context = null) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = getResumeAnalysisPrompt(jobTitle, context);

  const completion = await openai.chat.completions.create({
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
    temperature: 0.3,
    max_tokens: 4000
  });

  const content = completion.choices[0].message.content;
  return parseAnalysisResponse(content);
};

/**
 * Anthropic Claude Provider
 * Uses claude-3-haiku for better free tier access (cheaper than sonnet)
 */
const analyzeWithAnthropic = async (resume, jobTitle, context = null) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const prompt = getResumeAnalysisPrompt(jobTitle, context);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      // Using haiku model - cheaper and has better free tier access
      // If you have credits, you can change this to 'claude-3-5-sonnet-20241022'
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nPlease analyze this resume for a ${jobTitle} position:\n\n${resume}`
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    const errorMsg = error.error?.message || 'Failed to analyze with Anthropic';
    
    // Provide helpful error message for billing issues
    if (errorMsg.includes('credit') || errorMsg.includes('billing') || errorMsg.includes('balance')) {
      throw new Error('Anthropic API: Insufficient credits. Please add credits at https://console.anthropic.com/settings/billing. Claude Haiku is very affordable (~$0.25 per 1M input tokens).');
    }
    
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const content = data.content[0].text;
  return parseAnalysisResponse(content);
};

/**
 * Google Gemini Provider
 * Uses gemini-1.5-flash-latest (free tier) - correct model name for v1 API
 */
const analyzeWithGoogle = async (resume, jobTitle, context = null) => {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('Google API key not configured');
  }

  const prompt = getResumeAnalysisPrompt(jobTitle, context);

  // Use the actual available models from Google Gemini API
  // Based on API response, these are the current available models
  // Try newer models first, then fallback to older ones
  const models = [
    'gemini-2.0-flash-exp',      // Latest experimental flash model
    'gemini-2.0-flash',          // Stable flash model
    'gemini-2.5-flash',          // Latest flash model
    'gemini-2.5-pro',            // Pro version
    'gemini-1.5-flash',          // Fallback to older version
    'gemini-1.5-pro',            // Older pro version
    'gemini-pro'                 // Legacy fallback
  ];
  let lastError = null;

  for (const model of models) {
    try {
      // Use v1 API - model names should NOT include "models/" prefix in the URL
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`,
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
              temperature: 0.3,
              maxOutputTokens: 4000
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        lastError = errorData.error?.message || `Failed with model ${model}`;
        
        // Check for quota/billing errors - these need user action
        if (lastError.includes('quota') || lastError.includes('billing') || lastError.includes('RESOURCE_EXHAUSTED')) {
          throw new Error(`Google Gemini: Free tier quota exceeded or billing not enabled. Please: 1) Enable billing in Google Cloud Console (https://console.cloud.google.com/billing), 2) Or wait for quota reset. Error: ${lastError}`);
        }
        
        // If model not found, try next model
        if (lastError.includes('not found') || lastError.includes('not supported') || lastError.includes('not available')) {
          continue;
        }
        
        throw new Error(lastError);
      }

      const data = await response.json();
      
      // Check if response has valid content
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Google Gemini');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      return parseAnalysisResponse(content);
    } catch (error) {
      // If it's a model not found error, try next model
      if (error.message?.includes('not found') || 
          error.message?.includes('not supported') || 
          error.message?.includes('not available')) {
        continue;
      }
      // Otherwise, rethrow the error
      throw error;
    }
  }

  // If all models failed, provide helpful error message
  throw new Error(`Google Gemini: No available models found. Last error: ${lastError || 'Unknown error'}. Please check: 1) Your API key is valid, 2) Gemini API is enabled (https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com), 3) Billing is enabled for free tier access (https://console.cloud.google.com/billing), 4) You're using the correct API key from https://makersuite.google.com/app/apikey`);
};

/**
 * Get list of configured providers
 */
const getConfiguredProviders = () => {
  const providers = [];
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (process.env.GOOGLE_API_KEY) providers.push('google');
  return providers;
};

module.exports = {
  analyzeWithOpenAI,
  analyzeWithAnthropic,
  analyzeWithGoogle,
  getConfiguredProviders
};
