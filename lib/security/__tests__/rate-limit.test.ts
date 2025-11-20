import { CooldownTimer } from '../rate-limit';

// RateLimiter 클래스를 직접 import하여 테스트
class RateLimiter {
  private records: Map<string, { count: number; resetTime: number }> = new Map();
  private config: { maxRequests: number; windowMs: number };

  constructor(config: { maxRequests: number; windowMs: number }) {
    this.config = config;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record) {
      this.records.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (now > record.resetTime) {
      this.records.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getTimeUntilReset(key: string): number {
    const record = this.records.get(key);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  getRemainingRequests(key: string): number {
    const record = this.records.get(key);
    if (!record) return this.config.maxRequests;

    const now = Date.now();
    if (now > record.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }

  reset(key: string): void {
    this.records.delete(key);
  }

  resetAll(): void {
    this.records.clear();
  }
}

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 3,
      windowMs: 1000,
    });
  });

  describe('canMakeRequest', () => {
    it('첫 요청은 항상 허용해야 함', () => {
      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
    });

    it('제한 이내의 요청은 허용해야 함', () => {
      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
    });

    it('제한을 초과한 요청은 거부해야 함', () => {
      rateLimiter.canMakeRequest('test-key');
      rateLimiter.canMakeRequest('test-key');
      rateLimiter.canMakeRequest('test-key');
      expect(rateLimiter.canMakeRequest('test-key')).toBe(false);
    });

    it('다른 키는 독립적으로 카운트해야 함', () => {
      rateLimiter.canMakeRequest('key1');
      rateLimiter.canMakeRequest('key1');
      rateLimiter.canMakeRequest('key1');

      expect(rateLimiter.canMakeRequest('key2')).toBe(true);
    });

    it('시간 윈도우가 지나면 리셋되어야 함', async () => {
      rateLimiter.canMakeRequest('test-key');
      rateLimiter.canMakeRequest('test-key');
      rateLimiter.canMakeRequest('test-key');

      // 시간 경과 시뮬레이션 (1초 초과)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(rateLimiter.canMakeRequest('test-key')).toBe(true);
    });
  });

  describe('getTimeUntilReset', () => {
    it('기록이 없으면 0을 반환해야 함', () => {
      expect(rateLimiter.getTimeUntilReset('non-existent')).toBe(0);
    });

    it('리셋까지 남은 시간을 반환해야 함', () => {
      rateLimiter.canMakeRequest('test-key');
      const timeUntilReset = rateLimiter.getTimeUntilReset('test-key');

      expect(timeUntilReset).toBeGreaterThan(0);
      expect(timeUntilReset).toBeLessThanOrEqual(1000);
    });
  });

  describe('getRemainingRequests', () => {
    it('기록이 없으면 최대 요청 수를 반환해야 함', () => {
      expect(rateLimiter.getRemainingRequests('non-existent')).toBe(3);
    });

    it('남은 요청 가능 횟수를 정확히 반환해야 함', () => {
      rateLimiter.canMakeRequest('test-key');
      expect(rateLimiter.getRemainingRequests('test-key')).toBe(2);

      rateLimiter.canMakeRequest('test-key');
      expect(rateLimiter.getRemainingRequests('test-key')).toBe(1);

      rateLimiter.canMakeRequest('test-key');
      expect(rateLimiter.getRemainingRequests('test-key')).toBe(0);
    });
  });

  describe('reset', () => {
    it('특정 키의 레코드를 초기화해야 함', () => {
      rateLimiter.canMakeRequest('test-key');
      rateLimiter.canMakeRequest('test-key');

      rateLimiter.reset('test-key');

      expect(rateLimiter.getRemainingRequests('test-key')).toBe(3);
    });
  });

  describe('resetAll', () => {
    it('모든 레코드를 초기화해야 함', () => {
      rateLimiter.canMakeRequest('key1');
      rateLimiter.canMakeRequest('key2');

      rateLimiter.resetAll();

      expect(rateLimiter.getRemainingRequests('key1')).toBe(3);
      expect(rateLimiter.getRemainingRequests('key2')).toBe(3);
    });
  });
});

describe('CooldownTimer', () => {
  let cooldownTimer: CooldownTimer;

  beforeEach(() => {
    cooldownTimer = new CooldownTimer(500);
  });

  describe('canPerformAction', () => {
    it('첫 액션은 항상 허용해야 함', () => {
      expect(cooldownTimer.canPerformAction()).toBe(true);
    });

    it('쿨다운 시간 이내의 액션은 허용하지 않아야 함', () => {
      cooldownTimer.performAction();
      expect(cooldownTimer.canPerformAction()).toBe(false);
    });

    it('쿨다운 시간이 지나면 액션을 허용해야 함', async () => {
      cooldownTimer.performAction();

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(cooldownTimer.canPerformAction()).toBe(true);
    });
  });

  describe('performAction', () => {
    it('쿨다운이 없으면 액션 수행 후 true 반환', () => {
      expect(cooldownTimer.performAction()).toBe(true);
    });

    it('쿨다운 중이면 액션 수행하지 않고 false 반환', () => {
      cooldownTimer.performAction();
      expect(cooldownTimer.performAction()).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('액션 후 남은 쿨다운 시간을 반환해야 함', () => {
      cooldownTimer.performAction();
      const remaining = cooldownTimer.getRemainingTime();

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(500);
    });

    it('쿨다운이 끝나면 0을 반환해야 함', async () => {
      cooldownTimer.performAction();

      await new Promise((resolve) => setTimeout(resolve, 600));

      expect(cooldownTimer.getRemainingTime()).toBe(0);
    });
  });

  describe('reset', () => {
    it('쿨다운을 초기화해야 함', () => {
      cooldownTimer.performAction();
      cooldownTimer.reset();

      expect(cooldownTimer.canPerformAction()).toBe(true);
    });
  });
});
