import React, { useState, useEffect } from 'react';
import './App.css';
import ResumeForm, { ResumeContext } from './components/ResumeForm';
import AISuggestions from './components/AISuggestions';
import ComparisonDashboard from './components/ComparisonDashboard';
import ResumeEditor from './components/ResumeEditor';
import { analyzeResumeOptimized } from './services/openai-optimized';
import { multiAIOrchestrator } from './services/multi-ai-orchestrator';
import { handleAPIError } from './utils/errorHandler';
import { getEnvironmentConfig } from './utils/envValidator';
import { ResumeAnalysis, ComparisonAnalysis } from './types';

function App() {
  const [suggestions, setSuggestions] = useState<ResumeAnalysis | null>(null);
  const [comparison, setComparison] = useState<ComparisonAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [useMultiAI, setUseMultiAI] = useState(true);
  const [currentResume, setCurrentResume] = useState<string>('');
  const [currentResumeFile, setCurrentResumeFile] = useState<File | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const testBackendConnection = async () => {
      try {
        const { apiClient } = await import('./services/api-client');
        const health = await apiClient.healthCheck();
        console.log('✅ Backend connected! Available providers:', health.providers);
        
        if (health.providers.length === 0) {
          setError('No AI providers configured. Please set up API keys in the backend .env file.');
        }
      } catch (error) {
        const apiError = handleAPIError(error);
        setError(apiError.userFriendly || 'Cannot connect to backend server. Please ensure the backend is running on port 5001.');
      }
    };

    testBackendConnection();
  }, []);

  const handleResumeSubmit = async (resume: string, jobTitle: string, context: ResumeContext, resumeFile?: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress({});
      setSuggestions(null);
      setComparison(null);
      setCurrentResume(resume);
      setCurrentResumeFile(resumeFile || null);
      setShowEditor(false);

      if (useMultiAI) {
        // Use multi-AI comparison
        const comparisonResult = await multiAIOrchestrator.analyzeWithAllProviders(
          resume,
          jobTitle,
          context,
          (provider, providerProgress) => {
            setProgress(prev => ({
              ...prev,
              [provider]: providerProgress
            }));
          }
        );
        setComparison(comparisonResult);
        // Set suggestions to the first successful analysis for backward compatibility
        const firstSuccess = comparisonResult.analyses.find(a => !a.error);
        if (firstSuccess) {
          setSuggestions(firstSuccess.analysis);
        }
      } else {
        // Use single AI (OpenAI only)
        const analysis = await analyzeResumeOptimized(resume, jobTitle, context, (progress: number) => {
          setProgress({ openai: progress });
        });
        setSuggestions(analysis);
      }
    } catch (err: any) {
      const apiError = handleAPIError(err);
      setError(apiError.userFriendly || 'Failed to analyze resume');
      console.error('Error analyzing resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [configuredProviders, setConfiguredProviders] = React.useState<string[]>([]);

  React.useEffect(() => {
    multiAIOrchestrator.getConfiguredProviders().then(providers => {
      setConfiguredProviders(providers);
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Resume Analyzer & Comparison Platform</h1>
        <p>Compare how different AI models analyze and grade your resume</p>
      </header>
      <main className="App-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <label>
            <input
              type="checkbox"
              checked={useMultiAI}
              onChange={(e) => setUseMultiAI(e.target.checked)}
            />
            <span>Multi-AI Comparison Mode</span>
          </label>
          {useMultiAI && (
            <div className="providers-info">
              Configured providers: {configuredProviders.length > 0 
                ? configuredProviders.map(p => {
                    const names: Record<string, string> = {
                      openai: 'OpenAI GPT-4',
                      anthropic: 'Anthropic Claude',
                      google: 'Google Gemini'
                    };
                    return names[p] || p;
                  }).join(', ')
                : 'Loading...'}
            </div>
          )}
        </div>

        <ResumeForm onSubmit={handleResumeSubmit} isLoading={isLoading} />
        
        {/* Show Resume Editor if enabled */}
        {showEditor && comparison?.actionPlan && currentResume && (
          <ResumeEditor
            originalResume={currentResume}
            originalResumeFile={currentResumeFile || undefined}
            actionPlan={comparison.actionPlan}
            currentScore={comparison.consensus.averageScore}
            onResumeUpdate={(updated) => setCurrentResume(updated)}
            onBack={() => setShowEditor(false)}
          />
        )}

        {/* Show comparison dashboard if multi-AI mode and editor not shown */}
        {useMultiAI && comparison && !showEditor && (
          <>
            <ComparisonDashboard 
              comparison={comparison}
              isLoading={isLoading}
            />
            {comparison.actionPlan && (
              <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                <button
                  onClick={() => setShowEditor(true)}
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  ✏️ Edit Resume with Action Plan
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Show single AI suggestions if single mode or as fallback */}
        {suggestions && (!useMultiAI || !comparison) && !showEditor && (
          <AISuggestions 
            suggestions={suggestions} 
            isLoading={isLoading}
            progress={typeof progress === 'number' ? progress : Object.values(progress)[0] || 0}
          />
        )}
      </main>
    </div>
  );
}

export default App;
