/**
 * PDF Text Extractor with Exact Formatting Preservation
 * Extracts text preserving exact spacing, tabs, and line breaks
 */

import { getDocument } from 'pdfjs-dist';

export interface TextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

/**
 * Extract text from PDF preserving exact spacing, tabs, and line breaks
 */
export const extractTextWithExactFormatting = async (
  file: File,
  maxPages: number = 10
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  
  const numPages = Math.min(pdf.numPages, maxPages);
  let fullText = '';
  
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Convert text items to our format with positions
    const textItems: TextItem[] = (textContent.items as any[]).map((item: any) => {
      const transform = item.transform || [1, 0, 0, 1, 0, 0];
      const fontSize = Math.abs(transform[0]) || item.height || 12;
      const x = transform[4] || 0;
      const y = viewport.height - (transform[5] || 0); // Convert to top-left origin
      
      return {
        str: item.str || '',
        x: x,
        y: y,
        width: item.width || 0,
        height: item.height || fontSize,
        fontSize: fontSize,
        fontName: (item.fontName || 'Helvetica').toString()
      };
    });
    
    // Sort by Y position (top to bottom), then X (left to right)
    textItems.sort((a, b) => {
      const yDiff = b.y - a.y; // Higher Y first (top to bottom)
      if (Math.abs(yDiff) > 2) return yDiff;
      return a.x - b.x; // Same line, left to right
    });
    
    // Build text preserving exact spacing and structure
    let pageText = '';
    // These variables were intended for future use but are currently unused
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _currentY = textItems[0]?.y || 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _currentLineX = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _currentLineItems: TextItem[] = [];
    const lineTolerance = 2; // Pixels - tighter tolerance
    
    // Group items by line first
    const lines: TextItem[][] = [];
    for (const item of textItems) {
      if (lines.length === 0 || Math.abs(item.y - lines[lines.length - 1][0]?.y || 0) > lineTolerance) {
        // New line
        lines.push([item]);
      } else {
        // Same line
        lines[lines.length - 1].push(item);
      }
    }
    
    // Process each line
    for (const line of lines) {
      // Sort line items by X position (left to right)
      line.sort((a, b) => a.x - b.x);
      
      let lineText = '';
      let lastX = 0;
      
      for (let i = 0; i < line.length; i++) {
        const item = line[i];
        
        // Calculate spacing from previous item
        if (i > 0) {
          const gap = item.x - lastX;
          
          // Determine if this is a tab, spaces, or no space
          if (gap > 30) {
            // Large gap - likely a tab (typical tab is 40-80px)
            // Calculate number of tabs based on typical tab width
            const avgCharWidth = line[0].fontSize * 0.6; // Approximate character width
            const tabWidth = avgCharWidth * 8; // Typical tab is 8 characters
            const tabCount = Math.round(gap / tabWidth);
            lineText += '\t'.repeat(Math.max(1, Math.min(tabCount, 4)));
          } else if (gap > 8) {
            // Medium gap - multiple spaces
            // Calculate based on character width
            const avgCharWidth = item.fontSize * 0.6;
            const spaceCount = Math.round(gap / avgCharWidth);
            lineText += ' '.repeat(Math.max(1, Math.min(spaceCount, 20)));
          } else if (gap > 2) {
            // Small gap - single space
            lineText += ' ';
          }
          // If gap <= 2, items are adjacent (part of same word), no space
        } else {
          // First item in line - check if it's indented
          if (item.x > 50) {
            // Indented line - add tabs based on indentation
            const avgCharWidth = item.fontSize * 0.6;
            const tabWidth = avgCharWidth * 8;
            const tabCount = Math.round(item.x / tabWidth);
            if (tabCount > 0) {
              lineText += '\t'.repeat(Math.min(tabCount, 4));
            } else {
              // Small indent - use spaces
              const spaceCount = Math.round(item.x / avgCharWidth);
              lineText += ' '.repeat(Math.min(spaceCount, 20));
            }
          }
        }
        
        // Add the text
        lineText += item.str;
        lastX = item.x + item.width;
      }
      
      // Add line to page text
      if (pageText) {
        pageText += '\n';
      }
      pageText += lineText;
    }
    
    // Add page break (except for last page)
    if (i < numPages) {
      fullText += pageText + '\n\n';
    } else {
      fullText += pageText;
    }
  }
  
  return fullText;
};
