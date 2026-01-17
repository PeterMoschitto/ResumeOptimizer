/**
 * Prioritization service for backend
 * Creates prioritized action plans from multiple AI analyses
 */

/**
 * Calculate efficiency score (impact / effort)
 */
const calculateEfficiency = (improvement) => {
  const effortMultiplier = {
    low: 1,
    medium: 2,
    high: 3
  };
  
  return improvement.impact / effortMultiplier[improvement.effort];
};

/**
 * Prioritize improvements from a single provider
 */
const prioritizeProviderImprovements = (analysis) => {
  // If provider already has prioritized improvements, use those
  if (analysis.analysis.prioritizedImprovements && analysis.analysis.prioritizedImprovements.length > 0) {
    return analysis.analysis.prioritizedImprovements.map(imp => ({
      ...imp,
      efficiency: calculateEfficiency(imp)
    }));
  }
  
  // Fallback: create prioritized improvements from regular improvements array
  return analysis.analysis.improvements.map((text, index) => {
    let category = 'content';
    let impact = 7;
    let effort = 'medium';
    
    const lowerText = text.toLowerCase();
    
    // Category detection
    if (lowerText.includes('format') || lowerText.includes('layout') || lowerText.includes('design')) {
      category = 'formatting';
    } else if (lowerText.includes('skill') || lowerText.includes('technology') || lowerText.includes('tool')) {
      category = 'skills';
    } else if (lowerText.includes('keyword') || lowerText.includes('buzzword')) {
      category = 'keywords';
    } else if (lowerText.includes('structure') || lowerText.includes('organization') || lowerText.includes('section')) {
      category = 'structure';
    }
    
    // Impact estimation
    if (lowerText.includes('quantif') || lowerText.includes('metric') || lowerText.includes('number')) {
      impact = 9;
      effort = 'low';
    } else if (lowerText.includes('keyword') || lowerText.includes('ats')) {
      impact = 8;
      effort = 'low';
    } else if (lowerText.includes('rewrite') || lowerText.includes('restructure')) {
      impact = 8;
      effort = 'high';
    } else if (lowerText.includes('add') || lowerText.includes('include')) {
      impact = 7;
      effort = 'medium';
    }
    
    return {
      text,
      impact,
      effort,
      category,
      estimatedScoreIncrease: impact * 0.5,
      efficiency: calculateEfficiency({ impact, effort })
    };
  });
};

/**
 * Create prioritized action plan from multiple analyses
 */
const createPrioritizedActionPlan = (analyses) => {
  const successfulAnalyses = analyses.filter(a => !a.error && a.analysis);
  
  if (successfulAnalyses.length === 0) {
    return {
      quickWins: [],
      strategic: [],
      lowPriority: [],
      allPrioritized: []
    };
  }
  
  // Collect all prioritized improvements
  const allImprovements = [];
  
  successfulAnalyses.forEach(analysis => {
    const prioritized = prioritizeProviderImprovements(analysis);
    allImprovements.push(...prioritized);
  });
  
  // Deduplicate similar improvements
  const uniqueImprovements = [];
  const seenTexts = new Set();
  
  allImprovements.forEach(imp => {
    const normalizedText = imp.text.toLowerCase().trim();
    let isDuplicate = false;
    
    for (const seen of seenTexts) {
      const words1 = normalizedText.split(/\s+/);
      const words2 = seen.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w));
      const similarity = commonWords.length / Math.max(words1.length, words2.length);
      
      if (similarity > 0.7) {
        isDuplicate = true;
        const existingIndex = uniqueImprovements.findIndex(u => {
          const uNorm = u.text.toLowerCase().trim();
          const uWords = uNorm.split(/\s+/);
          const common = words1.filter(w => uWords.includes(w));
          return common.length / Math.max(words1.length, uWords.length) > 0.7;
        });
        
        if (existingIndex >= 0 && imp.impact > uniqueImprovements[existingIndex].impact) {
          uniqueImprovements[existingIndex] = imp;
        }
        break;
      }
    }
    
    if (!isDuplicate) {
      uniqueImprovements.push(imp);
      seenTexts.add(normalizedText);
    }
  });
  
  // Aggregate improvements mentioned multiple times
  const improvementMap = new Map();
  uniqueImprovements.forEach(imp => {
    const key = imp.text.toLowerCase().trim();
    if (!improvementMap.has(key)) {
      improvementMap.set(key, []);
    }
    improvementMap.get(key).push(imp);
  });
  
  const aggregated = [];
  improvementMap.forEach((improvements, key) => {
    if (improvements.length === 1) {
      aggregated.push(improvements[0]);
    } else {
      // Multiple providers mentioned this - boost impact
      const avgImpact = improvements.reduce((sum, imp) => sum + imp.impact, 0) / improvements.length;
      const boostedImpact = Math.min(10, avgImpact + 1);
      const mostCommonEffort = improvements.reduce((acc, imp) => {
        acc[imp.effort] = (acc[imp.effort] || 0) + 1;
        return acc;
      }, {});
      const effort = Object.entries(mostCommonEffort).sort((a, b) => b[1] - a[1])[0][0];
      
      aggregated.push({
        ...improvements[0],
        impact: boostedImpact,
        effort,
        estimatedScoreIncrease: boostedImpact * 0.5,
        efficiency: calculateEfficiency({ impact: boostedImpact, effort })
      });
    }
  });
  
  // Sort by efficiency
  const sorted = aggregated.sort((a, b) => {
    const effA = calculateEfficiency(a);
    const effB = calculateEfficiency(b);
    return effB - effA;
  });
  
  // Categorize
  const quickWins = sorted.filter(imp => imp.impact >= 7 && imp.effort === 'low');
  const strategic = sorted.filter(imp => imp.impact >= 8 && imp.effort === 'high');
  const lowPriority = sorted.filter(imp => imp.impact < 6);
  
  return {
    quickWins,
    strategic,
    lowPriority,
    allPrioritized: sorted
  };
};

module.exports = { createPrioritizedActionPlan };
