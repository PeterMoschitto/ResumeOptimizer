/**
 * Resume Parser Utility
 * Parses resume text into structured sections for editing
 */

export interface ResumeSection {
  id: string;
  type: 'header' | 'experience' | 'education' | 'skills' | 'summary' | 'other';
  title: string;
  content: string;
  htmlContent?: string; // HTML with formatting preserved
  originalContent: string;
  originalHtmlContent?: string; // Original HTML
  isEdited: boolean;
  style?: {
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    color?: string;
  };
}

export interface ParsedResume {
  sections: ResumeSection[];
  rawText: string;
}

/**
 * Common section headers/keywords to identify resume sections
 */
const SECTION_PATTERNS = {
  header: /^(name|contact|personal information|phone|email|address)/i,
  summary: /^(summary|objective|profile|about|professional summary)/i,
  experience: /^(experience|work experience|employment|professional experience|career history)/i,
  education: /^(education|academic|qualifications|degrees)/i,
  skills: /^(skills|technical skills|competencies|expertise|proficiencies)/i,
  projects: /^(projects|key projects|notable projects)/i,
  certifications: /^(certifications|certificates|licenses)/i,
  awards: /^(awards|honors|achievements|recognition)/i,
};

/**
 * Parse resume text into structured sections
 */
export const parseResume = (resumeText: string): ParsedResume => {
  if (!resumeText || resumeText.trim().length === 0) {
    return {
      sections: [],
      rawText: resumeText
    };
  }

  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  let sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let sectionIndex = 0;

  // Try to identify header (first few lines with name/contact info)
  const headerLines: string[] = [];
  let headerEndIndex = Math.min(5, lines.length);
  
  for (let i = 0; i < headerEndIndex; i++) {
    const line = lines[i];
    // Check if line looks like contact info (email, phone, address patterns)
    if (line.match(/@|phone|email|linkedin|github|www\.|http/i) || 
        (line.length < 50 && !line.match(/^[A-Z][a-z]+ [A-Z]/))) {
      headerLines.push(line);
    } else {
      break;
    }
  }

  // If we found header lines, create header section
  if (headerLines.length > 0) {
    sections.push({
      id: 'header-0',
      type: 'header',
      title: 'Contact Information',
      content: headerLines.join('\n'),
      originalContent: headerLines.join('\n'),
      isEdited: false
    });
    sectionIndex++;
  }

  // Process remaining lines
  let i = headerLines.length;
  
  // If no header was found, start from beginning
  if (headerLines.length === 0) {
    i = 0;
  }
  
  while (i < lines.length) {
    const line = lines[i];
    let sectionType: ResumeSection['type'] = 'other';
    let sectionTitle = 'Other';
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let _isSectionHeader = false;

    // Check if this line is a section header (more lenient matching)
    for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(line)) {
        _isSectionHeader = true;
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
          sectionIndex++;
        }

        // Determine section type
        if (key === 'experience') {
          sectionType = 'experience';
          sectionTitle = 'Experience';
        } else if (key === 'education') {
          sectionType = 'education';
          sectionTitle = 'Education';
        } else if (key === 'skills') {
          sectionType = 'skills';
          sectionTitle = 'Skills';
        } else if (key === 'summary') {
          sectionType = 'summary';
          sectionTitle = 'Summary';
        } else {
          sectionType = 'other';
          sectionTitle = line;
        }

        // Start new section
        currentSection = {
          id: `${sectionType}-${sectionIndex}`,
          type: sectionType,
          title: sectionTitle,
          content: '',
          originalContent: '',
          isEdited: false
        };
        i++;
        continue;
      }
    }

    // If we have a current section, add line to it
    if (currentSection) {
      if (currentSection.content) {
        currentSection.content += '\n' + line;
      } else {
        currentSection.content = line;
      }
    } else {
      // No section identified yet, create a default section with first line
      // Check if line looks like a header (short, all caps, or ends with colon)
      const looksLikeHeader = (line.length < 50 && 
                               (line === line.toUpperCase() || 
                                line.endsWith(':') ||
                                /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:?$/.test(line)));
      
      if (looksLikeHeader) {
        currentSection = {
          id: `other-${sectionIndex}`,
          type: 'other',
          title: line.replace(':', '').trim(),
          content: '',
          originalContent: '',
          isEdited: false
        };
      } else {
        // Start a content section
        currentSection = {
          id: `content-${sectionIndex}`,
          type: 'other',
          title: 'Resume Content',
          content: line,
          originalContent: line,
          isEdited: false
        };
      }
    }

    i++;
  }

  // Add final section
  if (currentSection) {
    sections.push(currentSection);
  }

  // Store original content
  sections.forEach(section => {
    section.originalContent = section.content;
  });

  // If no sections were found, create a single section with all content
  if (sections.length === 0) {
    sections.push({
      id: 'content-0',
      type: 'other',
      title: 'Resume Content',
      content: resumeText,
      originalContent: resumeText,
      isEdited: false
    });
  }
  
  // Ensure we have content - if sections are empty, split by double newlines
  if (sections.length > 0 && sections.every(s => !s.content || s.content.trim().length === 0)) {
    // Fallback: split by paragraphs (double newlines)
    const paragraphs = resumeText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    sections = paragraphs.map((para, idx) => ({
      id: `para-${idx}`,
      type: 'other' as const,
      title: idx === 0 ? 'Resume Content' : `Section ${idx + 1}`,
      content: para.trim(),
      originalContent: para.trim(),
      isEdited: false
    }));
  }

  return {
    sections,
    rawText: resumeText
  };
};

/**
 * Reconstruct resume text from parsed sections
 */
export const reconstructResume = (parsedResume: ParsedResume): string => {
  return parsedResume.sections
    .map(section => {
      if (section.type === 'header') {
        return section.content;
      }
      return `${section.title}\n${section.content}`;
    })
    .join('\n\n');
};

/**
 * Find sections related to an improvement suggestion
 */
export const findRelatedSections = (
  improvement: string,
  sections: ResumeSection[]
): ResumeSection[] => {
  const lowerImprovement = improvement.toLowerCase();
  const related: ResumeSection[] = [];

  // Keywords that map to section types
  const keywords = {
    experience: ['experience', 'work', 'job', 'employment', 'position', 'role', 'achievement', 'metric', 'quantify'],
    education: ['education', 'degree', 'university', 'college', 'gpa', 'academic'],
    skills: ['skill', 'technology', 'tool', 'proficiency', 'competency', 'expertise'],
    summary: ['summary', 'objective', 'profile', 'about', 'introduction'],
    header: ['contact', 'name', 'phone', 'email', 'address']
  };

  for (const section of sections) {
    const sectionType = section.type;
    if (sectionType === 'other') continue;

    const relevantKeywords = keywords[sectionType] || [];
    const hasKeyword = relevantKeywords.some(keyword => 
      lowerImprovement.includes(keyword) || 
      section.title.toLowerCase().includes(keyword)
    );

    if (hasKeyword) {
      related.push(section);
    }
  }

  // If no specific match, check content
  if (related.length === 0) {
    for (const section of sections) {
      const sectionContent = section.content.toLowerCase();
      // Simple keyword matching
      const words = lowerImprovement.split(/\s+/).filter(w => w.length > 4);
      const matches = words.filter(word => sectionContent.includes(word));
      if (matches.length > 0) {
        related.push(section);
      }
    }
  }

  return related.length > 0 ? related : sections.slice(0, 1); // Return at least one section
};
