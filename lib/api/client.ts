import type { ApiRequestOptions, ApiResponse } from '@/types/api';
import { handleHttpError, handleNetworkError, handleTimeoutError } from './error-handler';
import { parseApiError, handleNetworkError as handleNetError, createRateLimitError, logError } from '@/lib/errors/error-handler';
import { apiRateLimiter } from '@/lib/security/rate-limit';

// API 기본 URL (환경변수에서 가져오거나 기본값 사용)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// 기본 요청 옵션
const DEFAULT_OPTIONS: ApiRequestOptions = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초
};

// 타임아웃을 적용한 fetch 래퍼
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      handleTimeoutError();
    }
    throw error;
  }
};

// API 클라이언트 함수
export const apiClient = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    method = DEFAULT_OPTIONS.method,
    headers = DEFAULT_OPTIONS.headers,
    body,
    timeout = DEFAULT_OPTIONS.timeout,
  } = { ...DEFAULT_OPTIONS, ...options };

  // Rate Limiting 체크
  const rateLimitKey = `${method}:${endpoint}`;
  if (!apiRateLimiter.canMakeRequest(rateLimitKey)) {
    const retryAfter = apiRateLimiter.getTimeUntilReset(rateLimitKey);
    const error = createRateLimitError(retryAfter);
    logError(error, `Rate limit exceeded for ${rateLimitKey}`);
    throw error;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const requestOptions: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetchWithTimeout(url, requestOptions, timeout || 30000);

    if (!response.ok) {
      const apiError = await parseApiError(response);
      logError(apiError, `API Error: ${endpoint}`);
      throw apiError;
    }

    const data: T = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    const handledError = handleNetError(error);
    logError(handledError, `Network Error: ${endpoint}`);
    throw handledError;
  }
};

// HTTP 메서드별 헬퍼 함수
export const api = {
  get: <T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};
