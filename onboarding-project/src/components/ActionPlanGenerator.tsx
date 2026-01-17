import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { PrioritizedActionPlan, PrioritizedImprovement } from '../types';
import './ActionPlanGenerator.css';

interface ActionPlanGeneratorProps {
  actionPlan: PrioritizedActionPlan;
  currentScore: number;
  onProgressUpdate?: (completedCount: number, totalCount: number) => void;
}

const ActionPlanGenerator: React.FC<ActionPlanGeneratorProps> = ({
  actionPlan,
  currentScore,
  onProgressUpdate
}) => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quickWins']));

  const toggleItem = (itemText: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(itemText)) {
      newCompleted.delete(itemText);
    } else {
      newCompleted.add(itemText);
    }
    setCompletedItems(newCompleted);
    
    // Calculate progress
    const totalCount = actionPlan.allPrioritized.length;
    onProgressUpdate?.(newCompleted.size, totalCount);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getEstimatedNewScore = (): number => {
    const completedImprovements = actionPlan.allPrioritized.filter(imp => 
      completedItems.has(imp.text)
    );
    const totalScoreIncrease = completedImprovements.reduce(
      (sum, imp) => sum + (imp.estimatedScoreIncrease || 0),
      0
    );
    return Math.min(100, currentScore + totalScoreIncrease);
  };

  const getEstimatedTime = (effort: string): string => {
    switch (effort) {
      case 'low': return '5-15 min';
      case 'medium': return '15-30 min';
      case 'high': return '30-60 min';
      default: return '15-30 min';
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const safeText = text || '';
      const lines = doc.splitTextToSize(safeText, maxWidth);
      const textLines = Array.isArray(lines) ? lines : [String(lines || '')];
      doc.text(textLines, x, y);
      return textLines.length * (fontSize * 0.4 + 2);
    };

    // Title
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80); // #2c3e50
    doc.setFont('helvetica', 'bold');
    doc.text('Resume Improvement Action Plan', margin, yPosition);
    yPosition += lineHeight * 2;

    // Date and Score Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // #64748b
    doc.setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated on: ${date}`, margin, yPosition);
    yPosition += lineHeight;
    
    doc.setFontSize(12);
    doc.setTextColor(99, 102, 241); // #6366f1
    doc.setFont('helvetica', 'bold');
    doc.text(`Current Score: ${currentScore.toFixed(1)}/100`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Projected Score: ${getEstimatedNewScore().toFixed(1)}/100`, margin, yPosition);
    yPosition += lineHeight;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Progress: ${completedItems.size}/${actionPlan.allPrioritized.length} completed (${progressPercentage.toFixed(0)}%)`, margin, yPosition);
    yPosition += sectionSpacing * 2;

    // Quick Wins Section
    if (actionPlan.quickWins.length > 0) {
      checkPageBreak(sectionSpacing * 3);
      
      doc.setFontSize(14);
      doc.setTextColor(34, 197, 94); // #22c55e
      doc.setFont('helvetica', 'bold');
      doc.text('⚡ Quick Wins (High Impact, Low Effort)', margin, yPosition);
      yPosition += lineHeight * 1.5;
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text('High impact, low effort improvements. Start here for maximum efficiency!', margin, yPosition);
      yPosition += lineHeight * 1.5;

      actionPlan.quickWins.forEach((imp, i) => {
        checkPageBreak(lineHeight * 4);
        
        const isCompleted = completedItems.has(imp.text);
        const checkbox = isCompleted ? '☑' : '☐';
        
        doc.setFontSize(10);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'normal');
        
        // Checkbox and item number
        doc.text(`${checkbox} ${i + 1}.`, margin, yPosition);
        const itemX = margin + 15;
        
        // Item text
        const itemText = imp.text || '';
        const textHeight = addWrappedText(itemText, itemX, yPosition, pageWidth - itemX - margin, 10);
        yPosition += textHeight + 3;
        
        // Metadata
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const category = imp.category || 'content';
        const metadata = `Impact: ${imp.impact}/10 | Effort: ${imp.effort} | Time: ${getEstimatedTime(imp.effort)} | Category: ${category}`;
        if (imp.estimatedScoreIncrease) {
          doc.text(`${metadata} | +${imp.estimatedScoreIncrease.toFixed(1)} pts`, itemX, yPosition);
        } else {
          doc.text(metadata, itemX, yPosition);
        }
        yPosition += lineHeight * 1.5;
      });
      
      yPosition += sectionSpacing;
    }

    // Strategic Improvements Section
    if (actionPlan.strategic.length > 0) {
      checkPageBreak(sectionSpacing * 3);
      
      doc.setFontSize(14);
      doc.setTextColor(245, 158, 11); // #f59e0b
      doc.setFont('helvetica', 'bold');
      doc.text('🎯 Strategic Improvements (High Impact, High Effort)', margin, yPosition);
      yPosition += lineHeight * 1.5;
      
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text('High impact but require more effort. Plan these carefully for best results.', margin, yPosition);
      yPosition += lineHeight * 1.5;

      actionPlan.strategic.forEach((imp, i) => {
        checkPageBreak(lineHeight * 4);
        
        const isCompleted = completedItems.has(imp.text);
        const checkbox = isCompleted ? '☑' : '☐';
        
        doc.setFontSize(10);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`${checkbox} ${i + 1}.`, margin, yPosition);
        const itemX = margin + 15;
        
        const itemText2 = imp.text || '';
        const textHeight2 = addWrappedText(itemText2, itemX, yPosition, pageWidth - itemX - margin, 10);
        yPosition += textHeight2 + 3;
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const category2 = imp.category || 'content';
        const metadata2 = `Impact: ${imp.impact}/10 | Effort: ${imp.effort} | Time: ${getEstimatedTime(imp.effort)} | Category: ${category2}`;
        if (imp.estimatedScoreIncrease) {
          doc.text(`${metadata2} | +${imp.estimatedScoreIncrease.toFixed(1)} pts`, itemX, yPosition);
        } else {
          doc.text(metadata2, itemX, yPosition);
        }
        yPosition += lineHeight * 1.5;
      });
      
      yPosition += sectionSpacing;
    }

    // All Other Improvements
    const otherImprovements = actionPlan.allPrioritized.filter(imp => 
      !actionPlan.quickWins.includes(imp) && !actionPlan.strategic.includes(imp)
    );
    
    if (otherImprovements.length > 0) {
      checkPageBreak(sectionSpacing * 3);
      
      doc.setFontSize(14);
      doc.setTextColor(52, 152, 219); // #3498db
      doc.setFont('helvetica', 'bold');
      doc.text('📋 All Prioritized Improvements', margin, yPosition);
      yPosition += lineHeight * 1.5;

      otherImprovements.forEach((imp, i) => {
        checkPageBreak(lineHeight * 4);
        
        const isCompleted = completedItems.has(imp.text);
        const checkbox = isCompleted ? '☑' : '☐';
        
        doc.setFontSize(10);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`${checkbox} ${i + 1}.`, margin, yPosition);
        const itemX = margin + 15;
        
        const itemText3 = imp.text || '';
        const textHeight3 = addWrappedText(itemText3, itemX, yPosition, pageWidth - itemX - margin, 10);
        yPosition += textHeight3 + 3;
        
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const category3 = imp.category || 'content';
        const metadata3 = `Impact: ${imp.impact}/10 | Effort: ${imp.effort} | Time: ${getEstimatedTime(imp.effort)} | Category: ${category3}`;
        if (imp.estimatedScoreIncrease) {
          doc.text(`${metadata3} | +${imp.estimatedScoreIncrease.toFixed(1)} pts`, itemX, yPosition);
        } else {
          doc.text(metadata3, itemX, yPosition);
        }
        yPosition += lineHeight * 1.5;
      });
    }

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${i} of ${totalPages} | Resume Improvement Action Plan`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = `resume-action-plan-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const exportToText = () => {
    const lines: string[] = [];
    lines.push('RESUME IMPROVEMENT ACTION PLAN');
    lines.push('='.repeat(50));
    lines.push(`Current Score: ${currentScore.toFixed(1)}/100`);
    lines.push(`Estimated New Score: ${getEstimatedNewScore().toFixed(1)}/100`);
    lines.push(`Progress: ${completedItems.size}/${actionPlan.allPrioritized.length} completed`);
    lines.push('');
    
    if (actionPlan.quickWins.length > 0) {
      lines.push('⚡ QUICK WINS (High Impact, Low Effort)');
      lines.push('-'.repeat(50));
      actionPlan.quickWins.forEach((imp, i) => {
        const checked = completedItems.has(imp.text) ? '[✓]' : '[ ]';
        lines.push(`${checked} ${i + 1}. ${imp.text}`);
        lines.push(`   Impact: ${imp.impact}/10 | Effort: ${imp.effort} | Est. Time: ${getEstimatedTime(imp.effort)}`);
        if (imp.estimatedScoreIncrease) {
          lines.push(`   Potential Score Increase: +${imp.estimatedScoreIncrease.toFixed(1)} points`);
        }
        lines.push('');
      });
    }
    
    if (actionPlan.strategic.length > 0) {
      lines.push('🎯 STRATEGIC IMPROVEMENTS (High Impact, High Effort)');
      lines.push('-'.repeat(50));
      actionPlan.strategic.forEach((imp, i) => {
        const checked = completedItems.has(imp.text) ? '[✓]' : '[ ]';
        lines.push(`${checked} ${i + 1}. ${imp.text}`);
        lines.push(`   Impact: ${imp.impact}/10 | Effort: ${imp.effort} | Est. Time: ${getEstimatedTime(imp.effort)}`);
        if (imp.estimatedScoreIncrease) {
          lines.push(`   Potential Score Increase: +${imp.estimatedScoreIncrease.toFixed(1)} points`);
        }
        lines.push('');
      });
    }
    
    if (actionPlan.allPrioritized.length > actionPlan.quickWins.length + actionPlan.strategic.length) {
      lines.push('📋 ALL IMPROVEMENTS');
      lines.push('-'.repeat(50));
      actionPlan.allPrioritized.forEach((imp, i) => {
        if (!actionPlan.quickWins.includes(imp) && !actionPlan.strategic.includes(imp)) {
          const checked = completedItems.has(imp.text) ? '[✓]' : '[ ]';
          lines.push(`${checked} ${i + 1}. ${imp.text}`);
          lines.push(`   Impact: ${imp.impact}/10 | Effort: ${imp.effort} | Est. Time: ${getEstimatedTime(imp.effort)}`);
          if (imp.estimatedScoreIncrease) {
            lines.push(`   Potential Score Increase: +${imp.estimatedScoreIncrease.toFixed(1)} points`);
          }
          lines.push('');
        }
      });
    }
    
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-action-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderImprovementItem = (imp: PrioritizedImprovement, index: number, section: string) => {
    const isCompleted = completedItems.has(imp.text);
    const priorityClass = section === 'quickWins' ? 'priority-high' : 
                          section === 'strategic' ? 'priority-strategic' : '';
    
    return (
      <div key={`${section}-${index}`} className={`action-item ${priorityClass} ${isCompleted ? 'completed' : ''}`}>
        <div className="action-item-header">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => toggleItem(imp.text)}
              className="action-checkbox"
            />
            <span className="checkmark"></span>
            <span className="item-number">{index + 1}</span>
            <span className="item-text">{imp.text}</span>
          </label>
          <div className="item-badges">
            <span className="badge impact">Impact: {imp.impact}/10</span>
            <span className={`badge effort effort-${imp.effort}`}>
              Effort: {imp.effort}
            </span>
            <span className="badge time">{getEstimatedTime(imp.effort)}</span>
            {imp.estimatedScoreIncrease && (
              <span className="badge score-increase">
                +{imp.estimatedScoreIncrease.toFixed(1)} pts
              </span>
            )}
          </div>
        </div>
        <div className="item-meta">
          <span className="category-tag">{imp.category}</span>
          <span className="efficiency">Efficiency: {imp.efficiency?.toFixed(2) || 'N/A'}</span>
        </div>
      </div>
    );
  };

  const progressPercentage = actionPlan.allPrioritized.length > 0
    ? (completedItems.size / actionPlan.allPrioritized.length) * 100
    : 0;

  return (
    <div className="action-plan-generator">
      <div className="action-plan-header">
        <div className="header-content">
          <h2>📋 Action Plan Checklist</h2>
          <p className="header-description">
            Track your progress as you implement improvements. Check off items as you complete them.
          </p>
        </div>
        <div className="header-actions">
          <button onClick={exportToPDF} className="export-button export-pdf">
            📄 Export to PDF
          </button>
          <button onClick={exportToText} className="export-button export-text">
            📥 Export to Text
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="progress-summary">
        <div className="progress-stats">
          <div className="stat-item">
            <div className="stat-value">{completedItems.size}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{actionPlan.allPrioritized.length - completedItems.size}</div>
            <div className="stat-label">Remaining</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{actionPlan.allPrioritized.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item score-projection">
            <div className="stat-value">{getEstimatedNewScore().toFixed(1)}</div>
            <div className="stat-label">Projected Score</div>
            <div className="stat-subtext">Current: {currentScore.toFixed(1)}</div>
          </div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="progress-text">{progressPercentage.toFixed(0)}% Complete</span>
        </div>
      </div>

      {/* Quick Wins Section */}
      {actionPlan.quickWins.length > 0 && (
        <div className="action-section quick-wins-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('quickWins')}
          >
            <div className="section-title">
              <span className="section-icon">⚡</span>
              <h3>Quick Wins</h3>
              <span className="section-count">({actionPlan.quickWins.length})</span>
            </div>
            <span className="section-toggle">
              {expandedSections.has('quickWins') ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.has('quickWins') && (
            <div className="section-description">
              High impact, low effort improvements. Start here for maximum efficiency!
            </div>
          )}
          {expandedSections.has('quickWins') && (
            <div className="action-items">
              {actionPlan.quickWins.map((imp, i) => renderImprovementItem(imp, i, 'quickWins'))}
            </div>
          )}
        </div>
      )}

      {/* Strategic Improvements Section */}
      {actionPlan.strategic.length > 0 && (
        <div className="action-section strategic-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('strategic')}
          >
            <div className="section-title">
              <span className="section-icon">🎯</span>
              <h3>Strategic Improvements</h3>
              <span className="section-count">({actionPlan.strategic.length})</span>
            </div>
            <span className="section-toggle">
              {expandedSections.has('strategic') ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.has('strategic') && (
            <div className="section-description">
              High impact but require more effort. Plan these carefully for best results.
            </div>
          )}
          {expandedSections.has('strategic') && (
            <div className="action-items">
              {actionPlan.strategic.map((imp, i) => renderImprovementItem(imp, i, 'strategic'))}
            </div>
          )}
        </div>
      )}

      {/* All Improvements Section */}
      {actionPlan.allPrioritized.length > actionPlan.quickWins.length + actionPlan.strategic.length && (
        <div className="action-section all-improvements-section">
          <div 
            className="section-header"
            onClick={() => toggleSection('all')}
          >
            <div className="section-title">
              <span className="section-icon">📋</span>
              <h3>All Prioritized Improvements</h3>
              <span className="section-count">
                ({actionPlan.allPrioritized.length - actionPlan.quickWins.length - actionPlan.strategic.length})
              </span>
            </div>
            <span className="section-toggle">
              {expandedSections.has('all') ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.has('all') && (
            <div className="action-items">
              {actionPlan.allPrioritized
                .filter(imp => 
                  !actionPlan.quickWins.includes(imp) && 
                  !actionPlan.strategic.includes(imp)
                )
                .map((imp, i) => renderImprovementItem(imp, i, 'all'))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionPlanGenerator;
