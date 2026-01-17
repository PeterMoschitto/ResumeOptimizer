# Resume Editor Implementation Plan

## Feature Overview
Allow users to view, edit, and export their resume directly on the website with live editing capabilities integrated with the action plan.

## Goals
1. Display resume in editable format
2. Make live edits to resume content
3. Link improvements to resume sections
4. Track completed improvements
5. Export edited resume as PDF

## Architecture Plan

### Phase 1: Resume Display & Parsing
**Goal**: Show resume in structured, editable format

**Approach**:
- Parse resume text into sections (Header, Experience, Education, Skills, etc.)
- Use regex/pattern matching to identify sections
- Display in structured format with section headers
- Store parsed structure in state

**Components**:
- `ResumeParser.ts` - Utility to parse resume text into sections
- `ResumeDisplay.tsx` - Component to show parsed resume
- `ResumeSection.tsx` - Individual editable section component

### Phase 2: Rich Text Editing
**Goal**: Allow live editing of resume content

**Approach**:
- Use `contentEditable` for simple editing (lightweight)
- Or use `react-quill` for rich text editing (more features)
- Start with contentEditable for simplicity, can upgrade later
- Track changes in state

**Components**:
- `EditableSection.tsx` - Editable text area component
- State management for resume content
- Auto-save functionality (localStorage)

### Phase 3: Action Plan Integration
**Goal**: Link improvements to resume sections

**Approach**:
- Map improvements to resume sections (e.g., "Add quantifiable metrics" → Experience section)
- Highlight relevant sections when improvement is selected
- Show section indicators on action plan items
- When improvement is checked off, mark corresponding section as "improved"

**Components**:
- `ResumeEditor.tsx` - Main editor component
- Integration with `ActionPlanGenerator`
- Section highlighting based on improvement selection

### Phase 4: PDF Export
**Goal**: Export edited resume as formatted PDF

**Approach**:
- Use `jsPDF` + `html2canvas` to convert HTML to PDF
- Or use `react-pdf/renderer` for better formatting control
- Preserve formatting (fonts, spacing, layout)
- Professional resume styling

**Components**:
- `ResumePDFExporter.ts` - PDF generation utility
- Export button in editor
- Preview before export

## Implementation Strategy

### Option A: Simple ContentEditable (Recommended for MVP)
**Pros**:
- Lightweight, no dependencies
- Fast to implement
- Good for text-based resumes

**Cons**:
- Limited formatting control
- May lose some PDF formatting

### Option B: Rich Text Editor (react-quill)
**Pros**:
- Better formatting options
- More professional editing experience

**Cons**:
- Additional dependency
- More complex implementation

### Option C: Structured Form Editor
**Pros**:
- Best for structured data
- Easy to validate
- Clean data model

**Cons**:
- Less flexible
- Requires parsing all resumes into same structure

## Recommended Approach: Hybrid

1. **Start with ContentEditable** for quick MVP
2. **Parse resume into sections** for better organization
3. **Link improvements to sections** for guided editing
4. **Use html2canvas + jsPDF** for export
5. **Upgrade to rich editor later** if needed

## File Structure

```
onboarding-project/src/
├── components/
│   ├── ResumeEditor.tsx          # Main editor component
│   ├── ResumeDisplay.tsx          # Resume display
│   ├── EditableSection.tsx       # Editable section
│   ├── ResumePDFExporter.tsx     # PDF export component
│   └── ActionPlanGenerator.tsx   # (existing, integrate)
├── utils/
│   ├── resumeParser.ts           # Parse resume into sections
│   └── pdfExporter.ts            # PDF export utilities
└── types/
    └── resume.ts                  # Resume data types
```

## Data Flow

1. User uploads resume → Text extracted
2. Text parsed into sections → Structured data
3. Sections displayed in editor → Editable view
4. User makes edits → State updated
5. User checks off improvements → Sections marked
6. User exports → PDF generated from edited content

## UI/UX Flow

1. After analysis, show "Edit Resume" button
2. Editor opens with:
   - Left side: Action plan with checkboxes
   - Right side: Editable resume sections
3. Click improvement → Highlight relevant section
4. Edit section → Auto-save
5. Check off improvement → Mark as complete
6. Export button → Generate PDF

## Technical Considerations

### Resume Parsing
- Use regex patterns to identify sections
- Common sections: Name, Contact, Summary, Experience, Education, Skills
- Fallback: If parsing fails, show as single editable block

### State Management
- Store original resume text
- Store edited resume sections
- Track which improvements are completed
- Track which sections have been edited

### PDF Export
- Preserve formatting (fonts, spacing)
- Professional layout
- ATS-friendly format
- Include all sections

## Implementation Steps

1. ✅ Create resume parser utility
2. ✅ Create ResumeEditor component
3. ✅ Create EditableSection component
4. ✅ Integrate with ActionPlanGenerator
5. ✅ Add section highlighting
6. ✅ Implement PDF export
7. ✅ Add auto-save functionality
8. ✅ Polish UI/UX

## Next Steps

Let's start with Phase 1: Resume parsing and display.
