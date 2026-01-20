import React, { useState, useEffect, useRef } from 'react';
import { PrioritizedActionPlan, PrioritizedImprovement } from '../types';
import { parseResume, ParsedResume, ResumeSection, findRelatedSections, reconstructResume } from '../utils/resumeParser';
import { extractFormattedTextFromPDF } from '../utils/pdfFormatter';
import { extractTextWithExactFormatting } from '../utils/pdfTextExtractor';
import { renderPDFWithExactFormatting } from '../utils/pdfRenderer';
import { renderPDFVisually } from '../utils/pdfVisualRenderer';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import './ResumeEditor.css';

// Helper to escape HTML
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

interface ResumeEditorProps {
  originalResume: string;
  originalResumeFile?: File; // Original PDF file for formatting extraction
  actionPlan: PrioritizedActionPlan;
  currentScore: number;
  onResumeUpdate?: (updatedResume: string) => void;
  onBack?: () => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({
  originalResume,
  originalResumeFile,
  actionPlan,
  currentScore,
  onResumeUpdate,
  onBack
}) => {
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [selectedImprovement, setSelectedImprovement] = useState<string | null>(null);
  const [completedImprovements, setCompletedImprovements] = useState<Set<string>>(new Set());
  const [highlightedSections, setHighlightedSections] = useState<Set<string>>(new Set());
  const [isLoadingFormatting, setIsLoadingFormatting] = useState(false);
  const resumeContainerRef = useRef<HTMLDivElement>(null);
  const editableContentRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const scrollPositionRef = useRef<{ top: number; left: number; scrollHeight?: number; clientHeight?: number } | null>(null);
  const contentInitializedRef = useRef(false);

  // Parse resume on mount - with formatting if PDF file available
  useEffect(() => {
    const loadResume = async () => {
      if (originalResumeFile && originalResumeFile.type === 'application/pdf') {
        setIsLoadingFormatting(true);
        try {
          // Render PDF with exact visual formatting
          const rendered = await renderPDFVisually(originalResumeFile);
          
          // Use the rendered HTML which preserves exact layout
          const htmlContent = `<div class="pdf-resume-container">${rendered.html}</div>`;
          
          // Display resume as a single formatted document preserving original layout
          const fullResumeSection: ResumeSection = {
            id: 'resume-full',
            type: 'other',
            title: 'Resume',
            content: rendered.text,
            htmlContent: htmlContent,
            originalContent: rendered.text,
            originalHtmlContent: htmlContent,
            isEdited: false
          };
          
          const parsed: ParsedResume = {
            sections: [fullResumeSection],
            rawText: rendered.text
          };
          
          setParsedResume(parsed);
          linkImprovementsToSections(parsed, actionPlan);
        } catch (error) {
          console.error('Error rendering PDF:', error);
          // Fallback: use text extraction
          const textWithExactFormatting = await extractTextWithExactFormatting(originalResumeFile);
          const htmlContent = `<div style="white-space: pre-wrap; font-family: inherit; line-height: 1.6; tab-size: 4;">${escapeHtml(textWithExactFormatting)}</div>`;
          
          const parsed: ParsedResume = {
            sections: [{
              id: 'resume-full',
              type: 'other',
              title: 'Resume',
              content: textWithExactFormatting,
              htmlContent: htmlContent,
              originalContent: textWithExactFormatting,
              originalHtmlContent: htmlContent,
              isEdited: false
            }],
            rawText: textWithExactFormatting
          };
          setParsedResume(parsed);
          linkImprovementsToSections(parsed, actionPlan);
          contentInitializedRef.current = false; // Reset flag to allow initialization
        } finally {
          setIsLoadingFormatting(false);
        }
      } else {
        // Plain text - display as single section preserving original format exactly
        const htmlContent = `<div style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${escapeHtml(originalResume)}</div>`;
        
        const parsed: ParsedResume = {
          sections: [{
            id: 'resume-full',
            type: 'other',
            title: 'Resume',
            content: originalResume,
            htmlContent: htmlContent,
            originalContent: originalResume,
            originalHtmlContent: htmlContent,
            isEdited: false
          }],
          rawText: originalResume
        };
        setParsedResume(parsed);
        linkImprovementsToSections(parsed, actionPlan);
        contentInitializedRef.current = false; // Reset flag to allow initialization
      }
    };

    if (originalResume) {
      loadResume();
    }
  }, [originalResume, originalResumeFile]);

  // Initialize content in editable div only once - never reset after user edits
  useEffect(() => {
    if (parsedResume && editableContentRef.current && !contentInitializedRef.current) {
      const section = parsedResume.sections.find(s => s.id === 'resume-full');
      if (section && section.htmlContent) {
        // Only set if the div is empty - don't overwrite user edits
        if (!editableContentRef.current.innerHTML || editableContentRef.current.innerHTML.trim() === '') {
          editableContentRef.current.innerHTML = section.htmlContent;
        }
        contentInitializedRef.current = true;
      }
    }
  }, [parsedResume]);

  // Prevent React from resetting content on re-render
  // Only update if content is actually different and we haven't initialized yet
  useEffect(() => {
    if (parsedResume && editableContentRef.current && contentInitializedRef.current) {
      const section = parsedResume.sections.find(s => s.id === 'resume-full');
      if (section && section.htmlContent) {
        const currentContent = editableContentRef.current.innerHTML;
        // Only update if it's a completely different resume (not just a state update from editing)
        // Check if the original content changed, not the current edited content
        if (section.originalHtmlContent && section.originalHtmlContent !== currentContent) {
          // This means it's a new resume, reset
          editableContentRef.current.innerHTML = section.htmlContent;
          contentInitializedRef.current = false; // Allow re-initialization
        }
        // Otherwise, don't touch the content - user edits are preserved
      }
    }
  }, [parsedResume?.sections.find(s => s.id === 'resume-full')?.originalHtmlContent]);

  // Link improvements to sections
  const linkImprovementsToSections = (parsed: ParsedResume, plan: PrioritizedActionPlan) => {
    const allImprovements = plan.allPrioritized;
    allImprovements.forEach(imp => {
      const relatedSections = findRelatedSections(imp.text, parsed.sections);
      imp.relatedSectionIds = relatedSections.map(s => s.id);
    });
  };

  // Save cursor position and scroll position
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const editableElement = editableContentRef.current;
    if (!editableElement) return;
    
    // Save scroll position from the actual scrollable container
    // Try multiple possible scroll containers
    let scrollContainer: HTMLElement | null = null;
    let current: HTMLElement | null = editableElement.parentElement;
    while (current) {
      const style = window.getComputedStyle(current);
      if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
        scrollContainer = current;
        break;
      }
      current = current.parentElement;
    }
    
    // Fallback to parent if no scroll container found
    if (!scrollContainer && editableElement.parentElement) {
      scrollContainer = editableElement.parentElement;
    }
    
    if (scrollContainer) {
      scrollPositionRef.current = {
        top: scrollContainer.scrollTop,
        left: scrollContainer.scrollLeft,
        scrollHeight: scrollContainer.scrollHeight,
        clientHeight: scrollContainer.clientHeight
      };
    }
    
    try {
      // Store the path to the nodes for restoration
      const getNodePath = (node: Node, root: Node): number[] => {
        const path: number[] = [];
        let current: Node | null = node;
        while (current && current !== root) {
          const parent: Node | null = current.parentNode;
          if (parent) {
            const childNodes = Array.from(parent.childNodes);
            const index = childNodes.findIndex(n => n === current);
            if (index !== -1) {
              path.unshift(index);
            }
          }
          current = parent;
        }
        return path;
      };
      
      selectionRef.current = {
        start: {
          path: getNodePath(range.startContainer, editableElement),
          offset: range.startOffset
        },
        end: {
          path: getNodePath(range.endContainer, editableElement),
          offset: range.endOffset
        }
      };
    } catch (error) {
      console.error('Error saving cursor position:', error);
    }
  };

  // Restore cursor position and scroll position
  const restoreCursorPosition = () => {
    if (!selectionRef.current || !editableContentRef.current) return;
    
    const editableElement = editableContentRef.current;
    const saved = selectionRef.current;
    
    // Find the scrollable container
    let scrollContainer: HTMLElement | null = null;
    let current: HTMLElement | null = editableElement.parentElement;
    while (current) {
      const style = window.getComputedStyle(current);
      if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
        scrollContainer = current;
        break;
      }
      current = current.parentElement;
    }
    if (!scrollContainer && editableElement.parentElement) {
      scrollContainer = editableElement.parentElement;
    }
    
    // Restore scroll position FIRST, before restoring cursor
    if (scrollPositionRef.current && scrollContainer) {
      const saved = scrollPositionRef.current;
      // Check if we were at the bottom (within 20px tolerance)
      const wasAtBottom = saved.scrollHeight && saved.clientHeight && 
                         (saved.scrollHeight - saved.top - saved.clientHeight < 20);
      
      if (wasAtBottom && saved.scrollHeight && saved.clientHeight) {
        // Keep at bottom even if content height changed
        const newBottom = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        scrollContainer.scrollTop = newBottom;
      } else {
        // Restore exact position
        scrollContainer.scrollTop = saved.top;
      }
      scrollContainer.scrollLeft = saved.left;
    }
    
    try {
      const getNodeFromPath = (path: number[], root: Node): Node | null => {
        let current: Node = root;
        for (const index of path) {
          if (current.childNodes[index]) {
            current = current.childNodes[index];
          } else {
            return null;
          }
        }
        return current;
      };
      
      const startNode = getNodeFromPath(saved.start.path, editableElement);
      const endNode = getNodeFromPath(saved.end.path, editableElement);
      
      if (startNode && endNode) {
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Adjust offset if text content changed
        let startOffset = saved.start.offset;
        let endOffset = saved.end.offset;
        
        if (startNode.nodeType === Node.TEXT_NODE) {
          const maxOffset = startNode.textContent?.length || 0;
          startOffset = Math.min(startOffset, maxOffset);
        }
        
        if (endNode.nodeType === Node.TEXT_NODE) {
          const maxOffset = endNode.textContent?.length || 0;
          endOffset = Math.min(endOffset, maxOffset);
        }
        
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        
        // Restore scroll position again after cursor restoration
        requestAnimationFrame(() => {
          if (scrollPositionRef.current && scrollContainer) {
            const saved = scrollPositionRef.current;
            // Check if we were at the bottom (within 20px tolerance)
            const wasAtBottom = saved.scrollHeight && saved.clientHeight && 
                               (saved.scrollHeight - saved.top - saved.clientHeight < 20);
            
            if (wasAtBottom && saved.scrollHeight && saved.clientHeight) {
              // Keep at bottom even if content height changed
              const newBottom = scrollContainer.scrollHeight - scrollContainer.clientHeight;
              scrollContainer.scrollTop = newBottom;
            } else {
              // Restore exact position
              scrollContainer.scrollTop = saved.top;
            }
            scrollContainer.scrollLeft = saved.left;
            
            // One final restoration to ensure it sticks
            requestAnimationFrame(() => {
              if (scrollPositionRef.current && scrollContainer) {
                const saved2 = scrollPositionRef.current;
                const wasAtBottom2 = saved2.scrollHeight && saved2.clientHeight && 
                                   (saved2.scrollHeight - saved2.top - saved2.clientHeight < 20);
                if (wasAtBottom2) {
                  scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                } else {
                  scrollContainer.scrollTop = saved2.top;
                }
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error restoring cursor position:', error);
      // Still restore scroll even if cursor restoration fails
      if (scrollPositionRef.current && scrollContainer) {
        scrollContainer.scrollTop = scrollPositionRef.current.top;
        scrollContainer.scrollLeft = scrollPositionRef.current.left;
      }
    }
  };

  // Handle section content change
  const handleSectionChange = (sectionId: string, newContent: string, newHtmlContent?: string) => {
    if (!parsedResume) return;

    const updatedSections: ResumeSection[] = parsedResume.sections.map(section => {
      if (section.id === sectionId) {
        const isEdited = newContent !== section.originalContent || 
                        (newHtmlContent !== undefined && newHtmlContent !== section.originalHtmlContent);
        return {
          ...section,
          content: newContent,
          htmlContent: newHtmlContent !== undefined ? newHtmlContent : section.htmlContent,
          isEdited: isEdited
        };
      }
      return section;
    });

    const updated: ParsedResume = {
      ...parsedResume,
      sections: updatedSections
    };

    setParsedResume(updated);

    // Reconstruct and notify parent (use HTML if available for better formatting)
    const reconstructed = reconstructResume(updated);
    onResumeUpdate?.(reconstructed);

    // Auto-save to localStorage
    localStorage.setItem('editedResume', JSON.stringify(updated));
    
    // Restore cursor position after state update
    setTimeout(() => {
      restoreCursorPosition();
    }, 0);
  };

  // Handle improvement selection
  const handleImprovementClick = (improvement: PrioritizedImprovement) => {
    setSelectedImprovement(improvement.text);
    
    // Highlight related sections
    if (improvement.relatedSectionIds && improvement.relatedSectionIds.length > 0) {
      setHighlightedSections(new Set(improvement.relatedSectionIds));
    } else if (parsedResume) {
      // Find sections if not already linked
      const related = findRelatedSections(improvement.text, parsedResume.sections);
      setHighlightedSections(new Set(related.map(s => s.id)));
    }

    // Scroll to first related section
    if (parsedResume && improvement.relatedSectionIds && improvement.relatedSectionIds.length > 0) {
      const firstSectionId = improvement.relatedSectionIds[0];
      const element = document.getElementById(`section-${firstSectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Toggle improvement completion
  const toggleImprovementComplete = (improvementText: string) => {
    const newCompleted = new Set(completedImprovements);
    if (newCompleted.has(improvementText)) {
      newCompleted.delete(improvementText);
    } else {
      newCompleted.add(improvementText);
    }
    setCompletedImprovements(newCompleted);
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!resumeContainerRef.current) return;

    try {
      // Show loading state
      const exportButton = document.querySelector('.export-pdf-button') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.textContent = 'Generating PDF...';
      }

      // Find the actual editable content element (this contains the resume with edits)
      const editableContent = resumeContainerRef.current.querySelector('.editable-content') as HTMLElement;
      if (!editableContent) {
        alert('Could not find resume content to export.');
        if (exportButton) {
          exportButton.disabled = false;
          exportButton.textContent = '📄 Export Resume as PDF';
        }
        return;
      }

      // IMPORTANT: Get the current innerHTML from the DOM (this includes all edits)
      // React state might not be updated yet, but the DOM has the current content
      const currentHtmlContent = editableContent.innerHTML;
      
      // Update React state with current content to ensure consistency
      if (parsedResume && parsedResume.sections.length > 0) {
        const section = parsedResume.sections[0];
        if (section.id === 'resume-full') {
          // Update the section with current content
          section.htmlContent = currentHtmlContent;
          section.content = editableContent.textContent || '';
        }
      }

      // Store original styles to restore later
      const originalEditableMaxWidth = editableContent.style.maxWidth;
      const originalEditableOverflow = editableContent.style.overflow;
      const originalEditableWidth = editableContent.style.width;
      const originalEditableHeight = editableContent.style.height;
      const originalEditablePosition = editableContent.style.position;
      const originalEditablePaddingBottom = editableContent.style.paddingBottom;
      const originalEditableScrollTop = editableContent.scrollTop;
      const originalEditableScrollLeft = editableContent.scrollLeft;
      const originalContainerMaxWidth = resumeContainerRef.current.style.maxWidth;
      const originalContainerOverflow = resumeContainerRef.current.style.overflow;

      // Temporarily remove all constraints to capture full content
      editableContent.style.maxWidth = 'none';
      editableContent.style.overflow = 'visible';
      editableContent.style.width = 'auto';
      editableContent.style.height = 'auto';
      editableContent.style.position = 'static'; // Ensure normal flow
      editableContent.style.paddingBottom = '40px'; // Extra space to avoid bottom cutoff
      resumeContainerRef.current.style.maxWidth = 'none';
      resumeContainerRef.current.style.overflow = 'visible';
      editableContent.scrollTop = 0;
      editableContent.scrollLeft = 0;

      // Force a reflow to ensure styles are applied
      void editableContent.offsetHeight;

      // Wait for layout to update and ensure content is rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get the actual dimensions of the content (including all edits)
      // Use scrollHeight/scrollWidth to get full content dimensions
      const contentWidth = editableContent.scrollWidth || editableContent.offsetWidth || editableContent.clientWidth;
      const contentHeight = editableContent.scrollHeight || editableContent.offsetHeight || editableContent.clientHeight;

      // Convert HTML to canvas - capture the editable content directly with full dimensions
      const canvas = await html2canvas(editableContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: contentWidth,
        height: contentHeight,
        windowWidth: contentWidth,
        windowHeight: contentHeight,
        allowTaint: true,
        removeContainer: false,
        scrollX: 0,
        scrollY: 0
      });

      // Restore original styles
      editableContent.style.maxWidth = originalEditableMaxWidth;
      editableContent.style.overflow = originalEditableOverflow;
      editableContent.style.width = originalEditableWidth;
      editableContent.style.height = originalEditableHeight;
      editableContent.style.position = originalEditablePosition;
      editableContent.style.paddingBottom = originalEditablePaddingBottom;
      resumeContainerRef.current.style.maxWidth = originalContainerMaxWidth;
      resumeContainerRef.current.style.overflow = originalContainerOverflow;
      editableContent.scrollTop = originalEditableScrollTop;
      editableContent.scrollLeft = originalEditableScrollLeft;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      
      // Calculate image dimensions to fit PDF width while maintaining aspect ratio
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Calculate pixels per mm for accurate slicing
      const pixelsPerMm = canvas.height / imgHeight;
      const pageHeightInPixels = pdfHeight * pixelsPerMm;
      
      // Calculate total number of pages needed - ensure we capture everything
      const totalPages = Math.ceil((canvas.height + 2) / pageHeightInPixels);
      
      // Add image across multiple pages - ensure we capture everything including the bottom
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }
        
        // Calculate the source Y position in pixels for this page
        const sourceY = page * pageHeightInPixels;
        
        // For the last page, capture everything remaining
        const isLastPage = page === totalPages - 1;
        const sourceHeight = isLastPage 
          ? canvas.height - sourceY  // Capture all remaining pixels on last page
          : pageHeightInPixels;      // Standard page height for other pages
        
        // Ensure we don't go beyond canvas bounds
        const actualSourceY = Math.max(0, Math.min(sourceY, canvas.height - 1));
        const actualSourceHeight = Math.max(1, Math.min(sourceHeight, canvas.height - actualSourceY));
        
        if (actualSourceHeight > 0 && actualSourceY < canvas.height) {
          // Create a temporary canvas for this page slice
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.ceil(actualSourceHeight);
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            // Fill with white background
            pageCtx.fillStyle = '#ffffff';
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            
            // Draw the slice of the image for this page
            pageCtx.drawImage(
              canvas,
              0, Math.floor(actualSourceY), canvas.width, Math.ceil(actualSourceHeight), // Source rectangle
              0, 0, canvas.width, Math.ceil(actualSourceHeight) // Destination rectangle
            );
            
            // Convert page slice to image data
            const pageImgData = pageCanvas.toDataURL('image/png');
            
            // Calculate the height in mm for this page slice
            const pageImgHeightMm = (actualSourceHeight * pdfWidth) / canvas.width;
            
            // Add the page slice to PDF
            pdf.addImage(
              pageImgData,
              'PNG',
              0, // x position (left edge)
              0, // y position (top of page)
              imgWidth, // width
              pageImgHeightMm // height for this page in mm
            );
          }
        }
      }

      // Save PDF
      const fileName = `resume-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      // Reset button
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = '📄 Export Resume as PDF';
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
      
      // Make sure to restore styles even on error
      if (resumeContainerRef.current) {
        const editableContent = resumeContainerRef.current.querySelector('.editable-content') as HTMLElement;
        if (editableContent) {
          editableContent.style.maxWidth = '';
          editableContent.style.overflow = '';
          editableContent.style.width = '';
          editableContent.style.height = '';
        }
        resumeContainerRef.current.style.maxWidth = '';
        resumeContainerRef.current.style.overflow = '';
      }
      
      const exportButton = document.querySelector('.export-pdf-button') as HTMLButtonElement;
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.textContent = '📄 Export Resume as PDF';
      }
    }
  };

  if (!parsedResume) {
    return (
      <div className="resume-editor-loading">
        <p>Loading resume editor...</p>
      </div>
    );
  }

  return (
    <div className="resume-editor">
      <div className="editor-header">
        <div className="header-content">
          {onBack && (
            <button onClick={onBack} className="back-button">
              ← Back to Recommendations
            </button>
          )}
          <h2>✏️ Resume Editor</h2>
          <p className="header-description">
            Edit your resume directly and check off improvements as you complete them. Your changes are saved automatically.
          </p>
        </div>
        <div className="header-actions">
          <button onClick={exportToPDF} className="export-pdf-button">
            📄 Export Resume as PDF
          </button>
        </div>
      </div>

      <div className="editor-layout">
        {/* Left Sidebar - Action Plan */}
        <div className="action-plan-sidebar">
          <h3>Action Plan</h3>
          <div className="improvements-list">
            {actionPlan.quickWins.length > 0 && (
              <div className="improvement-category">
                <h4>⚡ Quick Wins</h4>
                {actionPlan.quickWins.map((imp, i) => (
                  <div
                    key={`quick-${i}`}
                    className={`improvement-item ${selectedImprovement === imp.text ? 'selected' : ''} ${completedImprovements.has(imp.text) ? 'completed' : ''}`}
                    onClick={() => handleImprovementClick(imp)}
                  >
                    <label className="improvement-checkbox">
                      <input
                        type="checkbox"
                        checked={completedImprovements.has(imp.text)}
                        onChange={() => toggleImprovementComplete(imp.text)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="improvement-text">{imp.text}</span>
                    </label>
                    <div className="improvement-badges">
                      <span className="badge impact">Impact: {imp.impact}/10</span>
                      <span className={`badge effort effort-${imp.effort}`}>{imp.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {actionPlan.strategic.length > 0 && (
              <div className="improvement-category">
                <h4>🎯 Strategic</h4>
                {actionPlan.strategic.map((imp, i) => (
                  <div
                    key={`strategic-${i}`}
                    className={`improvement-item ${selectedImprovement === imp.text ? 'selected' : ''} ${completedImprovements.has(imp.text) ? 'completed' : ''}`}
                    onClick={() => handleImprovementClick(imp)}
                  >
                    <label className="improvement-checkbox">
                      <input
                        type="checkbox"
                        checked={completedImprovements.has(imp.text)}
                        onChange={() => toggleImprovementComplete(imp.text)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="improvement-text">{imp.text}</span>
                    </label>
                    <div className="improvement-badges">
                      <span className="badge impact">Impact: {imp.impact}/10</span>
                      <span className={`badge effort effort-${imp.effort}`}>{imp.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {actionPlan.allPrioritized
              .filter(imp => !actionPlan.quickWins.includes(imp) && !actionPlan.strategic.includes(imp))
              .map((imp, i) => (
                <div
                  key={`other-${i}`}
                  className={`improvement-item ${selectedImprovement === imp.text ? 'selected' : ''} ${completedImprovements.has(imp.text) ? 'completed' : ''}`}
                  onClick={() => handleImprovementClick(imp)}
                >
                  <label className="improvement-checkbox">
                    <input
                      type="checkbox"
                      checked={completedImprovements.has(imp.text)}
                      onChange={() => toggleImprovementComplete(imp.text)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="improvement-text">{imp.text}</span>
                  </label>
                </div>
              ))}
          </div>
        </div>

        {/* Right Side - Editable Resume */}
        <div className="resume-editor-content">
          <div className="resume-container" ref={resumeContainerRef}>
            {parsedResume.sections.map((section) => (
              <div
                key={section.id}
                id={`section-${section.id}`}
                className={`resume-section ${section.type} ${highlightedSections.has(section.id) ? 'highlighted' : ''} ${section.isEdited ? 'edited' : ''}`}
              >
                {/* Only show section title if it's not the full resume */}
                {section.id !== 'resume-full' && section.type !== 'header' && (
                  <h3 className="section-title">{section.title}</h3>
                )}
                {section.htmlContent ? (
                  <div
                    ref={editableContentRef}
                    className="editable-content pdf-editable"
                    contentEditable
                    suppressContentEditableWarning
                    style={section.style}
                    onKeyDown={(e) => {
                      // Save cursor position before any key action (especially delete/backspace)
                      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab') {
                        saveCursorPosition();
                      }
                      
                      // Allow normal editing - Enter creates new line, Tab inserts tab
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        document.execCommand('insertText', false, '    '); // 4 spaces instead of tab
                        saveCursorPosition();
                      }
                    }}
                    onMouseUp={() => {
                      // Save cursor position on mouse click
                      saveCursorPosition();
                    }}
                    onKeyUp={() => {
                      // Save cursor position after key release
                      saveCursorPosition();
                    }}
                    onBlur={(e) => {
                      const htmlContent = e.currentTarget.innerHTML;
                      const textContent = e.currentTarget.textContent || '';
                      handleSectionChange(section.id, textContent, htmlContent);
                    }}
                    onInput={(e) => {
                      // IMMEDIATELY update state to prevent content loss on re-render
                      const htmlContent = e.currentTarget.innerHTML;
                      const textContent = e.currentTarget.textContent || '';
                      
                      // Update state immediately to prevent reverting to old content
                      if (parsedResume) {
                        const updated: ResumeSection[] = parsedResume.sections.map(s =>
                          s.id === section.id 
                            ? { ...s, isEdited: true, content: textContent, htmlContent: htmlContent } 
                            : s
                        );
                        setParsedResume({ ...parsedResume, sections: updated });
                      }
                      
                      // Find the scrollable container
                      let scrollContainer: HTMLElement | null = null;
                      let current: HTMLElement | null = e.currentTarget.parentElement;
                      while (current) {
                        const style = window.getComputedStyle(current);
                        if (style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll') {
                          scrollContainer = current;
                          break;
                        }
                        current = current.parentElement;
                      }
                      if (!scrollContainer && e.currentTarget.parentElement) {
                        scrollContainer = e.currentTarget.parentElement;
                      }
                      
                      // Save scroll position immediately from the correct container
                      if (scrollContainer) {
                        scrollPositionRef.current = {
                          top: scrollContainer.scrollTop,
                          left: scrollContainer.scrollLeft,
                          scrollHeight: scrollContainer.scrollHeight,
                          clientHeight: scrollContainer.clientHeight
                        } as any;
                      }
                      
                      // Save cursor position
                      saveCursorPosition();
                      
                      // Prevent multiple simultaneous updates
                      if (isUpdatingRef.current) {
                        // Still restore scroll even if update is blocked
                        if (scrollPositionRef.current && scrollContainer) {
                          scrollContainer.scrollTop = (scrollPositionRef.current as any).top;
                          scrollContainer.scrollLeft = (scrollPositionRef.current as any).left;
                        }
                        return;
                      }
                      isUpdatingRef.current = true;
                      
                      // Restore scroll and cursor after state update
                      requestAnimationFrame(() => {
                        // Restore scroll from the correct container
                        if (scrollPositionRef.current && scrollContainer) {
                          const saved = scrollPositionRef.current as any;
                          
                          // If we're at the bottom, maintain bottom position even if content height changed
                          const wasAtBottom = saved.scrollHeight && saved.clientHeight && 
                                             (saved.scrollHeight - saved.top - saved.clientHeight < 20);
                          
                          if (wasAtBottom) {
                            // Keep at bottom - restore immediately and again after layout
                            scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                            scrollContainer.scrollLeft = saved.left;
                            
                            // Restore again after layout settles
                            requestAnimationFrame(() => {
                              if (scrollContainer) {
                                scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                              }
                              restoreCursorPosition();
                              
                              // One more time to be sure
                              requestAnimationFrame(() => {
                                if (scrollContainer) {
                                  scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                                }
                                isUpdatingRef.current = false;
                              });
                            });
                          } else {
                            // Not at bottom - restore exact position
                            scrollContainer.scrollTop = saved.top;
                            scrollContainer.scrollLeft = saved.left;
                            
                            // Restore again to ensure it sticks
                            requestAnimationFrame(() => {
                              if (scrollContainer && scrollPositionRef.current) {
                                const saved2 = scrollPositionRef.current as any;
                                scrollContainer.scrollTop = saved2.top;
                                scrollContainer.scrollLeft = saved2.left;
                              }
                              restoreCursorPosition();
                              isUpdatingRef.current = false;
                            });
                          }
                        } else {
                          restoreCursorPosition();
                          isUpdatingRef.current = false;
                        }
                      });
                    }}
                  />
                ) : (
                  <div
                    className="editable-content"
                    contentEditable
                    suppressContentEditableWarning
                    style={section.style}
                    onKeyDown={(e) => {
                      // Preserve tabs when Tab key is pressed
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        document.execCommand('insertText', false, '\t');
                      }
                    }}
                    onBlur={(e) => {
                      const textContent = e.currentTarget.textContent || '';
                      handleSectionChange(section.id, textContent);
                    }}
                    onInput={(e) => {
                      // Mark as edited in real-time
                      const textContent = e.currentTarget.textContent || '';
                      if (textContent !== section.originalContent) {
                        const updated: ResumeSection[] = parsedResume.sections.map(s =>
                          s.id === section.id 
                            ? { ...s, isEdited: true, content: textContent } 
                            : s
                        );
                        setParsedResume({ ...parsedResume, sections: updated });
                      }
                    }}
                  >
                    {section.content}
                  </div>
                )}
                {section.isEdited && (
                  <span className="edited-badge">✏️ Edited</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeEditor;
