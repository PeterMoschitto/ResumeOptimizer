require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Input validation middleware
const validateInput = (req, res, next) => {
  const { resume, jobTitle } = req.body;
  
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

  next();
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Routes
app.post('/api/analyze', validateInput, async (req, res) => {
  try {
    const { resume, jobTitle } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional resume analyzer. Analyze the provided resume and provide detailed feedback."
        },
        {
          role: "user",
          content: `Analyze this resume for a ${jobTitle} position:\n\n${resume}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    res.json({
      analysis: completion.choices[0].message.content
    });
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
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 