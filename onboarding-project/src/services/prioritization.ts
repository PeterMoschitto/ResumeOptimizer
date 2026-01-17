import { PrioritizedImprovement, PrioritizedActionPlan, ProviderAnalysis } from '../types';

/**
 * Calculate efficiency score (impact / effort)
 */
const calculateEfficiency = (improvement: PrioritizedImprovement): number => {
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
export const prioritizeProviderImprovements = (
  analysis: ProviderAnalysis
): PrioritizedImprovement[] => {
  // If provider already has prioritized improvements, use those
  if (analysis.analysis.prioritizedImprovements && analysis.analysis.prioritizedImprovements.length > 0) {
    return analysis.analysis.prioritizedImprovements.map(imp => ({
      ...imp,
      efficiency: calculateEfficiency(imp)
    }));
  }
  
  // Fallback: create prioritized improvements from regular improvements array
  // Assign default impact/effort based on category heuristics
  return analysis.analysis.improvements.map((text, index) => {
    // Heuristic: categorize based on keywords in text
    let category: PrioritizedImprovement['category'] = 'content';
    let impact = 7; // Default medium-high impact
    let effort: 'low' | 'medium' | 'high' = 'medium';
    
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
    
    // Impact estimation based on keywords
    if (lowerText.includes('quantif') || lowerText.includes('metric') || lowerText.includes('number')) {
      impact = 9; // High impact
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
      estimatedScoreIncrease: impact * 0.5, // Rough estimate
      efficiency: impact / (effort === 'low' ? 1 : effort === 'medium' ? 2 : 3)
    };
  });
};

/**
 * Aggregate and prioritize improvements from multiple providers
 */
export const createPrioritizedActionPlan = (
  analyses: ProviderAnalysis[]
): PrioritizedActionPlan => {
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
  const allImprovements: PrioritizedImprovement[] = [];
  
  successfulAnalyses.forEach(analysis => {
    const prioritized = prioritizeProviderImprovements(analysis);
    allImprovements.push(...prioritized);
  });
  
  // Deduplicate similar improvements (simple text similarity)
  const uniqueImprovements: PrioritizedImprovement[] = [];
  const seenTexts = new Set<string>();
  
  allImprovements.forEach(imp => {
    const normalizedText = imp.text.toLowerCase().trim();
    // Check if we've seen something similar (simple check)
    let isDuplicate = false;
    // Convert Set to Array for iteration
    const seenTextsArray = Array.from(seenTexts);
    for (let i = 0; i < seenTextsArray.length; i++) {
      const seen = seenTextsArray[i];
      // Simple similarity: if texts share >70% of words, consider duplicate
      const words1 = normalizedText.split(/\s+/);
      const words2 = seen.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w));
      const similarity = commonWords.length / Math.max(words1.length, words2.length);
      
      if (similarity > 0.7) {
        isDuplicate = true;
        // If this one has higher impact, replace the existing one
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
  
  // Calculate average impact for improvements mentioned by multiple providers
  const improvementMap = new Map<string, PrioritizedImprovement[]>();
  uniqueImprovements.forEach(imp => {
    const key = imp.text.toLowerCase().trim();
    if (!improvementMap.has(key)) {
      improvementMap.set(key, []);
    }
    improvementMap.get(key)!.push(imp);
  });
  
  // Aggregate improvements mentioned multiple times
  const aggregated: PrioritizedImprovement[] = [];
  improvementMap.forEach((improvements, key) => {
    if (improvements.length === 1) {
      aggregated.push(improvements[0]);
    } else {
      // Multiple providers mentioned this - boost impact
      const avgImpact = improvements.reduce((sum, imp) => sum + imp.impact, 0) / improvements.length;
      const boostedImpact = Math.min(10, avgImpact + 1); // Boost by 1 point for consensus
      const mostCommonEffort = improvements.reduce((acc, imp) => {
        acc[imp.effort] = (acc[imp.effort] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const effort = Object.entries(mostCommonEffort).sort((a, b) => b[1] - a[1])[0][0] as 'low' | 'medium' | 'high';
      
      aggregated.push({
        ...improvements[0],
        impact: boostedImpact,
        effort,
        estimatedScoreIncrease: boostedImpact * 0.5,
        efficiency: boostedImpact / (effort === 'low' ? 1 : effort === 'medium' ? 2 : 3)
      });
    }
  });
  
  // Sort by efficiency (impact / effort)
  const sorted = aggregated.sort((a, b) => {
    const effA = calculateEfficiency(a);
    const effB = calculateEfficiency(b);
    return effB - effA; // Descending
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
