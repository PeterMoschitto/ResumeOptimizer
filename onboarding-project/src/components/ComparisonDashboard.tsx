import React from 'react';
import { ComparisonAnalysis } from '../types';
import ActionPlanGenerator from './ActionPlanGenerator';
import './ComparisonDashboard.css';

interface ComparisonDashboardProps {
  comparison: ComparisonAnalysis;
  isLoading?: boolean;
}

const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ 
  comparison, 
  isLoading = false 
}) => {
  const { analyses, consensus, divergence, insights, actionPlan } = comparison;
  const successfulAnalyses = analyses.filter(a => !a.error && a.analysis);
  const failedAnalyses = analyses.filter(a => a.error);

  if (isLoading) {
    return (
      <div className="comparison-dashboard loading">
        <h2>Analyzing with Multiple AI Providers...</h2>
        <div className="loading-providers">
          {analyses.map((analysis) => (
            <div key={analysis.provider} className="provider-status">
              <span className="provider-name">{analysis.providerName}</span>
              <span className="status-indicator">⏳ Processing...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show warning if some providers failed
  const hasFailures = failedAnalyses.length > 0;
  const hasSuccesses = successfulAnalyses.length > 0;

  if (!hasSuccesses) {
    return (
      <div className="comparison-dashboard error-state">
        <h2>Analysis Failed</h2>
        <div className="error-message">
          <p>All AI providers failed to analyze the resume. Please check:</p>
          <ul>
            {failedAnalyses.map((analysis) => (
              <li key={analysis.provider}>
                <strong>{analysis.providerName}:</strong> {analysis.error}
              </li>
            ))}
          </ul>
          <p>See <code>PROVIDER_SETUP_FIXES.md</code> for setup instructions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comparison-dashboard">
      <h2>Multi-AI Comparison Analysis</h2>
      
      {hasFailures && (
        <div className="provider-warnings">
          <h3>⚠️ Some Providers Unavailable</h3>
          <p>Analysis completed with {successfulAnalyses.length} of {analyses.length} providers:</p>
          <ul>
            {failedAnalyses.map((analysis) => (
              <li key={analysis.provider}>
                <strong>{analysis.providerName}:</strong> {analysis.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Summary Cards */}
      <section className="summary-section">
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Average Score</h3>
            <div className="score-value">{consensus.averageScore.toFixed(1)}</div>
            <div className="score-range">
              Range: {consensus.scoreRange.min} - {consensus.scoreRange.max}
            </div>
          </div>
          <div className="summary-card">
            <h3>Consensus</h3>
            <div className="consensus-value">{consensus.agreedImprovements.length}</div>
            <div className="consensus-label">Agreed Improvements</div>
          </div>
          <div className="summary-card">
            <h3>Variance</h3>
            <div className="variance-value">{consensus.scoreStdDev.toFixed(1)}</div>
            <div className="variance-label">Standard Deviation</div>
          </div>
        </div>
      </section>

      {/* Provider Scores Comparison */}
      <section className="scores-comparison">
        <h3>Provider Scores</h3>
        <div className="scores-chart">
          {successfulAnalyses.map((analysis) => {
            const score = analysis.analysis.overallScore;
            const percentage = ((score - 60) / 40) * 100; // Normalize to 0-100 for display
            
            return (
              <div key={analysis.provider} className="score-bar-container">
                <div className="score-bar-header">
                  <span className="provider-name">{analysis.providerName}</span>
                  <span className="score-number">{score.toFixed(1)}</span>
                </div>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                {analysis.responseTime && (
                  <div className="response-time">
                    {analysis.responseTime}ms
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Insights */}
      <section className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Most Consistent</h4>
            <p>{analyses.find(a => a.provider === insights.mostConsistentProvider)?.providerName}</p>
            <span className="insight-badge">Closest to average</span>
          </div>
          <div className="insight-card">
            <h4>Most Optimistic</h4>
            <p>{analyses.find(a => a.provider === insights.mostOptimisticProvider)?.providerName}</p>
            <span className="insight-badge">Highest score</span>
          </div>
          <div className="insight-card">
            <h4>Most Critical</h4>
            <p>{analyses.find(a => a.provider === insights.mostCriticalProvider)?.providerName}</p>
            <span className="insight-badge">Lowest score</span>
          </div>
        </div>
      </section>

      {/* Note: Action Plan is now integrated into Resume Editor */}
      {/* Action Plan Generator with Checklist - Hidden, functionality moved to editor */}

      {/* Prioritized Action Plan (Summary View) */}
      {actionPlan && actionPlan.allPrioritized.length > 0 && (
        <section className="action-plan-section">
          <h3>🎯 Prioritized Action Plan</h3>
          <p className="section-description">Improvements sorted by impact and effort. Start with Quick Wins for maximum efficiency.</p>
          
          {actionPlan.quickWins.length > 0 && (
            <div className="action-category quick-wins">
              <h4>⚡ Quick Wins ({actionPlan.quickWins.length})</h4>
              <p className="category-description">High impact, low effort - do these first!</p>
              <div className="improvements-list">
                {actionPlan.quickWins.map((imp, i) => (
                  <div key={i} className="improvement-item priority-high">
                    <div className="improvement-header">
                      <span className="improvement-text">{imp.text}</span>
                      <div className="improvement-badges">
                        <span className="badge impact">Impact: {imp.impact}/10</span>
                        <span className={`badge effort effort-${imp.effort}`}>Effort: {imp.effort}</span>
                        {imp.estimatedScoreIncrease && (
                          <span className="badge score-increase">+{imp.estimatedScoreIncrease.toFixed(1)} pts</span>
                        )}
                      </div>
                    </div>
                    <div className="improvement-meta">
                      <span className="category-tag">{imp.category}</span>
                      <span className="efficiency">Efficiency: {imp.efficiency?.toFixed(2) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {actionPlan.strategic.length > 0 && (
            <div className="action-category strategic">
              <h4>🎯 Strategic Improvements ({actionPlan.strategic.length})</h4>
              <p className="category-description">High impact but require more effort - plan these carefully.</p>
              <div className="improvements-list">
                {actionPlan.strategic.map((imp, i) => (
                  <div key={i} className="improvement-item priority-strategic">
                    <div className="improvement-header">
                      <span className="improvement-text">{imp.text}</span>
                      <div className="improvement-badges">
                        <span className="badge impact">Impact: {imp.impact}/10</span>
                        <span className={`badge effort effort-${imp.effort}`}>Effort: {imp.effort}</span>
                        {imp.estimatedScoreIncrease && (
                          <span className="badge score-increase">+{imp.estimatedScoreIncrease.toFixed(1)} pts</span>
                        )}
                      </div>
                    </div>
                    <div className="improvement-meta">
                      <span className="category-tag">{imp.category}</span>
                      <span className="efficiency">Efficiency: {imp.efficiency?.toFixed(2) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {actionPlan.allPrioritized.length > actionPlan.quickWins.length + actionPlan.strategic.length && (
            <div className="action-category all-improvements">
              <h4>📋 All Prioritized Improvements</h4>
              <div className="improvements-list">
                {actionPlan.allPrioritized.map((imp, i) => (
                  <div key={i} className="improvement-item">
                    <div className="improvement-header">
                      <span className="improvement-text">{imp.text}</span>
                      <div className="improvement-badges">
                        <span className="badge impact">Impact: {imp.impact}/10</span>
                        <span className={`badge effort effort-${imp.effort}`}>Effort: {imp.effort}</span>
                        {imp.estimatedScoreIncrease && (
                          <span className="badge score-increase">+{imp.estimatedScoreIncrease.toFixed(1)} pts</span>
                        )}
                      </div>
                    </div>
                    <div className="improvement-meta">
                      <span className="category-tag">{imp.category}</span>
                      <span className="efficiency">Efficiency: {imp.efficiency?.toFixed(2) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Consensus Improvements */}
      <section className="consensus-section">
        <h3>Consensus Recommendations</h3>
        <div className="consensus-content">
          <div className="consensus-item">
            <h4>Agreed Improvements ({consensus.agreedImprovements.length})</h4>
            <ul>
              {consensus.agreedImprovements.map((improvement, i) => (
                <li key={i}>{improvement}</li>
              ))}
            </ul>
          </div>
          <div className="consensus-item">
            <h4>Agreed Missing Skills ({consensus.agreedMissingSkills.length})</h4>
            <ul>
              {consensus.agreedMissingSkills.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Divergence Analysis */}
      <section className="divergence-section">
        <h3>Provider Differences</h3>
        <div className="divergence-content">
          <div className="divergence-item">
            <h4>Score Differences</h4>
            <div className="differences-list">
              {divergence.scoreDifferences.map((diff, i) => (
                <div key={i} className="difference-item">
                  <span className="providers">
                    {analyses.find(a => a.provider === diff.provider1)?.providerName} vs{' '}
                    {analyses.find(a => a.provider === diff.provider2)?.providerName}
                  </span>
                  <span className="difference-value">{diff.difference.toFixed(1)} points</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="divergence-item">
            <h4>Unique Recommendations</h4>
            {divergence.uniqueImprovements.map((unique, i) => (
              <div key={i} className="unique-provider">
                <h5>{analyses.find(a => a.provider === unique.provider)?.providerName}</h5>
                <ul>
                  {unique.improvements.slice(0, 3).map((imp, j) => (
                    <li key={j}>{imp}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Provider Analyses */}
      <section className="individual-analyses">
        <h3>Individual Provider Analyses</h3>
        <div className="analyses-grid">
          {successfulAnalyses.map((analysis) => (
            <div key={analysis.provider} className="provider-analysis-card">
              <div className="card-header">
                <h4>{analysis.providerName}</h4>
                <div className="card-score">{analysis.analysis.overallScore.toFixed(1)}</div>
              </div>
              <div className="card-content">
                <div className="card-section">
                  <h5>Top Improvements</h5>
                  <ul>
                    {analysis.analysis.improvements.slice(0, 3).map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
                <div className="card-section">
                  <h5>Missing Skills</h5>
                  <ul>
                    {analysis.analysis.skills.missing.slice(0, 3).map((skill, i) => (
                      <li key={i}>{skill}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Error Display */}
      {analyses.some(a => a.error) && (
        <section className="errors-section">
          <h3>Provider Errors</h3>
          {analyses.filter(a => a.error).map((analysis) => (
            <div key={analysis.provider} className="error-item">
              <strong>{analysis.providerName}:</strong> {analysis.error}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default ComparisonDashboard;
