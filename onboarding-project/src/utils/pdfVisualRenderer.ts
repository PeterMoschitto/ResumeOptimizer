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
    
    // Extract all text items with positions
    const textItems: TextItem[] = [];
    for (const item of textContent.items as any[]) {
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const fontSize = Math.abs(transform[0]) || item.height || 12;
      const fontName = (item.fontName || 'Helvetica').toString();
      const fontNameLower = fontName.toLowerCase();
      const isBold = fontNameLower.includes('bold') ||
                     fontNameLower.includes('black') ||
                     fontNameLower.includes('heavy') ||
                     fontNameLower.includes('semibold') ||
                     fontNameLower.includes('demibold') ||
                     fontNameLower.includes('medium');
      const isItalic = fontNameLower.includes('italic') ||
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
    const lineTolerance = 3;
    
    for (const item of textItems) {
      if (Math.abs(item.y - currentY) <= lineTolerance) {
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
    
    // Build HTML with absolute positioning to preserve exact layout
    const pageHTML: string[] = [];
    
    // Find the topmost Y position to eliminate top padding (calculate before loop)
    const topmostY = lines.length > 0 && lines[0].length > 0 
      ? Math.min(...lines.filter(line => line.length > 0).map(line => line[0]?.y || Infinity))
      : 0;
    
    // Scale to readable size - minimal scaling
    const scale = 1.1; // Fixed scale of 1.1x (minimal increase from original)
    const scaledWidth = viewport.width * scale;
    const adjustedHeight = viewport.height - topmostY;
    const scaledHeight = adjustedHeight * scale;
    
    pageHTML.push(`<div class="pdf-page-wrapper" style="position: relative; width: ${scaledWidth}px; min-height: ${scaledHeight}px; margin: 0 auto; background: white; transform: scale(${scale}); transform-origin: top left;">`);
    pageHTML.push(`<div class="pdf-page-inner" style="position: relative; width: ${viewport.width}px; height: ${adjustedHeight}px; padding-top: 0; margin-top: 0; transform: scale(${scale}); transform-origin: top left;">`);
    
    for (const line of lines) {
      if (line.length === 0) continue;
      
      const firstItem = line[0];
      const lineY = firstItem.y;
      const lineX = firstItem.x;
      const avgFontSize = line.reduce((sum, item) => sum + item.fontSize, 0) / line.length;
      
      // Detect section header
      const isHeader = line.some(item => item.isBold) && 
                       (line.every(item => !item.str || item.str === item.str.toUpperCase()) || 
                        avgFontSize > 14);
      
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
      const adjustedY = (lineY - topmostY) * scale;
      const adjustedX = lineX * scale;
      const adjustedFontSize = avgFontSize * scale;
      const lineStyles: string[] = [
        `position: absolute`,
        `top: ${adjustedY}px`,
        `left: ${adjustedX}px`,
        `white-space: pre`,
        `line-height: ${adjustedFontSize * 1.2}px`,
        `font-size: ${adjustedFontSize}px`
      ];
      
      // Add underline for headers
      if (isHeader && avgFontSize > 12) {
        lineStyles.push('border-bottom: 1.5px solid #000');
        lineStyles.push('padding-bottom: 2px');
      }
      
      // Right align if on right side (for contact info)
      if (lineX > viewport.width * 0.6) {
        const lineWidth = line.reduce((sum, item) => sum + item.width, 0);
        const scaledRight = (viewport.width - (lineX + lineWidth)) * scale;
        lineStyles.push(`right: ${scaledRight}px`);
        lineStyles.push('left: auto');
        lineStyles.push('text-align: right');
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
