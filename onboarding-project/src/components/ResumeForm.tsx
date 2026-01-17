import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { extractTextFromPDFOptimized, PDFProcessingError } from '../utils/pdfOptimizer';
import { handleAPIError } from '../utils/errorHandler';
import { ERROR_MESSAGES, FILE_CONFIG, UI_CONFIG } from '../constants';
import './ResumeForm.css';

export interface ResumeContext {
  experienceLevel: string;
  yearsOfExperience: string;
  educationLevel: string;
  industry?: string;
  location?: string;
}

interface ResumeFormProps {
  onSubmit: (resume: string, jobTitle: string, context: ResumeContext, resumeFile?: File) => void;
  isLoading: boolean;
}

interface APIError extends Error {
  code?: string;
  retryAfter?: number;
}

const ResumeForm: React.FC<ResumeFormProps> = ({ onSubmit, isLoading }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [resume, setResume] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ReactNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Context fields for fair comparison
  const [experienceLevel, setExperienceLevel] = useState('entry-level');
  const [yearsOfExperience, setYearsOfExperience] = useState('0-2');
  const [educationLevel, setEducationLevel] = useState('bachelors');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');

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
      // Validate file size
      if (file.size > FILE_CONFIG.MAX_SIZE) {
        setError(ERROR_MESSAGES.FILE_TOO_LARGE);
        return;
      }

      // Validate file type
      if (!FILE_CONFIG.SUPPORTED_TYPES.includes(file.type as any)) {
        setError(ERROR_MESSAGES.UNSUPPORTED_FORMAT);
        return;
      }

      if (file.type === 'application/pdf') {
        const text = await extractTextFromPDFOptimized(file);
        setResume(text);
        setResumeFile(file); // Store the file for formatting extraction
      } else if (file.type === 'text/plain') {
        const text = await file.text();
        setResume(text);
        setResumeFile(null); // No file for text files
      } else {
        setError(ERROR_MESSAGES.UNSUPPORTED_FORMAT);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      
      if (error instanceof PDFProcessingError) {
        setError(error.message);
      } else {
        const apiError = handleAPIError(error);
        setError(apiError.userFriendly || ERROR_MESSAGES.PROCESSING_ERROR);
      }
    } finally {
      setIsProcessing(false);
    }
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
      const context: ResumeContext = {
        experienceLevel,
        yearsOfExperience,
        educationLevel,
        industry: industry.trim() || undefined,
        location: location.trim() || undefined
      };
      await onSubmit(resume, jobTitle, context, resumeFile || undefined);
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
    setResumeFile(null);
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
          <label htmlFor="jobTitle">Target Job Title *</label>
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

        <div className="form-section">
          <h3>Context for Fair Comparison</h3>
          <p className="section-description">Help us provide more accurate, age-appropriate analysis by providing your background information.</p>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="experienceLevel">Experience Level *</label>
              <select
                id="experienceLevel"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                required
                disabled={isLoading}
              >
                <option value="student">Student (College/University)</option>
                <option value="entry-level">Entry Level (0-2 years)</option>
                <option value="mid-level">Mid Level (3-7 years)</option>
                <option value="senior">Senior (8-12 years)</option>
                <option value="executive">Executive/Lead (13+ years)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="yearsOfExperience">Years of Experience *</label>
              <select
                id="yearsOfExperience"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                required
                disabled={isLoading}
              >
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="6-10">6-10 years</option>
                <option value="11-15">11-15 years</option>
                <option value="16+">16+ years</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="educationLevel">Education Level *</label>
              <select
                id="educationLevel"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                required
                disabled={isLoading}
              >
                <option value="high-school">High School</option>
                <option value="associates">Associate's Degree</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="phd">PhD/Doctorate</option>
                <option value="professional">Professional Certification</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="industry">Industry/Sector</label>
              <input
                type="text"
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location (Optional)</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA or Remote"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Resume Upload *</label>
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
              {UI_CONFIG.PROGRESS_STEPS.map((step, index) => (
                <div key={index} className="step">
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-text">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeForm; 