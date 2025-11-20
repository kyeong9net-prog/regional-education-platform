import type { ApiError } from '@/types/api';

// API 에러 클래스
export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
  }

  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

// HTTP 상태 코드에 따른 에러 메시지
const getErrorMessage = (status: number): string => {
  switch (status) {
    case 400:
      return '잘못된 요청입니다.';
    case 401:
      return '인증이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 500:
      return '서버 오류가 발생했습니다.';
    case 503:
      return '서비스를 일시적으로 사용할 수 없습니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
};

// HTTP 응답 에러 처리
export const handleHttpError = async (response: Response): Promise<never> => {
  const status = response.status;
  let errorData: ApiError | null = null;

  try {
    errorData = await response.json();
  } catch {
    // JSON 파싱 실패 시 기본 메시지 사용
  }

  throw new ApiException(
    errorData?.code || `HTTP_${status}`,
    errorData?.message || getErrorMessage(status),
    errorData?.details
  );
};

// 네트워크 에러 처리
export const handleNetworkError = (error: Error): never => {
  if (error instanceof ApiException) {
    throw error;
  }

  throw new ApiException(
    'NETWORK_ERROR',
    '네트워크 연결을 확인해주세요.',
    { originalError: error.message }
  );
};

// 타임아웃 에러 처리
export const handleTimeoutError = (): never => {
  throw new ApiException(
    'TIMEOUT_ERROR',
    '요청 시간이 초과되었습니다. 다시 시도해주세요.'
  );
};
