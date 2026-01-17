require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  analyzeWithOpenAI,
  analyzeWithAnthropic,
  analyzeWithGoogle,
  getConfiguredProviders
} = require('./services/aiProviders');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
// CORS configuration - allow frontend domain in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || '*' // Set FRONTEND_URL in production
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Allow larger payloads for resumes

// Input validation middleware
const validateInput = (req, res, next) => {
  const { resume, jobTitle, context } = req.body;
  
  if (!resume || !jobTitle) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Both resume and jobTitle are required'
    });
  }

  if (typeof resume !== 'string' || typeof jobTitle !== 'string') {
    return res.status(400).json({
      error: 'Invalid input types',
      message: 'Resume and jobTitle must be strings'
    });
  }

  if (resume.length < 10) {
    return res.status(400).json({
      error: 'Invalid resume length',
      message: 'Resume must be at least 10 characters long'
    });
  }

  // Validate context if provided
  if (context) {
    const requiredContextFields = ['experienceLevel', 'yearsOfExperience', 'educationLevel'];
    for (const field of requiredContextFields) {
      if (!context[field]) {
        return res.status(400).json({
          error: 'Invalid context',
          message: `Context field '${field}' is required`
        });
      }
    }
  }

  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    providers: getConfiguredProviders()
  });
});

// Get configured providers
app.get('/api/providers', (req, res) => {
  res.json({
    providers: getConfiguredProviders(),
    providerNames: {
      openai: 'OpenAI GPT-4',
      anthropic: 'Anthropic Claude',
      google: 'Google Gemini'
    }
  });
});

// Multi-provider analysis endpoint (must come before single provider route)
app.post('/api/analyze/multi', validateInput, async (req, res) => {
  try {
    const { resume, jobTitle, providers, context } = req.body;
    const requestedProviders = providers || getConfiguredProviders();

    if (requestedProviders.length === 0) {
      return res.status(400).json({
        error: 'No providers configured',
        message: 'Please configure at least one AI provider API key'
      });
    }

    const startTime = Date.now();
    const analysisPromises = requestedProviders.map(async (provider) => {
      const providerStartTime = Date.now();
      try {
        let analysis;
        switch (provider) {
          case 'openai':
            analysis = await analyzeWithOpenAI(resume, jobTitle, context);
            break;
          case 'anthropic':
            analysis = await analyzeWithAnthropic(resume, jobTitle, context);
            break;
          case 'google':
            analysis = await analyzeWithGoogle(resume, jobTitle, context);
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }

        return {
          provider,
          providerName: {
            openai: 'OpenAI GPT-4',
            anthropic: 'Anthropic Claude',
            google: 'Google Gemini'
          }[provider],
          analysis,
          timestamp: Date.now(),
          responseTime: Date.now() - providerStartTime
        };
      } catch (error) {
        return {
          provider,
          providerName: {
            openai: 'OpenAI GPT-4',
            anthropic: 'Anthropic Claude',
            google: 'Google Gemini'
          }[provider],
          analysis: null,
          timestamp: Date.now(),
          responseTime: Date.now() - providerStartTime,
          error: error.message || 'Analysis failed'
        };
      }
    });

    const results = await Promise.allSettled(analysisPromises);
    
    // Handle both resolved and rejected promises
    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // If promise was rejected, return error result
        const provider = requestedProviders[index];
        return {
          provider,
          providerName: {
            openai: 'OpenAI GPT-4',
            anthropic: 'Anthropic Claude',
            google: 'Google Gemini'
          }[provider],
          analysis: null,
          timestamp: Date.now(),
          responseTime: 0,
          error: result.reason?.message || 'Analysis failed'
        };
      }
    });
    
    const successfulAnalyses = processedResults.filter(r => !r.error && r.analysis);

    // Generate comparison metrics
    let comparison = null;
    if (successfulAnalyses.length > 1) {
      const scores = successfulAnalyses.map(a => a.analysis.overallScore);
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scores.length;
      const scoreStdDev = Math.sqrt(variance);

      // Find agreed improvements
      const allImprovements = successfulAnalyses.flatMap(a => a.analysis.improvements);
      const improvementCounts = new Map();
      allImprovements.forEach(imp => {
        improvementCounts.set(imp, (improvementCounts.get(imp) || 0) + 1);
      });
      const agreedImprovements = Array.from(improvementCounts.entries())
        .filter(([_, count]) => count >= successfulAnalyses.length * 0.5)
        .map(([imp, _]) => imp);

      // Find agreed missing skills
      const allMissingSkills = successfulAnalyses.flatMap(a => a.analysis.skills.missing);
      const missingSkillCounts = new Map();
      allMissingSkills.forEach(skill => {
        missingSkillCounts.set(skill, (missingSkillCounts.get(skill) || 0) + 1);
      });
      const agreedMissingSkills = Array.from(missingSkillCounts.entries())
        .filter(([_, count]) => count >= successfulAnalyses.length * 0.5)
        .map(([skill, _]) => skill);

      comparison = {
        averageScore,
        scoreRange: { min: minScore, max: maxScore },
        scoreStdDev,
        agreedImprovements,
        agreedMissingSkills,
        scoreVariance: variance
      };
    }

    // Generate prioritized action plan
    let actionPlan = null;
    try {
      const { createPrioritizedActionPlan } = require('./services/prioritization');
      actionPlan = createPrioritizedActionPlan(processedResults);
    } catch (error) {
      console.error('Error creating action plan:', error);
      // Continue without action plan if there's an error
    }
    
    res.json({
      analyses: processedResults,
      comparison,
      actionPlan,
      totalTime: Date.now() - startTime,
      successCount: successfulAnalyses.length,
      totalRequested: requestedProviders.length
    });
  } catch (error) {
    console.error('Error in multi-provider analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze resume',
      message: error.message
    });
  }
});

// Single provider analysis endpoint
app.post('/api/analyze/:provider', validateInput, async (req, res) => {
  try {
    const { provider } = req.params;
    const { resume, jobTitle, context } = req.body;
    const startTime = Date.now();

    let analysis;
    switch (provider) {
      case 'openai':
        analysis = await analyzeWithOpenAI(resume, jobTitle, context);
        break;
      case 'anthropic':
        analysis = await analyzeWithAnthropic(resume, jobTitle, context);
        break;
      case 'google':
        analysis = await analyzeWithGoogle(resume, jobTitle, context);
        break;
      default:
        return res.status(400).json({
          error: 'Invalid provider',
          message: `Provider '${provider}' is not supported. Available: openai, anthropic, google`
        });
    }

    const responseTime = Date.now() - startTime;

    res.json({
      provider,
      providerName: {
        openai: 'OpenAI GPT-4',
        anthropic: 'Anthropic Claude',
        google: 'Google Gemini'
      }[provider],
      analysis,
      responseTime,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error(`Error analyzing with ${req.params.provider}:`, error);
    res.status(500).json({
      error: 'Failed to analyze resume',
      message: error.message,
      provider: req.params.provider
    });
  }
});

// Legacy endpoint for backward compatibility
app.post('/api/analyze', validateInput, async (req, res) => {
  try {
    const { resume, jobTitle, context } = req.body;
    const analysis = await analyzeWithOpenAI(resume, jobTitle, context);
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing resume:', error);
    res.status(500).json({
      error: 'Failed to analyze resume',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong',
    message: err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Configured providers: ${getConfiguredProviders().join(', ') || 'None'}`);
});
