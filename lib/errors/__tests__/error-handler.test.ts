import {
  ErrorType,
  AppError,
  getUserFriendlyMessage,
  createRateLimitError,
  logError,
} from '../error-handler';

describe('error-handler', () => {
  describe('AppError', () => {
    it('AppError 인스턴스를 생성해야 함', () => {
      const error = new AppError(
        ErrorType.VALIDATION_ERROR,
        'Invalid input',
        400,
        { field: 'email' }
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe(ErrorType.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('AppError');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('VALIDATION_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(
        ErrorType.VALIDATION_ERROR,
        'Custom validation message'
      );
      const message = getUserFriendlyMessage(error);

      expect(message).toBe('Custom validation message');
    });

    it('AUTHENTICATION_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(
        ErrorType.AUTHENTICATION_ERROR,
        'Unauthorized'
      );
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('로그인');
    });

    it('RATE_LIMIT_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(ErrorType.RATE_LIMIT_ERROR, 'Too many requests');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('요청이 너무 많습니다');
    });

    it('NETWORK_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(ErrorType.NETWORK_ERROR, 'Network failed');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('네트워크');
    });

    it('SERVER_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(ErrorType.SERVER_ERROR, 'Server error');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('서버');
    });

    it('AUTHORIZATION_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(ErrorType.AUTHORIZATION_ERROR, 'Forbidden');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('접근 권한');
    });

    it('NOT_FOUND_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(ErrorType.NOT_FOUND_ERROR, 'Not found');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('찾을 수 없습니다');
    });

    it('UNKNOWN_ERROR에 대한 사용자 친화적 메시지 반환', () => {
      const error = new AppError(ErrorType.UNKNOWN_ERROR, 'Unknown');
      const message = getUserFriendlyMessage(error);

      expect(message).toContain('오류가 발생했습니다');
    });

    it('일반 Error 객체에 대한 기본 메시지 반환', () => {
      const error = new Error('Generic error');
      const message = getUserFriendlyMessage(error);

      expect(message).toBe('Generic error');
    });

    it('문자열 에러에 대한 기본 메시지 반환', () => {
      const message = getUserFriendlyMessage('String error');

      expect(message).toBe('오류가 발생했습니다.');
    });

    it('null/undefined 에러에 대한 기본 메시지 반환', () => {
      expect(getUserFriendlyMessage(null)).toBe('오류가 발생했습니다.');
      expect(getUserFriendlyMessage(undefined)).toBe('오류가 발생했습니다.');
    });
  });

  describe('createRateLimitError', () => {
    it('Rate Limit 에러를 생성해야 함', () => {
      const error = createRateLimitError(30000);

      expect(error).toBeInstanceOf(AppError);
      expect(error.type).toBe(ErrorType.RATE_LIMIT_ERROR);
      expect(error.statusCode).toBe(429);
      expect(error.message).toContain('30');
    });

    it('retryAfter가 0이면 기본 메시지 사용', () => {
      const error = createRateLimitError(0);

      expect(error.message).toContain('너무 많은 요청입니다');
    });
  });

  describe('logError', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeAll(() => {
      // Mock NODE_ENV before tests
      delete (process.env as any).NODE_ENV;
      (process.env as any).NODE_ENV = 'development';
    });

    afterAll(() => {
      // Restore NODE_ENV after tests
      delete (process.env as any).NODE_ENV;
      if (originalEnv) {
        (process.env as any).NODE_ENV = originalEnv;
      }
    });

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('개발 환경에서 에러를 콘솔에 로그해야 함', () => {
      const error = new AppError(ErrorType.VALIDATION_ERROR, 'Test error');
      logError(error, 'Test context');

      expect(console.error).toHaveBeenCalledWith('[Error]', 'Test context', error);
    });

    it('컨텍스트와 함께 에러를 로그해야 함', () => {
      const error = new Error('Generic error');
      logError(error, 'API Call Failed');

      expect(console.error).toHaveBeenCalledWith(
        '[Error]',
        'API Call Failed',
        error
      );
    });

    it('AppError의 세부 정보도 로그해야 함', () => {
      const error = new AppError(
        ErrorType.VALIDATION_ERROR,
        'Validation failed',
        400,
        { field: 'email', reason: 'invalid format' }
      );
      logError(error, 'Form Validation');

      expect(console.error).toHaveBeenCalled();
    });
  });
});
