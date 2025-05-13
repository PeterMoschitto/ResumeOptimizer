import React from 'react';
import './AISuggestions.css';

interface AISuggestionsProps {
  suggestions: {
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
  };
  isLoading?: boolean;
  progress?: number;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ suggestions, isLoading = false, progress = 0 }) => {
  const {
    overallScore,
    improvements,
    rewrites,
    skills,
    formatting,
    impact,
    competitorAnalysis
  } = suggestions;

  console.log('AISuggestions props:', suggestions);
  console.log('Industry Analysis:', suggestions?.competitorAnalysis?.industryAnalysis);

  if (isLoading) {
    return (
      <div className="ai-suggestions loading">
        <div className="loading-container">
          <h2>Analyzing Your Resume</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="loading-text">Processing your resume... {progress}%</p>
          <div className="loading-steps">
            <div className={`step ${progress >= 20 ? 'completed' : ''}`}>
              <span className="step-icon">📄</span>
              <span className="step-text">Reading Resume</span>
            </div>
            <div className={`step ${progress >= 40 ? 'completed' : ''}`}>
              <span className="step-icon">🔍</span>
              <span className="step-text">Analyzing Content</span>
            </div>
            <div className={`step ${progress >= 60 ? 'completed' : ''}`}>
              <span className="step-icon">📊</span>
              <span className="step-text">Evaluating Skills</span>
            </div>
            <div className={`step ${progress >= 80 ? 'completed' : ''}`}>
              <span className="step-icon">💡</span>
              <span className="step-text">Generating Insights</span>
            </div>
            <div className={`step ${progress >= 100 ? 'completed' : ''}`}>
              <span className="step-icon">✨</span>
              <span className="step-text">Finalizing Results</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-suggestions">
      <h2>Resume Analysis Results</h2>
      
      {/* Overall Score */}
      <section className="score-section">
        <h3>Overall Score: {Math.round(overallScore)}/100</h3>
        <div className="score-comparison">
          <div className="score-item">
            <h4>Your Score</h4>
            <div className="score-value">{Math.round(overallScore)}/100</div>
          </div>
          <div className="score-item">
            <h4>Average Score</h4>
            <div className="score-value">{Math.round(competitorAnalysis.industryBenchmarks.averageScore)}/100</div>
          </div>
          <div className="score-item">
            <h4>Top Performers</h4>
            <div className="score-value">{Math.round(competitorAnalysis.industryBenchmarks.topPerformersScore)}/100</div>
          </div>
        </div>
      </section>

      {/* Market Position */}
      <section className="market-position">
        <h3>Market Position</h3>
        <p>{competitorAnalysis.marketPosition}</p>
        <div className="competitive-analysis">
          <div className="advantages">
            <h4>Competitive Advantages</h4>
            <ul>
              {competitorAnalysis.competitiveAdvantages.map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>
          <div className="disadvantages">
            <h4>Areas for Improvement</h4>
            <ul>
              {competitorAnalysis.competitiveDisadvantages.map((dis, i) => (
                <li key={i}>{dis}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Skills Analysis */}
      <section className="skills-analysis">
        <h3>Skills Analysis</h3>
        <div className="skills-categories">
          <div className="matching">
            <h4>Matching Skills</h4>
            <ul>
              {skills.matching.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className="missing">
            <h4>Missing Skills</h4>
            <ul>
              {skills.missing.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>
          <div className="suggested">
            <h4>Suggested Skills</h4>
            <ul>
              {skills.suggested.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Career Progression */}
      <section className="career-progression">
        <h3>Career Development Plan</h3>
        <div className="current-level">
          <h4>Current Level</h4>
          <p>{competitorAnalysis.careerProgression.currentLevel}</p>
        </div>
        <div className="next-steps">
          <h4>Next Steps</h4>
          <div className="timeline">
            <div className="short-term">
              <h5>Short Term (0-6 months)</h5>
              <ul>
                {competitorAnalysis.careerProgression.nextSteps.shortTerm.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="medium-term">
              <h5>Medium Term (6-18 months)</h5>
              <ul>
                {competitorAnalysis.careerProgression.nextSteps.mediumTerm.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="long-term">
              <h5>Long Term (18+ months)</h5>
              <ul>
                {competitorAnalysis.careerProgression.nextSteps.longTerm.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Improvements */}
      <section className="improvements">
        <h3>Key Improvements</h3>
        <div className="improvements-grid">
          <div className="improvement-category">
            <h4>Content Enhancements</h4>
            <ul>
              {improvements.map((improvement, i) => (
                <li key={i}>{improvement}</li>
              ))}
            </ul>
          </div>
          <div className="improvement-category">
            <h4>Formatting & Structure</h4>
            <ul>
              {formatting.suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Resume Preview */}
      <section className="resume-preview">
        <h3>Resume Analysis & Improvements</h3>
        <div className="resume-container">
          <div className="resume-content">
            {rewrites.map((rewrite, i) => (
              <div key={i} className="resume-section">
                <h4>{rewrite.section === 'achievements' ? 'Achievements' : rewrite.section}</h4>
                <div className="comparison-view">
                  <div className="original-content">
                    <p>{rewrite.original}</p>
                  </div>
                  <div className="improved-content">
                    <p>{rewrite.improved}</p>
                    {rewrite.section === 'achievements' && (
                      <div className="additional-suggestions">
                        <h5>Additional Achievement Suggestions:</h5>
                        <ul>
                          {impact.recommendations.map((recommendation, i) => (
                            <li key={`impact-${i}`}>{recommendation}</li>
                          ))}
                          {competitorAnalysis.differentiationStrategies.map((strategy, i) => (
                            <li key={`strategy-${i}`}>{strategy}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="resume-sidebar">
            <div className="sidebar-section">
              <h4>Overall Score</h4>
              <div className="score-display">
                <span className="score">{Math.round(overallScore)}</span>
                <span className="score-label">/100</span>
              </div>
            </div>
            <div className="sidebar-section">
              <h4>Key Improvements</h4>
              <ul>
                {improvements.map((improvement, i) => (
                  <li key={i}>{improvement}</li>
                ))}
              </ul>
            </div>
            <div className="sidebar-section">
              <h4>Formatting Tips</h4>
              <ul>
                {formatting.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AISuggestions; 