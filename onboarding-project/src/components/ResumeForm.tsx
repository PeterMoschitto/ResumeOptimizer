import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import './ResumeForm.css';

interface ResumeFormProps {
  onSubmit: (resume: string, jobTitle: string) => void;
  isLoading: boolean;
}

interface APIError extends Error {
  code?: string;
  retryAfter?: number;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ onSubmit, isLoading }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [resume, setResume] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ReactNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Set up PDF.js worker
    try {
      GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
    } catch (error) {
      console.error('Error setting up PDF.js worker:', error);
      setError('Error initializing PDF processing. Please refresh the page.');
    }
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDF(file);
        setResume(text);
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setResume(text);
      } else {
        setError('Please upload a PDF or text file');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }
    if (!resume.trim()) {
      setError('Please upload your resume');
      return;
    }
    
    try {
      await onSubmit(resume, jobTitle);
    } catch (error) {
      console.error('Error submitting form:', error);
      
      const apiError = error as APIError;
      
      if (apiError.code === 'QUOTA_EXCEEDED') {
        setError(
          <div>
            <p>API quota exceeded. You can:</p>
            <ul>
              <li>Check your usage at <a href="https://platform.openai.com/account/usage" target="_blank" rel="noopener noreferrer">OpenAI Dashboard</a></li>
              <li>Upgrade your plan</li>
              <li>Try again later</li>
            </ul>
          </div>
        );
      } else if (apiError.code === 'RATE_LIMIT') {
        const waitTime = apiError.retryAfter || 60;
        setError(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
        
        // Auto-retry after the wait time
        setTimeout(() => {
          setError(null);
          handleSubmit(e);
        }, waitTime * 1000);
      } else {
        setError(apiError.message || 'Error submitting form. Please try again.');
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setResume('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="resume-form-container">
      <form onSubmit={handleSubmit} className="resume-form">
        {error && (
          <div className="error-message">
            {typeof error === 'string' ? error : error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="jobTitle">Target Job Title</label>
          <input
            type="text"
            id="jobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Software Engineer, Product Manager"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label>Resume Upload</label>
          <div
            className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {resume ? (
              <div className="file-selected">
                <span>Resume loaded</span>
                <button
                  type="button"
                  className="remove-file"
                  onClick={handleRemoveFile}
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="file-upload-content">
                <div className="upload-icon">📄</div>
                <p>Drag and drop your resume here, or</p>
                <button
                  type="button"
                  className="browse-button"
                  onClick={handleBrowseClick}
                  disabled={isLoading}
                >
                  Browse Files
                </button>
                <p className="file-types">Supported formats: PDF, TXT</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              accept=".pdf,.txt"
              className="file-input"
              disabled={isLoading}
            />
          </div>
        </div>

        <button
          type="submit"
          className="submit-button"
          disabled={isLoading || isProcessing || !resume}
        >
          {isLoading ? (
            <div className="loading-button">
              <div className="loading-spinner"></div>
              <span>Analyzing Resume...</span>
            </div>
          ) : isProcessing ? (
            'Processing...'
          ) : (
            'Analyze Resume'
          )}
        </button>
      </form>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <h3>Analyzing Your Resume</h3>
            <p>This may take a few moments...</p>
            <div className="loading-steps">
              <div className="step">
                <span className="step-icon">📄</span>
                <span className="step-text">Reading Resume</span>
              </div>
              <div className="step">
                <span className="step-icon">🔍</span>
                <span className="step-text">Analyzing Content</span>
              </div>
              <div className="step">
                <span className="step-icon">📊</span>
                <span className="step-text">Evaluating Skills</span>
              </div>
              <div className="step">
                <span className="step-icon">💡</span>
                <span className="step-text">Generating Insights</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm; 