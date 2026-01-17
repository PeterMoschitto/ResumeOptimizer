# AI Resume Analyzer & Comparison Platform

A comprehensive, professional-grade web application that analyzes resumes using multiple AI providers and provides detailed, actionable feedback. This platform enables users to compare how different AI models evaluate and grade resumes, offering unique insights into resume optimization strategies.

## 🎯 Project Overview

This platform serves as both a **resume optimization tool** and an **AI comparison research platform**. Users can upload their resume, specify a target job title, and receive comprehensive analysis from multiple AI providers. The system compares and contrasts different AI perspectives, helping users understand how various AI models interpret and evaluate resume content.

### Key Features

- **Multi-AI Provider Support**: Compare analysis from OpenAI, Anthropic Claude, Google Gemini, and more
- **Comprehensive Resume Analysis**: Deep evaluation of content, skills, formatting, and market positioning
- **Intelligent Scoring System**: 60-100 point scale with industry benchmarks
- **PDF Processing**: Advanced PDF text extraction with error handling
- **Real-time Progress Tracking**: Visual feedback during analysis
- **Caching System**: Efficient result caching to reduce API costs
- **Responsive UI**: Modern, professional interface built with React and TypeScript

## 📊 Current Resume Analysis System

### How Resume Analysis Works

The platform currently uses **OpenAI's GPT-4** model to perform comprehensive resume analysis. Here's how the system evaluates and grades resumes:

#### 1. **Resume Processing Pipeline**

```
PDF Upload → Text Extraction → Content Analysis → AI Evaluation → Structured Results
```

- **PDF Upload**: Users can drag-and-drop or select PDF files (max 10MB, 10 pages)
- **Text Extraction**: Uses `pdfjs-dist` to extract selectable text from PDFs
- **Content Validation**: Ensures text is readable and meets minimum length requirements
- **Chunking**: Large resumes are processed in optimized chunks for better analysis

#### 2. **AI Analysis Process**

The system sends the resume text and job title to OpenAI GPT-4 with a comprehensive prompt that requests:

**Overall Scoring (60-100 scale):**
- **85-95**: Excellent resume (top performers)
- **75-84**: Good resume (above average)
- **65-74**: Average resume (needs improvement)
- **60-64**: Needs significant improvement

**Analysis Components:**

1. **Skills Analysis**
   - **Matching Skills**: Skills present in resume that align with job requirements
   - **Missing Skills**: Critical skills for the role that are absent
   - **Suggested Skills**: Additional skills that would strengthen the resume

2. **Content Evaluation**
   - **Improvements**: Specific, actionable recommendations
   - **Rewrites**: Side-by-side comparison of original vs. improved content
   - **Keywords**: Important keywords for ATS (Applicant Tracking Systems)
   - **Impact Analysis**: Strengths, weaknesses, and recommendations

3. **Formatting Assessment**
   - **Issues**: Formatting problems that reduce readability
   - **Suggestions**: Best practices for resume structure and presentation

4. **Competitive Analysis**
   - **Market Position**: How the resume compares to industry standards
   - **Competitive Advantages**: Unique strengths
   - **Competitive Disadvantages**: Areas where competitors excel
   - **Differentiation Strategies**: Ways to stand out

5. **Industry Benchmarks**
   - **Average Score**: Typical resume score in the industry
   - **Top Performers Score**: Score of top-tier candidates
   - **Your Score**: Individual assessment

6. **Industry Analysis**
   - **Trends**: Current industry trends affecting hiring
   - **In-Demand Skills**: Skills currently sought by employers
   - **Salary Ranges**: Entry, mid, and senior level compensation
   - **Top Companies**: Leading employers in the field
   - **Growth Areas**: Emerging opportunities

7. **Career Progression Planning**
   - **Current Level Assessment**: Entry/Mid/Senior/Lead classification
   - **Next Steps**: Short-term (0-6 months), medium-term (6-18 months), long-term (18+ months) goals
   - **Skill Gaps**: Technical, soft, and industry-specific gaps
   - **Certifications**: Recommended and priority certifications
   - **Career Paths**: Primary and alternative career trajectories with requirements

#### 3. **Grading Methodology**

The AI evaluates resumes based on multiple criteria:

**Content Quality (40%)**
- Relevance to job title
- Quantifiable achievements
- Clear, concise language
- Action-oriented descriptions

**Skills Alignment (30%)**
- Match between resume skills and job requirements
- Technical competency demonstration
- Soft skills presentation

**Formatting & Structure (20%)**
- Professional appearance
- Logical organization
- ATS compatibility
- Readability

**Market Competitiveness (10%)**
- Industry standards alignment
- Differentiation factors
- Career progression clarity

#### 4. **Response Structure**

The AI returns a structured JSON object containing all analysis components, which is then:
- **Validated**: Ensures all required fields are present and scores are in valid ranges
- **Cached**: Stored for 24 hours to avoid redundant API calls
- **Displayed**: Presented in an organized, user-friendly interface

### Current AI Provider: OpenAI

**Model**: GPT-4 (via `gpt-4` API endpoint)

**Configuration**:
- Temperature: 0.3 (for consistent, focused analysis)
- Max Tokens: 4,000 (comprehensive responses)
- Retry Logic: 3 attempts with exponential backoff
- Rate Limit Handling: Automatic retry with increasing delays

**API Endpoint**: `https://api.openai.com/v1/chat/completions`

## 🏗️ Architecture

### Security Architecture

**🔒 Secure API Key Management:**
- All API keys are stored **only** on the backend server
- Frontend never directly calls AI provider APIs
- All AI requests are proxied through the backend
- API keys are never exposed to the browser or client-side code

**Request Flow:**
```
Frontend → Backend API → AI Provider (OpenAI/Anthropic/Google) → Backend → Frontend
```

### Technology Stack

**Frontend:**
- React 19.2.3
- TypeScript 4.9.5
- React Scripts 5.0.1
- PDF.js for PDF processing
- API client for backend communication

**Backend:**
- Node.js
- Express 4.22.1
- OpenAI SDK 6.16.0
- Native fetch for Anthropic & Google APIs
- CORS enabled for cross-origin requests

**Key Libraries:**
- `pdfjs-dist`: PDF text extraction
- `dotenv`: Environment variable management
- `web-vitals`: Performance monitoring

### Project Structure

```
Onboarding Project/
├── backend/                 # Express API server
│   ├── server.js          # Main server file
│   └── package.json        # Backend dependencies
│
├── onboarding-project/     # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ResumeForm.tsx
│   │   │   └── AISuggestions.tsx
│   │   ├── services/       # API services
│   │   │   ├── openai.ts
│   │   │   ├── openai-optimized.ts
│   │   │   └── cache.ts
│   │   ├── utils/          # Utility functions
│   │   │   ├── pdfOptimizer.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── envValidator.ts
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── constants/      # Configuration constants
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20.x or 22.x)
- npm 10+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Onboarding Project"
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../onboarding-project
   npm install
   ```

4. **Set up environment variables**

   **Backend** (Required - All API keys go here for security):
   
   Copy `backend/.env.example` to `backend/.env` and fill in your API keys:
   ```env
   PORT=5001
   
   # Required for OpenAI provider
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional - for Anthropic Claude provider
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # Optional - for Google Gemini provider
   GOOGLE_API_KEY=your_google_api_key_here
   ```

   **Frontend** (Optional - Only needed if backend is on different host/port):
   
   Copy `onboarding-project/.env.example` to `onboarding-project/.env`:
   ```env
   # Backend API URL (defaults to http://localhost:5001)
   REACT_APP_API_URL=http://localhost:5001
   ```

   **⚠️ Security Note**: API keys are **NOT** stored in the frontend. All AI provider calls are routed through the backend to keep your API keys secure and never expose them to the browser.

5. **Start the development servers**

   Terminal 1 - Backend (must start first):
   ```bash
   cd backend
   npm start
   ```

   Terminal 2 - Frontend:
   ```bash
   cd onboarding-project
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📈 Future Roadmap: Multi-AI Comparison

### Planned Features

1. **Multiple AI Provider Integration**
   - OpenAI GPT-4 / GPT-4 Turbo
   - Anthropic Claude (Opus, Sonnet)
   - Google Gemini Pro
   - Cohere Command
   - Azure OpenAI Service

2. **Comparative Analysis Dashboard**
   - Side-by-side score comparison
   - Consensus analysis (where all AIs agree)
   - Divergence analysis (where AIs disagree)
   - Provider-specific insights

3. **Advanced Analytics**
   - Score distribution charts
   - Recommendation overlap analysis
   - Provider reliability metrics
   - Historical comparison tracking

4. **Customizable Analysis**
   - Industry-specific evaluation criteria
   - Custom scoring weights
   - ATS optimization focus
   - Executive vs. technical resume modes

5. **Export & Reporting**
   - PDF report generation
   - Comparison charts export
   - CSV data export
   - Shareable analysis links

## 🔧 Configuration

### API Configuration

Located in `onboarding-project/src/constants/index.ts`:

```typescript
export const API_CONFIG = {
  MAX_RETRIES: 3,           // Maximum retry attempts
  RETRY_DELAY: 1000,        // Initial retry delay (ms)
  TIMEOUT: 30000,           // Request timeout (ms)
  MAX_TOKENS: 4000,         // Maximum tokens per request
  TEMPERATURE: 0.3,         // AI response temperature
  CHUNK_SIZE: 1000,         // Resume chunk size for processing
}
```

### File Processing Limits

```typescript
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024,  // 10MB
  MAX_PAGES: 10,              // Maximum PDF pages
  MAX_TEXT_LENGTH: 50000,     // Maximum extracted text length
  SUPPORTED_TYPES: ['application/pdf', 'text/plain'],
}
```

### Cache Configuration

```typescript
export const CACHE_CONFIG = {
  DURATION: 24 * 60 * 60 * 1000,  // 24 hours
}
```

## 🧪 Testing

### Run Frontend Tests
```bash
cd onboarding-project
npm test
```

### Build for Production
```bash
cd onboarding-project
npm run build
```

## 📝 API Documentation

### GET `/api/health`

Check backend health and configured providers.

**Response:**
```json
{
  "status": "ok",
  "providers": ["openai", "anthropic", "google"]
}
```

### GET `/api/providers`

Get list of configured AI providers.

**Response:**
```json
{
  "providers": ["openai", "anthropic"],
  "providerNames": {
    "openai": "OpenAI GPT-4",
    "anthropic": "Anthropic Claude",
    "google": "Google Gemini"
  }
}
```

### POST `/api/analyze/:provider`

Analyze resume with a specific provider (openai, anthropic, or google).

**Request Body:**
```json
{
  "resume": "Resume text content...",
  "jobTitle": "Software Engineer"
}
```

**Response:**
```json
{
  "provider": "openai",
  "providerName": "OpenAI GPT-4",
  "analysis": { /* ResumeAnalysis object */ },
  "responseTime": 1234,
  "timestamp": 1234567890
}
```

### POST `/api/analyze/multi`

Analyze resume with multiple providers in parallel.

**Request Body:**
```json
{
  "resume": "Resume text content...",
  "jobTitle": "Software Engineer",
  "providers": ["openai", "anthropic"] // Optional, uses all configured if omitted
}
```

**Response:**
```json
{
  "analyses": [ /* Array of ProviderAnalysis objects */ ],
  "comparison": { /* Comparison metrics */ },
  "totalTime": 2345
}
```

### POST `/api/analyze` (Legacy)

Legacy endpoint for single OpenAI analysis (backward compatibility).

**Error Responses:**
- `400`: Missing or invalid input fields, invalid provider
- `500`: Server error or API failure

## 🤝 Contributing

This is a professional project focused on resume analysis and AI comparison. Contributions that enhance:
- AI provider integrations
- Analysis accuracy
- User experience
- Performance optimization

are welcome.

## 📄 License

[Specify your license here]

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- PDF.js for PDF processing capabilities
- React team for the excellent framework

---

**Note**: This project is actively being developed to support multiple AI providers for comparative resume analysis. The current implementation serves as the foundation for the multi-AI comparison platform.
