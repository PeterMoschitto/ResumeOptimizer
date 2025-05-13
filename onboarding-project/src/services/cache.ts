import { ResumeAnalysis } from '../types';

interface CacheEntry {
  data: ResumeAnalysis;
  timestamp: number;
}

class ResumeAnalysisCache {
  private static instance: ResumeAnalysisCache;
  private cache: Map<string, CacheEntry>;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): ResumeAnalysisCache {
    if (!ResumeAnalysisCache.instance) {
      ResumeAnalysisCache.instance = new ResumeAnalysisCache();
    }
    return ResumeAnalysisCache.instance;
  }

  private generateKey(resume: string, jobTitle: string): string {
    // Create a simple hash of the resume content and job title
    const content = resume + jobTitle;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  public get(resume: string, jobTitle: string): ResumeAnalysis | null {
    const key = this.generateKey(resume, jobTitle);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if the cache entry has expired
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public set(resume: string, jobTitle: string, data: ResumeAnalysis): void {
    const key = this.generateKey(resume, jobTitle);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public remove(resume: string, jobTitle: string): void {
    const key = this.generateKey(resume, jobTitle);
    this.cache.delete(key);
  }
}

export const resumeCache = ResumeAnalysisCache.getInstance(); 