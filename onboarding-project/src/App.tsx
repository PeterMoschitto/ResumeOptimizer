import React, { useState, useEffect } from 'react';
import './App.css';
import ResumeForm from './components/ResumeForm';
import AISuggestions from './components/AISuggestions';
import { analyzeResume } from './services/openai';

function App() {
  const [suggestions, setSuggestions] = useState<null | {
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
  }>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPIKey = async () => {
      const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        setError('OpenAI API key not found. Please add REACT_APP_OPENAI_API_KEY to your .env file.');
        return;
      }

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: "Say 'API key is working!' if you can read this."
              }
            ],
            max_tokens: 10
          })
        });

        if (!response.ok) {
          const error = await response.json();
          if (error.error?.message?.includes('quota')) {
            setError('API quota exceeded. Please check your OpenAI account billing and usage limits at https://platform.openai.com/account/usage');
          } else {
            setError(`API Error: ${error.error?.message || 'Unknown error'}`);
          }
          return;
        }

        const data = await response.json();
        console.log('✅ API key is working! Response:', data.choices[0].message.content);
      } catch (error) {
        setError(`Error testing API: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testAPIKey();
  }, []);

  const handleResumeSubmit = async (resume: string, jobTitle: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      const analysis = await analyzeResume(resume, jobTitle, (progress) => {
        setProgress(progress);
      });

      setSuggestions(analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze resume');
      console.error('Error analyzing resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resume Optimizer</h1>
        <p>Get AI-powered suggestions to tailor your resume for specific job positions</p>
      </header>
      <main className="App-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <ResumeForm onSubmit={handleResumeSubmit} isLoading={isLoading} />
        {suggestions && (
          <AISuggestions 
            suggestions={suggestions} 
            isLoading={isLoading}
            progress={progress}
          />
        )}
      </main>
    </div>
  );
}

export default App;
