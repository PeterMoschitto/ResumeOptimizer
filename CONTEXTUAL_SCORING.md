# Contextual Resume Scoring

## Overview

The resume analyzer now uses **contextual information** to provide fair, age-appropriate scoring. This ensures that a college student's resume is compared to other students, not to senior professionals with decades of experience.

## Why Context Matters

### The Problem
- A college student with limited experience shouldn't be scored against a 15-year industry veteran
- Entry-level candidates have different expectations than senior executives
- Industry and location can affect what's considered "competitive"

### The Solution
By providing contextual information, the AI:
- **Compares you to peers** at the same career stage
- **Adjusts benchmarks** based on your experience level
- **Provides relevant feedback** appropriate for your background
- **Scores fairly** relative to your career stage

## Context Fields

### Required Fields

1. **Experience Level**
   - Student (College/University)
   - Entry Level (0-2 years)
   - Mid Level (3-7 years)
   - Senior (8-12 years)
   - Executive/Lead (13+ years)

2. **Years of Experience**
   - 0-2 years
   - 3-5 years
   - 6-10 years
   - 11-15 years
   - 16+ years

3. **Education Level**
   - High School
   - Associate's Degree
   - Bachelor's Degree
   - Master's Degree
   - PhD/Doctorate
   - Professional Certification

### Optional Fields

4. **Industry/Sector**
   - e.g., Technology, Healthcare, Finance
   - Helps with industry-specific benchmarks

5. **Location**
   - e.g., San Francisco, CA or Remote
   - Helps with market-specific insights

## How Context Affects Scoring

### Example: College Student vs. Senior Professional

**Without Context:**
- College student resume: 65/100 (compared to all professionals)
- Senior professional resume: 85/100
- **Unfair comparison!**

**With Context:**
- College student resume: 82/100 (compared to other students)
- Senior professional resume: 78/100 (compared to other seniors)
- **Fair, peer-based comparison!**

### Scoring Adjustments

The AI adjusts scoring based on:

1. **Experience Level Expectations**
   - Students: Focus on education, projects, internships
   - Entry-level: Focus on foundational skills, learning ability
   - Mid-level: Focus on impact, leadership, technical depth
   - Senior: Focus on strategic impact, team leadership, innovation

2. **Benchmark Adjustments**
   - Industry benchmarks are adjusted for your experience level
   - "Average" for a student is different from "average" for a senior
   - Top performers in your category are identified

3. **Feedback Relevance**
   - Suggestions are appropriate for your career stage
   - A student won't be told to "demonstrate 10+ years of leadership"
   - A senior won't be told to "add your GPA"

## Implementation Details

### Frontend
- New form fields collect contextual information
- All fields are required (except industry and location)
- Data is sent to backend with resume analysis request

### Backend
- Context is included in the AI prompt
- AI is explicitly instructed to compare against peers
- Scoring methodology adjusts based on context

### AI Prompt Enhancement
The prompt now includes:
```
CONTEXT FOR FAIR COMPARISON:
- Experience Level: [Your level]
- Years of Experience: [Your years]
- Education Level: [Your education]
- Industry: [Your industry]
- Location: [Your location]

IMPORTANT: When scoring and providing benchmarks, compare this resume 
ONLY to other candidates with similar experience levels and backgrounds.
```

## Benefits

1. **Fair Scoring**: Students aren't penalized for being students
2. **Relevant Feedback**: Suggestions match your career stage
3. **Accurate Benchmarks**: Industry averages reflect your peer group
4. **Better Insights**: Career progression advice is stage-appropriate
5. **Reduced Bias**: Age and experience level don't unfairly impact scores

## Usage

1. Fill out the "Context for Fair Comparison" section in the form
2. Select your experience level, years of experience, and education
3. Optionally add industry and location
4. Upload your resume and analyze
5. Receive fair, peer-appropriate scoring and feedback

## Technical Notes

- Context is optional for backward compatibility
- If context is not provided, AI uses default (general) comparison
- Context is included in cache keys for accurate caching
- All context data is sent securely through the backend API

---

**Result**: More accurate, fair, and relevant resume analysis tailored to your career stage!
