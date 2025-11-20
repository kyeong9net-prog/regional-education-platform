// API 관련 타입 정의

// 공통 API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// API 에러 타입
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 페이지네이션 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 페이지네이션이 포함된 응답 타입
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

// API 요청 상태 타입
export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

// API 요청 옵션
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}
