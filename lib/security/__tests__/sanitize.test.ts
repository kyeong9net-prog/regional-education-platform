import {
  sanitizeHtml,
  sanitizeText,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeSearchQuery,
} from '../sanitize';

// Mock DOMPurify for tests
jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((dirty: string, config?: any) => {
      if (config?.ALLOWED_TAGS?.length === 0) {
        // Remove all HTML tags for sanitizeText
        return dirty.replace(/<[^>]*>/g, '');
      }
      // For sanitizeHtml, remove dangerous tags but keep safe ones
      return dirty
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    }),
  },
}));

describe('sanitize utilities', () => {
  describe('sanitizeHtml', () => {
    it('위험한 스크립트 태그를 제거해야 함', () => {
      const input = '<p>Safe content</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('안전한 태그는 유지해야 함', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });
  });

  describe('sanitizeText', () => {
    it('모든 HTML 태그를 제거해야 함', () => {
      const input = '<p>Hello</p><script>alert(1)</script>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('일반 텍스트는 유지해야 함', () => {
      const input = 'Hello World';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeFilename', () => {
    it('경로 구분자를 제거해야 함', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFilename(input);
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
    });

    it('연속된 점을 제거해야 함', () => {
      const input = 'file...txt';
      const result = sanitizeFilename(input);
      expect(result).toBe('file.txt');
    });

    it('특수문자를 제거해야 함', () => {
      const input = 'file@#$%name.txt';
      const result = sanitizeFilename(input);
      expect(result).toBe('filename.txt');
    });

    it('한글 파일명은 허용해야 함', () => {
      const input = '파일_이름-123.txt';
      const result = sanitizeFilename(input);
      expect(result).toBe('파일_이름-123.txt');
    });

    it('255자를 초과하는 파일명을 잘라야 함', () => {
      const input = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(input);
      expect(result.length).toBe(255);
    });

    it('앞뒤 공백을 제거해야 함', () => {
      const input = '  filename.txt  ';
      const result = sanitizeFilename(input);
      expect(result).toBe('filename.txt');
    });
  });

  describe('sanitizeUrl', () => {
    it('유효한 HTTP URL을 허용해야 함', () => {
      const input = 'http://example.com';
      const result = sanitizeUrl(input);
      expect(result).toBe('http://example.com/');
    });

    it('유효한 HTTPS URL을 허용해야 함', () => {
      const input = 'https://example.com/path?query=1';
      const result = sanitizeUrl(input);
      expect(result).toBe('https://example.com/path?query=1');
    });

    it('javascript: 프로토콜을 거부해야 함', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });

    it('data: 프로토콜을 거부해야 함', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });

    it('잘못된 URL 형식을 거부해야 함', () => {
      const input = 'not a url';
      const result = sanitizeUrl(input);
      expect(result).toBeNull();
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('SQL Injection 특수문자를 제거해야 함', () => {
      const input = "'; DROP TABLE users; --";
      const result = sanitizeSearchQuery(input);
      expect(result).not.toContain("'");
      expect(result).not.toContain('"');
      expect(result).not.toContain('--');
    });

    it('100자를 초과하는 쿼리를 잘라야 함', () => {
      const input = 'a'.repeat(150);
      const result = sanitizeSearchQuery(input);
      expect(result.length).toBe(100);
    });

    it('앞뒤 공백을 제거해야 함', () => {
      const input = '  search query  ';
      const result = sanitizeSearchQuery(input);
      expect(result).toBe('search query');
    });

    it('일반 검색어는 유지해야 함', () => {
      const input = '서울 교육';
      const result = sanitizeSearchQuery(input);
      expect(result).toBe('서울 교육');
    });
  });
});
