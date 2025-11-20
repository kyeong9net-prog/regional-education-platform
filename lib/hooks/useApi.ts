import { useState, useCallback } from 'react';
import type { ApiResponse, ApiStatus } from '@/types/api';
import { ApiException } from '@/lib/api/error-handler';

// useApi 훅의 반환 타입
export interface UseApiReturn<T> {
  data: T | null;
  error: ApiException | null;
  status: ApiStatus;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

// useApi 훅
export function useApi<T>(
  apiFunction: (...args: unknown[]) => Promise<ApiResponse<T>>
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiException | null>(null);
  const [status, setStatus] = useState<ApiStatus>('idle');

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      try {
        setStatus('loading');
        setError(null);

        const response = await apiFunction(...args);

        if (response.success && response.data) {
          setData(response.data);
          setStatus('success');
          return response.data;
        } else {
          throw new ApiException(
            response.error?.code || 'UNKNOWN_ERROR',
            response.error?.message || '알 수 없는 오류가 발생했습니다.',
            response.error?.details
          );
        }
      } catch (err) {
        const apiError = err instanceof ApiException
          ? err
          : new ApiException('UNEXPECTED_ERROR', '예상치 못한 오류가 발생했습니다.');

        setError(apiError);
        setStatus('error');
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setStatus('idle');
  }, []);

  return {
    data,
    error,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    execute,
    reset,
  };
}
