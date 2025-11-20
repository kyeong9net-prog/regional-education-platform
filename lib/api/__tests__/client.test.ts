import { apiClient, api } from '../client';
import { apiRateLimiter } from '@/lib/security/rate-limit';
import { ErrorType } from '@/lib/errors/error-handler';

// Mock fetch
global.fetch = jest.fn();

describe('API Client Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiRateLimiter.resetAll();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('apiClient', () => {
    it('성공적인 GET 요청을 처리해야 함', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiClient('/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('POST 요청시 body를 JSON으로 변환해야 함', async () => {
      const mockData = { success: true };
      const requestBody = { name: 'New Item' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await apiClient('/test', {
        method: 'POST',
        body: requestBody,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('커스텀 헤더를 포함해야 함', async () => {
      const mockData = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await apiClient('/test', {
        headers: {
          'Content-Type': 'application/json',
          'Custom-Header': 'value',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Custom-Header': 'value',
          }),
        })
      );
    });

    it('기본 타임아웃 설정이 적용되어야 함', async () => {
      const mockData = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      await apiClient('/test');

      // fetch가 호출될 때 signal이 포함되어야 함
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: expect.any(Object),
        })
      );
    });

    it('Rate limit 초과 시 에러를 throw해야 함', async () => {
      const mockData = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // Rate limit 설정: 30회까지 허용
      const promises = [];
      for (let i = 0; i < 31; i++) {
        promises.push(
          apiClient('/test').catch((error) => error)
        );
      }

      const results = await Promise.all(promises);
      const lastResult = results[results.length - 1];

      expect(lastResult.type).toBe(ErrorType.RATE_LIMIT_ERROR);
    });

    it('400 에러 응답을 VALIDATION_ERROR로 처리해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid input' }),
      });

      await expect(apiClient('/test')).rejects.toMatchObject({
        type: ErrorType.VALIDATION_ERROR,
        statusCode: 400,
      });
    });

    it('401 에러 응답을 AUTHENTICATION_ERROR로 처리해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(apiClient('/test')).rejects.toMatchObject({
        type: ErrorType.AUTHENTICATION_ERROR,
        statusCode: 401,
      });
    });

    it('404 에러 응답을 NOT_FOUND_ERROR로 처리해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(apiClient('/test')).rejects.toMatchObject({
        type: ErrorType.NOT_FOUND_ERROR,
        statusCode: 404,
      });
    });

    it('500 에러 응답을 SERVER_ERROR로 처리해야 함', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(apiClient('/test')).rejects.toMatchObject({
        type: ErrorType.SERVER_ERROR,
        statusCode: 500,
      });
    });

    it('네트워크 에러를 NETWORK_ERROR로 처리해야 함', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(apiClient('/test')).rejects.toMatchObject({
        type: ErrorType.NETWORK_ERROR,
      });
    });
  });

  describe('api helper methods', () => {
    it('api.get이 GET 요청을 수행해야 함', async () => {
      const mockData = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.get('/test');

      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('api.post가 POST 요청을 수행해야 함', async () => {
      const mockData = { id: 1 };
      const body = { name: 'test' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.post('/test', body);

      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('api.put이 PUT 요청을 수행해야 함', async () => {
      const mockData = { updated: true };
      const body = { name: 'updated' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.put('/test', body);

      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    it('api.patch가 PATCH 요청을 수행해야 함', async () => {
      const mockData = { patched: true };
      const body = { field: 'value' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.patch('/test', body);

      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('api.delete가 DELETE 요청을 수행해야 함', async () => {
      const mockData = { deleted: true };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.delete('/test');

      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Rate Limiting Integration', () => {
    it('연속 요청 시 rate limit이 적용되어야 함', async () => {
      const mockData = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // 30개의 요청은 성공해야 함
      const successPromises = Array(30)
        .fill(null)
        .map(() => apiClient('/test'));

      const results = await Promise.all(successPromises);
      expect(results.every((r) => r.success)).toBe(true);

      // 31번째 요청은 rate limit에 걸려야 함
      await expect(apiClient('/test')).rejects.toMatchObject({
        type: ErrorType.RATE_LIMIT_ERROR,
      });
    });

    it('시간이 지나면 rate limit이 리셋되어야 함', async () => {
      const mockData = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // 30개 요청 (limit 도달)
      await Promise.all(
        Array(30)
          .fill(null)
          .map(() => apiClient('/test'))
      );

      // Rate limit에 걸림
      await expect(apiClient('/test')).rejects.toMatchObject({
        type: ErrorType.RATE_LIMIT_ERROR,
      });

      // 1분 경과
      jest.advanceTimersByTime(61000);

      // 다시 요청 가능해야 함
      const result = await apiClient('/test');
      expect(result.success).toBe(true);
    });
  });
});
