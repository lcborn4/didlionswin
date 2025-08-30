// Safe fetch wrapper for static generation
// Provides fallbacks when ESPN API is unavailable during build

import { 
  fallbackSchedule, 
  fallbackSeason, 
  fallbackGameData, 
  fallbackScore, 
  fallbackStatus 
} from './api-fallbacks';

const isStaticGeneration = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'production';

export async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    // During static generation, use shorter timeout
    const timeoutMs = isStaticGeneration ? 5000 : 30000;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.warn(`API fetch failed for ${url}:`, error);
    
    // Return appropriate fallback based on URL
    if (url.includes('/teams/8/events')) {
      return createMockResponse(fallbackSchedule);
    } else if (url.includes('/seasons/')) {
      return createMockResponse(fallbackSeason);
    } else if (url.includes('/events/') && !url.includes('/score') && !url.includes('/status')) {
      return createMockResponse(fallbackGameData);
    } else if (url.includes('/score')) {
      return createMockResponse(fallbackScore);
    } else if (url.includes('/status')) {
      return createMockResponse(fallbackStatus);
    }
    
    // Generic fallback
    return createMockResponse({ error: 'API unavailable during build' });
  }
}

function createMockResponse(data: any) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data)
  } as Response;
}
