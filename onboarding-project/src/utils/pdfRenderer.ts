/**
 * PDF Renderer - Renders PDF with exact visual formatting
 * Extracts text with exact positions and creates HTML that matches the PDF visually
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.min.mjs';

export interface TextBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  color?: string;
}

export interface PDFPageData {
  pageNumber: number;
  width: number;
  height: number;
  textBlocks: TextBlock[];
  html: string;
}

/**
 * Extract text blocks with exact positions from PDF
 */
const extractTextBlocks = async (
  page: any,
  viewport: any
): Promise<TextBlock[]> => {
  const textContent = await page.getTextContent();
  const blocks: TextBlock[] = [];

  for (const item of textContent.items as any[]) {
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const fontSize = Math.abs(transform[0]) || item.height || 12;
    const fontName = (item.fontName || 'Helvetica').toString();
    const isBold = fontName.toLowerCase().includes('bold') || 
                   fontName.toLowerCase().includes('black');
    const isItalic = fontName.toLowerCase().includes('italic') || 
                     fontName.toLowerCase().includes('oblique');
    
    // PDF coordinates: (0,0) is bottom-left, convert to top-left
    const x = transform[4] || 0;
    const y = viewport.height - (transform[5] || 0);
    
    blocks.push({
      text: item.str || '',
      x: x,
      y: y,
      width: item.width || 0,
      height: item.height || fontSize,
      fontSize: fontSize,
      fontName: fontName,
      isBold: isBold,
      isItalic: isItalic
    });
  }

  return blocks;
};

/**
 * Group text blocks into lines based on Y position
 */
const groupIntoLines = (blocks: TextBlock[]): TextBlock[][] => {
  // Sort by Y (top to bottom), then X (left to right)
  const sorted = [...blocks].sort((a, b) => {
    const yDiff = b.y - a.y; // Higher Y first
    if (Math.abs(yDiff) > 2) return yDiff;
    return a.x - b.x;
  });

  const lines: TextBlock[][] = [];
  let currentLine: TextBlock[] = [];
  let currentY = sorted[0]?.y || 0;
  const tolerance = 2;

  for (const block of sorted) {
    if (Math.abs(block.y - currentY) <= tolerance) {
      currentLine.push(block);
    } else {
      if (currentLine.length > 0) {
        currentLine.sort((a, b) => a.x - b.x);
        lines.push(currentLine);
      }
      currentLine = [block];
      currentY = block.y;
    }
  }

  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine);
  }

  return lines.reverse(); // Reverse to get top-to-bottom order
};

/**
 * Convert text blocks to HTML preserving exact visual layout
 * Uses absolute positioning to match PDF exactly
 */
const blocksToHTML = (
  lines: TextBlock[][],
  pageWidth: number,
  pageHeight: number
): string => {
  const htmlParts: string[] = [];
  
  // Calculate scale to fit in editor (typical PDF is ~612x792, scale to fit viewport)
  const scale = Math.min(1.0, 800 / pageWidth); // Scale to max 800px width
  const scaledWidth = pageWidth * scale;
  const scaledHeight = pageHeight * scale;
  
  // Create container matching PDF dimensions with scale
  htmlParts.push(`<div class="pdf-page" style="position: relative; width: ${scaledWidth}px; min-height: ${scaledHeight}px; margin: 0 auto; background: white; padding: 0; transform: scale(${scale}); transform-origin: top left;">`);
  htmlParts.push(`<div style="position: relative; width: ${pageWidth}px; height: ${pageHeight}px;">`);

  for (const line of lines) {
    if (line.length === 0) continue;

    const firstBlock = line[0];
    const lineY = firstBlock.y;
    const lineX = firstBlock.x;
    
    // Detect if this is a section header (all caps, bold, larger font)
    const isHeader = line.some(b => b.isBold) && 
                     line.every(b => !b.text || b.text === b.text.toUpperCase() || b.text.length < 50);
    const avgFontSize = line.reduce((sum, b) => sum + b.fontSize, 0) / line.length;
    const isLargeHeader = avgFontSize > 14 && isHeader;
    
    // Build line HTML with exact spacing
    let lineHTML = '';
    let lastX = lineX;

    for (let i = 0; i < line.length; i++) {
      const block = line[i];
      
      // Calculate spacing from previous block
      if (i > 0) {
        const gap = block.x - lastX;
        // Preserve exact spacing using non-breaking spaces
        if (gap > 30) {
          // Large gap - likely tab or significant indent
          const spaceCount = Math.max(1, Math.floor(gap / 6));
          lineHTML += '&nbsp;'.repeat(Math.min(spaceCount, 50));
        } else if (gap > 5) {
          // Medium gap - spaces
          const spaceCount = Math.max(1, Math.floor(gap / 6));
          lineHTML += '&nbsp;'.repeat(Math.min(spaceCount, 20));
        } else if (gap > 1) {
          lineHTML += '&nbsp;';
        }
      }

      // Add text with formatting
      const styles: string[] = [];
      if (block.isBold) styles.push('font-weight: bold');
      if (block.isItalic) styles.push('font-style: italic');
      if (block.fontSize) {
        styles.push(`font-size: ${block.fontSize}px`);
      }
      // Match font family
      if (block.fontName) {
        if (block.fontName.includes('Times')) {
          styles.push("font-family: 'Times New Roman', serif");
        } else if (block.fontName.includes('Courier')) {
          styles.push("font-family: 'Courier New', monospace");
        } else if (block.fontName.includes('Arial') || block.fontName.includes('Helvetica')) {
          styles.push("font-family: Arial, sans-serif");
        }
      }
      
      const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
      lineHTML += `<span${styleAttr}>${escapeHtml(block.text)}</span>`;
      
      lastX = block.x + block.width;
    }

    // Create line div positioned exactly
    const lineStyles: string[] = [
      `position: absolute`,
      `top: ${lineY}px`,
      `left: ${lineX}px`,
      `white-space: pre`,
      `line-height: ${avgFontSize * 1.2}px`,
      `font-size: ${avgFontSize}px`
    ];
    
    // Add underline for section headers
    if (isLargeHeader) {
      lineStyles.push('border-bottom: 1px solid #000');
      lineStyles.push('padding-bottom: 2px');
      lineStyles.push('margin-bottom: 10px');
    }
    
    // Right-align if text is on the right side of page (for contact info)
    if (lineX > pageWidth * 0.6) {
      lineStyles.push('text-align: right');
      lineStyles.push(`right: ${pageWidth - (lineX + line.reduce((sum, b) => sum + b.width, 0))}px`);
      lineStyles.push('left: auto');
    }
    
    htmlParts.push(
      `<div class="pdf-line" style="${lineStyles.join('; ')}">${lineHTML}</div>`
    );
  }

  htmlParts.push('</div>'); // Close inner container
  htmlParts.push('</div>'); // Close pdf-page
  return htmlParts.join('\n');
};

/**
 * Escape HTML
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Render PDF with exact visual formatting
 */
export const renderPDFWithExactFormatting = async (
  file: File,
  maxPages: number = 10
): Promise<{ html: string; text: string; pages: PDFPageData[] }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  
  const numPages = Math.min(pdf.numPages, maxPages);
  const pages: PDFPageData[] = [];
  const htmlParts: string[] = [];
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Extract text blocks
    const textBlocks = await extractTextBlocks(page, viewport);
    
    // Group into lines
    const lines = groupIntoLines(textBlocks);
    
    // Build text content
    const pageText = lines.map(line => 
      line.map(block => block.text).join(' ')
    ).join('\n');
    fullText += pageText + (i < numPages ? '\n\n' : '');
    
    // Convert to HTML
    const pageHTML = blocksToHTML(lines, viewport.width, viewport.height);
    
    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      textBlocks: textBlocks,
      html: pageHTML
    });
    
    htmlParts.push(pageHTML);
  }

  return {
    html: htmlParts.join('\n'),
    text: fullText,
    pages: pages
  };
};
