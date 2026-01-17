# Resume Optimizer

An AI-powered resume analysis tool that provides comprehensive feedback and optimization suggestions for job applications.

## Features

- **PDF & Text Upload**: Support for PDF and text file uploads with drag-and-drop
- **AI-Powered Analysis**: Comprehensive resume analysis using OpenAI's GPT-4
- **Skills Assessment**: Identifies matching, missing, and suggested skills
- **Market Analysis**: Provides competitive analysis and industry insights
- **Career Progression**: Suggests next steps and skill development paths
- **Caching**: Intelligent caching to avoid redundant API calls
- **Error Handling**: Robust error handling with user-friendly messages

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd onboarding-project
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Usage

1. Enter your target job title
2. Upload your resume (PDF or text format)
3. Click "Analyze Resume" to get AI-powered feedback
4. Review the comprehensive analysis including:
   - Overall score and benchmarking
   - Skills analysis
   - Market position assessment
   - Career progression suggestions
   - Formatting recommendations

## Technical Architecture

### Key Components

- **App.tsx**: Main application component with state management
- **ResumeForm.tsx**: File upload and form handling
- **AISuggestions.tsx**: Results display and visualization
- **openai-optimized.ts**: Optimized API service with single-call approach
- **cache.ts**: Intelligent caching system
- **errorHandler.ts**: Centralized error management
- **pdfOptimizer.ts**: Optimized PDF processing

### Performance Optimizations

- **Single API Call**: Reduced from N+1 calls to 1 optimized call
- **Intelligent Caching**: 24-hour cache with robust hashing
- **PDF Processing**: Optimized with timeouts and size limits
- **Error Recovery**: Automatic retry with exponential backoff

### Error Handling

- Rate limiting detection and handling
- Quota exceeded notifications
- Network error recovery
- User-friendly error messages
- Graceful degradation

## Configuration

Key configuration options in `src/constants/index.ts`:

- API settings (retries, timeouts, tokens)
- File processing limits
- Cache duration
- UI configuration

## Development

### Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Error boundaries for React components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
