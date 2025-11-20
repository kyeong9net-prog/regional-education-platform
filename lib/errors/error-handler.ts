/**
 * 전역 에러 핸들러 및 에러 타입 정의
 */

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 사용자 친화적 에러 메시지 생성
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return error.message || '입력하신 정보를 확인해주세요.';
      case ErrorType.AUTHENTICATION_ERROR:
        return '로그인이 필요한 서비스입니다.';
      case ErrorType.AUTHORIZATION_ERROR:
        return '접근 권한이 없습니다.';
      case ErrorType.NOT_FOUND_ERROR:
        return '요청하신 정보를 찾을 수 없습니다.';
      case ErrorType.RATE_LIMIT_ERROR:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      case ErrorType.NETWORK_ERROR:
        return '네트워크 연결을 확인해주세요.';
      case ErrorType.SERVER_ERROR:
        return '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  }

  if (error instanceof Error) {
    return error.message || '오류가 발생했습니다.';
  }

  return '오류가 발생했습니다.';
}

/**
 * API 에러 응답 파싱
 */
export async function parseApiError(response: Response): Promise<AppError> {
  const statusCode = response.status;

  try {
    const data = await response.json();
    const message = data.message || data.error || '서버 오류가 발생했습니다.';

    switch (statusCode) {
      case 400:
        return new AppError(ErrorType.VALIDATION_ERROR, message, statusCode, data);
      case 401:
        return new AppError(ErrorType.AUTHENTICATION_ERROR, message, statusCode, data);
      case 403:
        return new AppError(ErrorType.AUTHORIZATION_ERROR, message, statusCode, data);
      case 404:
        return new AppError(ErrorType.NOT_FOUND_ERROR, message, statusCode, data);
      case 429:
        return new AppError(ErrorType.RATE_LIMIT_ERROR, message, statusCode, data);
      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError(ErrorType.SERVER_ERROR, message, statusCode, data);
      default:
        return new AppError(ErrorType.UNKNOWN_ERROR, message, statusCode, data);
    }
  } catch {
    // JSON 파싱 실패 시
    return new AppError(
      ErrorType.SERVER_ERROR,
      `서버 오류 (${statusCode})`,
      statusCode
    );
  }
}

/**
 * 네트워크 에러 처리
 */
export function handleNetworkError(error: unknown): AppError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      ErrorType.NETWORK_ERROR,
      '네트워크 연결을 확인해주세요.'
    );
  }

  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    ErrorType.UNKNOWN_ERROR,
    error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
  );
}

/**
 * 에러 로깅 (개발 환경에서만)
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', context || 'Unknown context', error);
  }

  // 프로덕션 환경에서는 여기에 에러 추적 서비스 (Sentry 등) 연동
}

/**
 * Validation 에러를 AppError로 변환
 */
export function createValidationError(message: string, details?: unknown): AppError {
  return new AppError(ErrorType.VALIDATION_ERROR, message, 400, details);
}

/**
 * Rate Limit 에러 생성
 */
export function createRateLimitError(retryAfterMs?: number): AppError {
  const message = retryAfterMs
    ? `너무 많은 요청입니다. ${Math.ceil(retryAfterMs / 1000)}초 후 다시 시도해주세요.`
    : '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';

  return new AppError(ErrorType.RATE_LIMIT_ERROR, message, 429, { retryAfterMs });
}
