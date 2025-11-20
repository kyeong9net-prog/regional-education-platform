/**
 * 한글 초성 검색 유틸리티
 * 간단한 매핑 테이블을 사용하여 초성 검색을 지원합니다.
 */

// 한글 초성 목록
const CHO_SEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자의 초성을 추출합니다.
 */
const getChoSeong = (char: string): string => {
  const code = char.charCodeAt(0);
  // 한글 유니코드 범위: 0xAC00(가) ~ 0xD7A3(힣)
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const index = Math.floor((code - 0xAC00) / 588);
    return CHO_SEONG[index];
  }
  return char;
};

/**
 * 문자열의 초성을 추출합니다.
 */
export const extractChoSeong = (text: string): string => {
  return text.split('').map(getChoSeong).join('');
};

/**
 * 초성 검색을 수행합니다.
 * @param text 검색 대상 텍스트
 * @param query 검색어 (초성 또는 일반 문자)
 * @returns 일치 여부
 */
export const matchesChoSeong = (text: string, query: string): boolean => {
  if (!query) return true;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // 일반 문자열 검색
  if (lowerText.includes(lowerQuery)) {
    return true;
  }

  // 초성 검색
  const choSeong = extractChoSeong(text);
  return choSeong.includes(query);
};

/**
 * 여러 필드에서 검색을 수행합니다.
 */
export const searchInFields = (fields: string[], query: string): boolean => {
  if (!query) return true;

  return fields.some(field => matchesChoSeong(field, query));
};
