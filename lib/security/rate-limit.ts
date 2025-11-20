/**
 * Rate Limiting 유틸리티 (클라이언트 사이드)
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private records: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }) {
    this.config = config;
  }

  /**
   * 요청이 허용되는지 확인
   */
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

    // 시간 윈도우가 지났으면 리셋
    if (now > record.resetTime) {
      this.records.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return true;
    }

    // 제한을 초과했는지 확인
    if (record.count >= this.config.maxRequests) {
      return false;
    }

    // 카운트 증가
    record.count++;
    return true;
  }

  /**
   * 다음 요청까지 남은 시간 (밀리초)
   */
  getTimeUntilReset(key: string): number {
    const record = this.records.get(key);
    if (!record) return 0;

    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  /**
   * 남은 요청 가능 횟수
   */
  getRemainingRequests(key: string): number {
    const record = this.records.get(key);
    if (!record) return this.config.maxRequests;

    const now = Date.now();
    if (now > record.resetTime) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - record.count);
  }

  /**
   * 레코드 초기화
   */
  reset(key: string): void {
    this.records.delete(key);
  }

  /**
   * 모든 레코드 초기화
   */
  resetAll(): void {
    this.records.clear();
  }
}

// 전역 Rate Limiter 인스턴스
export const apiRateLimiter = new RateLimiter({
  maxRequests: 30, // 1분당 30회
  windowMs: 60000,
});

export const generateRateLimiter = new RateLimiter({
  maxRequests: 5, // 1분당 5회
  windowMs: 60000,
});

export const searchRateLimiter = new RateLimiter({
  maxRequests: 20, // 1분당 20회
  windowMs: 60000,
});

/**
 * Cooldown 타이머
 */
export class CooldownTimer {
  private lastAction: number = 0;
  private cooldownMs: number;

  constructor(cooldownMs: number = 1000) {
    this.cooldownMs = cooldownMs;
  }

  /**
   * 액션이 허용되는지 확인
   */
  canPerformAction(): boolean {
    const now = Date.now();
    if (now - this.lastAction < this.cooldownMs) {
      return false;
    }
    return true;
  }

  /**
   * 액션 수행 및 타이머 업데이트
   */
  performAction(): boolean {
    if (!this.canPerformAction()) {
      return false;
    }

    this.lastAction = Date.now();
    return true;
  }

  /**
   * 남은 쿨다운 시간 (밀리초)
   */
  getRemainingTime(): number {
    const now = Date.now();
    return Math.max(0, this.cooldownMs - (now - this.lastAction));
  }

  /**
   * 쿨다운 리셋
   */
  reset(): void {
    this.lastAction = 0;
  }
}

// 쿨다운 타이머 인스턴스
export const buttonCooldown = new CooldownTimer(500); // 버튼 중복 클릭 방지
export const submitCooldown = new CooldownTimer(2000); // 폼 제출 중복 방지
