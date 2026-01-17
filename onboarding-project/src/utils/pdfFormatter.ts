/**
 * PDF Formatter Utility
 * Extracts formatted content from PDFs and converts to HTML for editing
 */

import { getDocument } from 'pdfjs-dist';

export interface FormattedTextBlock {
  text: string;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface FormattedSection {
  type: 'header' | 'paragraph' | 'list' | 'section-header';
  content: string;
  html: string;
  style: {
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    color?: string;
    textAlign?: string;
  };
}

/**
 * Extract formatted text from PDF with styling information
 */
export const extractFormattedTextFromPDF = async (
  file: File,
  maxPages: number = 10
): Promise<{ html: string; text: string; sections: FormattedSection[] }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  
  const allBlocks: FormattedTextBlock[] = [];
  const numPages = Math.min(pdf.numPages, maxPages);

  // Extract text with formatting from each page
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    // Process text items with styling
    for (const item of textContent.items as any[]) {
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const fontSize = Math.abs(transform[0]) || item.height || 12;
      const fontName = item.fontName || 'Helvetica';
      const isBold = fontName.toLowerCase().includes('bold') || fontName.toLowerCase().includes('black');
      const isItalic = fontName.toLowerCase().includes('italic') || fontName.toLowerCase().includes('oblique');
      
      allBlocks.push({
        text: item.str || '',
        fontSize,
        fontName,
        isBold,
        isItalic,
        x: transform[4] || 0,
        y: viewport.height - (transform[5] || 0),
        width: item.width || 0,
        height: item.height || fontSize
      });
    }
  }

  // Group blocks into lines and paragraphs
  const lines = groupBlocksIntoLines(allBlocks);
  const paragraphs = groupLinesIntoParagraphs(lines);
  
  // Extract text preserving exact order and line breaks
  // Process blocks in order (top to bottom, left to right)
  const sortedBlocks = [...allBlocks].sort((a, b) => {
    const yDiff = b.y - a.y; // Higher Y first (top to bottom)
    if (Math.abs(yDiff) > 2) return yDiff;
    return a.x - b.x; // Same line, left to right
  });
  
  // Build text preserving line structure
  let text = '';
  let currentY = sortedBlocks[0]?.y || 0;
  const lineTolerance = 3;
  
  for (let i = 0; i < sortedBlocks.length; i++) {
    const block = sortedBlocks[i];
    const nextBlock = sortedBlocks[i + 1];
    
    // Check if this is a new line
    if (i > 0 && Math.abs(block.y - currentY) > lineTolerance) {
      text += '\n';
      currentY = block.y;
    }
    
    // Add block text with spacing
    if (i > 0 && Math.abs(block.y - currentY) <= lineTolerance) {
      const prevBlock = sortedBlocks[i - 1];
      const spaceNeeded = block.x - (prevBlock.x + prevBlock.width);
      if (spaceNeeded > 3) {
        text += ' ';
      }
    }
    
    text += block.text;
  }
  
  // Convert to HTML with formatting
  const html = convertToHTML(paragraphs);
  
  // Parse into sections
  const sections = parseIntoFormattedSections(paragraphs);

  return { html, text, sections };
};

/**
 * Group text blocks into lines based on Y position
 * Preserves exact order from PDF (top to bottom, left to right)
 */
const groupBlocksIntoLines = (blocks: FormattedTextBlock[]): FormattedTextBlock[][] => {
  if (blocks.length === 0) return [];
  
  // Sort by Y position (top to bottom) - higher Y values first (PDF coordinates)
  // Then by X position (left to right) for same Y
  const sorted = [...blocks].sort((a, b) => {
    const yDiff = b.y - a.y; // Higher Y first (top to bottom)
    if (Math.abs(yDiff) > 2) return yDiff; // Different lines
    return a.x - b.x; // Same line, sort by X (left to right)
  });
  
  const lines: FormattedTextBlock[][] = [];
  let currentLine: FormattedTextBlock[] = [];
  let currentY = sorted[0]?.y || 0;
  const lineTolerance = 3; // Pixels - tighter tolerance for better line detection

  for (const block of sorted) {
    if (Math.abs(block.y - currentY) < lineTolerance) {
      // Same line - add to current line
      currentLine.push(block);
    } else {
      // New line - save previous line
      if (currentLine.length > 0) {
        // Sort line by X position (left to right)
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine);
      }
      currentLine = [block];
      currentY = block.y;
    }
  }
  
  // Add final line
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine);
  }

  // Reverse to get top-to-bottom order (lines are currently bottom-to-top)
  return lines.reverse();
};

/**
 * Group lines into paragraphs
 * Preserves spacing and structure
 */
const groupLinesIntoParagraphs = (lines: FormattedTextBlock[][]): FormattedTextBlock[][] => {
  if (lines.length === 0) return [];
  
  const paragraphs: FormattedTextBlock[][] = [];
  let currentParagraph: FormattedTextBlock[] = [];
  const paragraphSpacing = 8; // Pixels - smaller threshold to preserve more structure

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length === 0) continue;
    
    const nextLine = lines[i + 1];
    const currentLineY = line[0]?.y || 0;
    const nextLineY = nextLine?.[0]?.y || 0;
    const lineSpacing = Math.abs(nextLineY - currentLineY);
    
    // Add line to current paragraph
    currentParagraph.push(...line);

    // Check if next line starts a new paragraph (large spacing or empty line)
    if (!nextLine || nextLine.length === 0 || lineSpacing > paragraphSpacing) {
      if (currentParagraph.length > 0) {
        paragraphs.push([...currentParagraph]);
        currentParagraph = [];
      }
    }
  }

  // Add final paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
};

/**
 * Convert formatted paragraphs to HTML
 * Preserves exact formatting, spacing, and structure
 */
const convertToHTML = (paragraphs: FormattedTextBlock[][]): string => {
  const htmlParts: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      htmlParts.push('<br>'); // Preserve empty lines
      continue;
    }

    // Check if this looks like a bullet point or list item
    const firstBlock = paragraph[0];
    const firstText = firstBlock.text.trim();
    const isBullet = /^[•\-\*\+]\s/.test(firstText) || /^\d+[\.\)]\s/.test(firstText);
    const isListItem = firstText.length > 0 && (isBullet || paragraph.some(b => b.x > 50)); // Indented
    
    // Determine paragraph type based on formatting
    const avgFontSize = paragraph.reduce((sum, b) => sum + b.fontSize, 0) / paragraph.length;
    const isBold = paragraph.some(b => b.isBold);
    const isLarge = avgFontSize > 14;
    const isHeader = isBold && isLarge;

    // Build HTML preserving exact text and formatting
    const paragraphText = paragraph.map((block, idx) => {
      const styles: string[] = [];
      if (block.isBold) styles.push('font-weight: bold');
      if (block.isItalic) styles.push('font-style: italic');
      if (block.fontSize && block.fontSize !== 12) {
        styles.push(`font-size: ${block.fontSize}px`);
      }
      
      // Preserve spacing - add space between blocks unless they're part of same word
      const text = escapeHtml(block.text);
      const prevBlock = paragraph[idx - 1];
      const needsSpace = prevBlock && (block.x - (prevBlock.x + prevBlock.width)) > 5;
      const spacer = needsSpace ? ' ' : '';
      
      const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
      return `${spacer}<span${styleAttr}>${text}</span>`;
    }).join('');

    // Wrap in appropriate HTML tag
    if (isHeader) {
      htmlParts.push(`<h2>${paragraphText}</h2>`);
    } else if (isListItem || isBullet) {
      htmlParts.push(`<p style="margin-left: 20px;">${paragraphText}</p>`);
    } else {
      htmlParts.push(`<p style="margin-bottom: 0.5em;">${paragraphText}</p>`);
    }
  }

  return htmlParts.join('\n');
};

/**
 * Parse paragraphs into formatted sections
 */
const parseIntoFormattedSections = (paragraphs: FormattedTextBlock[][]): FormattedSection[] => {
  const sections: FormattedSection[] = [];
  
  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) continue;

    const text = paragraph.map(b => b.text).join(' ');
    const avgFontSize = paragraph.reduce((sum, b) => sum + b.fontSize, 0) / paragraph.length;
    const isBold = paragraph.some(b => b.isBold);
    const isLarge = avgFontSize > 14;

    // Determine section type
    let type: FormattedSection['type'] = 'paragraph';
    if (isBold && isLarge) {
      type = 'section-header';
    }

    // Build HTML with formatting - preserve exact spacing
    const html = paragraph.map((block, idx) => {
      const styles: string[] = [];
      if (block.isBold) styles.push('font-weight: bold');
      if (block.isItalic) styles.push('font-style: italic');
      if (block.fontSize && block.fontSize !== 12) {
        styles.push(`font-size: ${block.fontSize}px`);
      }
      
      // Preserve spacing between blocks
      const prevBlock = paragraph[idx - 1];
      const needsSpace = prevBlock && (block.x - (prevBlock.x + prevBlock.width)) > 3;
      const spacer = needsSpace ? ' ' : '';
      
      const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
      return `${spacer}<span${styleAttr}>${escapeHtml(block.text)}</span>`;
    }).join('');

    sections.push({
      type,
      content: text,
      html,
      style: {
        fontSize: `${avgFontSize}px`,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: paragraph.some(b => b.isItalic) ? 'italic' : 'normal'
      }
    });
  }

  return sections;
};

/**
 * Escape HTML special characters
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Convert HTML back to formatted text (for export)
 */
export const htmlToFormattedText = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};
