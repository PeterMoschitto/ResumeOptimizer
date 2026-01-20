/**
 * PDF Visual Renderer - Renders PDF with exact visual matching
 * Uses canvas rendering and text extraction to create editable version
 */

import { getDocument } from 'pdfjs-dist';

export interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
}

/**
 * Render PDF with exact visual formatting
 */
export const renderPDFVisually = async (
  file: File,
  maxPages: number = 10
): Promise<{ html: string; text: string }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  
  const numPages = Math.min(pdf.numPages, maxPages);
  const htmlParts: string[] = [];
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
    const textContent = await page.getTextContent();
    const styleMap = (textContent as any).styles || {};
    
    // Extract all text items with positions
    const textItems: TextItem[] = [];
    for (const item of textContent.items as any[]) {
      const style = styleMap[item.fontName] || {};
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const fontSize = Math.abs(transform[0]) || item.height || 12;
      const fontName = (item.fontName || style.fontFamily || 'Helvetica').toString();
      const fontNameLower = fontName.toLowerCase();
      const fontWeight = style.fontWeight || '';
      const fontStyle = style.fontStyle || '';
      const isBold = (typeof fontWeight === 'number' && fontWeight >= 600) ||
                     (typeof fontWeight === 'string' && fontWeight.toLowerCase().includes('bold')) ||
                     fontNameLower.includes('bold') ||
                     fontNameLower.includes('black') ||
                     fontNameLower.includes('heavy') ||
                     fontNameLower.includes('semibold') ||
                     fontNameLower.includes('demibold') ||
                     fontNameLower.includes('medium');
      const isItalic = (typeof fontStyle === 'string' && fontStyle.toLowerCase().includes('italic')) ||
                       fontNameLower.includes('italic') ||
                       fontNameLower.includes('oblique');
      
      // PDF coordinates: (0,0) is bottom-left, convert to top-left
      const x = transform[4] || 0;
      const y = viewport.height - (transform[5] || 0);
      
      textItems.push({
        str: item.str || '',
        x: x,
        y: y,
        width: item.width || 0,
        fontSize: fontSize,
        fontName: fontName,
        isBold: isBold,
        isItalic: isItalic
      });
    }
    
    // Sort by Y (top to bottom), then X (left to right)
    textItems.sort((a, b) => {
      const yDiff = b.y - a.y; // Higher Y first
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.x - b.x;
    });
    
    // Group into lines
    const lines: TextItem[][] = [];
    let currentLine: TextItem[] = [];
    let currentY = textItems[0]?.y || 0;
    
    for (const item of textItems) {
      const dynamicTolerance = Math.max(2, (item.fontSize || 10) * 0.2);
      if (Math.abs(item.y - currentY) <= dynamicTolerance) {
        currentLine.push(item);
      } else {
        if (currentLine.length > 0) {
          currentLine.sort((a, b) => a.x - b.x);
          lines.push(currentLine);
        }
        currentLine = [item];
        currentY = item.y;
      }
    }
    if (currentLine.length > 0) {
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine);
    }
    
    // Reverse to get top-to-bottom order
    lines.reverse();
    
    // Build HTML with line-flow layout for editing
    const pageHTML: string[] = [];
    
    // Find the topmost Y position to eliminate top padding (calculate before loop)
    const topmostY = lines.length > 0 && lines[0].length > 0 
      ? Math.min(...lines.filter(line => line.length > 0).map(line => line[0]?.y || Infinity))
      : 0;
    
    // Normal-flow rendering for editing (no absolute positioning)
    const scale = 1.0;
    const scaledWidth = viewport.width * scale;
    const adjustedHeight = viewport.height - topmostY;
    const scaledHeight = adjustedHeight * scale;
    
    pageHTML.push(`<div class="pdf-page-wrapper" style="position: relative; width: ${scaledWidth}px; min-height: ${scaledHeight}px; margin: 0 auto; background: white;">`);
    pageHTML.push(`<div class="pdf-page-inner pdf-flow" style="position: relative; width: ${viewport.width}px; min-height: ${adjustedHeight}px; padding-top: 0; margin-top: 0;">`);

    // Normalize left padding so content is left-aligned instead of centered
    const minX = Math.min(...lines.filter(l => l.length > 0).map(l => l[0]?.x || 0));
    
    for (const line of lines) {
      if (line.length === 0) continue;
      
      const firstItem = line[0];
      const lineY = firstItem.y;
      const lineX = firstItem.x;
      const avgFontSize = line.reduce((sum, item) => sum + item.fontSize, 0) / line.length;
      const lineText = line.map(item => item.str).join('').trim();
      const isSectionTitle =
        /^(education|experience|work experience|skills|projects|personal|certifications|awards|leadership|summary)$/i.test(lineText) ||
        /^(education|experience|skills|projects|personal|certifications|awards|leadership|summary)\b/i.test(lineText);
      
      // Detect section header
      const isHeader = (line.some(item => item.isBold) && avgFontSize >= 12) ||
                       isSectionTitle ||
                       (line.every(item => !item.str || item.str === item.str.toUpperCase()) && avgFontSize >= 11);
      
      // Build line content
      let lineContent = '';
      let lastX = lineX;
      const avgCharWidth = Math.max(avgFontSize * 0.55, 3);
      
      for (let i = 0; i < line.length; i++) {
        const item = line[i];
        
        // Add spacing
        if (i > 0) {
          const gap = item.x - lastX;
          if (gap > avgCharWidth * 0.7) {
            const spaceCount = Math.max(1, Math.round(gap / avgCharWidth));
            lineContent += '&nbsp;'.repeat(Math.min(spaceCount, 80));
          }
        }
        
        // Add text with formatting - scale font sizes
        const styles: string[] = [];
        if (item.isBold) styles.push('font-weight: 700');
        if (item.isItalic) styles.push('font-style: italic');
        if (item.fontSize) {
          const scaledFontSize = item.fontSize * scale;
          styles.push(`font-size: ${scaledFontSize}px`);
        }
        
        // Font family
        if (item.fontName.includes('Times')) {
          styles.push("font-family: 'Times New Roman', serif");
        } else if (item.fontName.includes('Arial') || item.fontName.includes('Helvetica')) {
          styles.push("font-family: Arial, sans-serif");
        } else {
          styles.push("font-family: 'Times New Roman', serif");
        }
        
        const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
        const escapedText = escapeHtml(item.str);
        lineContent += `<span${styleAttr}>${escapedText}</span>`;
        
        lastX = item.x + item.width;
      }
      
      // Create line div with absolute positioning to match PDF exactly
      // Adjust Y position to remove top padding
      // Scale font sizes and positions for better visibility
      const adjustedX = Math.max((lineX - minX) * scale, 0);
      const adjustedFontSize = avgFontSize * scale;
      const lineStyles: string[] = [
        `display: block`,
        `padding-left: ${Math.max(adjustedX, 0)}px`,
        `white-space: pre`,
        `line-height: ${adjustedFontSize * 1.25}px`,
        `font-size: ${adjustedFontSize}px`
      ];
      
      // Emphasize headers (bold + underline) to match resume formatting
      if (isHeader) {
        lineStyles.push('font-weight: 700');
        lineStyles.push('text-decoration: underline');
        lineStyles.push('text-decoration-thickness: 1.5px');
        lineStyles.push('text-underline-offset: 3px');
      }
      
      // Right align if on right side (for contact info)
      if (lineX > viewport.width * 0.6) {
        lineStyles.push('text-align: right');
        lineStyles.push('width: 100%');
        lineStyles.push('padding-left: 0');
      }
      
      pageHTML.push(`<div class="pdf-line" style="${lineStyles.join('; ')}">${lineContent}</div>`);
      
      // Build text version
      fullText += line.map(item => item.str).join(' ') + '\n';
    }
    
    pageHTML.push('</div>'); // Close inner
    pageHTML.push('</div>'); // Close wrapper
    
    htmlParts.push(pageHTML.join('\n'));
  }

  return {
    html: htmlParts.join('\n'),
    text: fullText.trim()
  };
};

/**
 * Escape HTML
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
