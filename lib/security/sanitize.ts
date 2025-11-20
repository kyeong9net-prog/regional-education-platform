import DOMPurify from 'dompurify';

/**
 * HTML 문자열을 새니타이징하여 XSS 공격 방지
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 기본 이스케이핑만 수행
    return escapeHtml(dirty);
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * 일반 텍스트 입력 새니타이징 (HTML 태그 모두 제거)
 */
export function sanitizeText(dirty: string): string {
  if (typeof window === 'undefined') {
    return escapeHtml(dirty);
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * 기본 HTML 이스케이핑 (서버 사이드용)
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * 파일명 새니타이징 (경로 탐색 공격 방지)
 */
export function sanitizeFilename(filename: string): string {
  // 경로 구분자 제거
  let sanitized = filename.replace(/[/\\]/g, '');

  // 특수문자 제거 (알파벳, 숫자, 한글, 공백, 하이픈, 언더스코어, 점만 허용)
  sanitized = sanitized.replace(/[^a-zA-Z0-9가-힣\s\-_.]/g, '');

  // 연속된 점 제거 (.. 경로 탐색 방지)
  sanitized = sanitized.replace(/\.{2,}/g, '.');

  // 앞뒤 공백 제거
  sanitized = sanitized.trim();

  // 최대 길이 제한
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

/**
 * URL 검증 및 새니타이징
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);

    // HTTP, HTTPS만 허용
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

/**
 * 검색 쿼리 새니타이징
 */
export function sanitizeSearchQuery(query: string): string {
  // SQL Injection 방지를 위한 특수문자 제거
  let sanitized = query.replace(/[';"\-\-\/\*]/g, '');

  // 최대 길이 제한
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  return sanitized.trim();
}
