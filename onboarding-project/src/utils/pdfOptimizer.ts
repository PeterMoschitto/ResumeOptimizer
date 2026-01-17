import { getDocument } from 'pdfjs-dist';

export interface PDFProcessingOptions {
  maxPages?: number;
  maxTextLength?: number;
  timeout?: number;
}

export class PDFProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PDFProcessingError';
  }
}

export const extractTextFromPDFOptimized = async (
  file: File,
  options: PDFProcessingOptions = {}
): Promise<string> => {
  const {
    maxPages = 10,
    maxTextLength = 50000,
    timeout = 30000
  } = options;

  // Validate file size
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new PDFProcessingError(
      'File too large. Please upload a smaller PDF (max 10MB).',
      'FILE_TOO_LARGE'
    );
  }

  // Set up timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new PDFProcessingError('PDF processing timeout', 'TIMEOUT')), timeout);
  });

  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Process with timeout
    const pdf = await Promise.race([
      getDocument(arrayBuffer).promise,
      timeoutPromise
    ]);

    let fullText = '';
    const numPages = Math.min(pdf.numPages, maxPages);

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';

      // Check text length limit
      if (fullText.length > maxTextLength) {
        fullText = fullText.substring(0, maxTextLength);
        break;
      }
    }

    if (!fullText.trim()) {
      throw new PDFProcessingError(
        'No text found in PDF. Please ensure the PDF contains selectable text.',
        'NO_TEXT_FOUND'
      );
    }

    return fullText.trim();
  } catch (error) {
    if (error instanceof PDFProcessingError) {
      throw error;
    }
    
    console.error('PDF processing error:', error);
    throw new PDFProcessingError(
      'Failed to process PDF. Please try again.',
      'PROCESSING_ERROR'
    );
  }
}; 