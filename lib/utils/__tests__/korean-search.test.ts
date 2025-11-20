import {
  extractChoSeong,
  matchesChoSeong,
  searchInFields,
} from '../korean-search';

describe('korean-search utilities', () => {
  describe('extractChoSeong', () => {
    it('한글 문자열의 초성을 추출해야 함', () => {
      expect(extractChoSeong('서울')).toBe('ㅅㅇ');
      expect(extractChoSeong('부산')).toBe('ㅂㅅ');
      expect(extractChoSeong('대구')).toBe('ㄷㄱ');
    });

    it('복합 문자열의 초성을 추출해야 함', () => {
      expect(extractChoSeong('서울특별시')).toBe('ㅅㅇㅌㅂㅅ');
      expect(extractChoSeong('경기도')).toBe('ㄱㄱㄷ');
    });

    it('한글이 아닌 문자는 그대로 유지해야 함', () => {
      expect(extractChoSeong('서울123')).toBe('ㅅㅇ123');
      expect(extractChoSeong('Seoul서울')).toBe('Seoulㅅㅇ');
    });

    it('빈 문자열은 빈 문자열을 반환해야 함', () => {
      expect(extractChoSeong('')).toBe('');
    });

    it('영문자는 그대로 반환해야 함', () => {
      expect(extractChoSeong('ABC')).toBe('ABC');
    });

    it('숫자는 그대로 반환해야 함', () => {
      expect(extractChoSeong('123')).toBe('123');
    });

    it('특수문자는 그대로 반환해야 함', () => {
      expect(extractChoSeong('!@#')).toBe('!@#');
    });

    it('쌍자음을 포함한 한글의 초성을 올바르게 추출해야 함', () => {
      expect(extractChoSeong('까치')).toBe('ㄲㅊ');
      expect(extractChoSeong('똘이')).toBe('ㄸㅇ');
    });
  });

  describe('matchesChoSeong', () => {
    it('빈 쿼리는 항상 true를 반환해야 함', () => {
      expect(matchesChoSeong('서울', '')).toBe(true);
      expect(matchesChoSeong('부산', '')).toBe(true);
    });

    it('일반 문자열 검색이 작동해야 함', () => {
      expect(matchesChoSeong('서울특별시', '서울')).toBe(true);
      expect(matchesChoSeong('서울특별시', '특별')).toBe(true);
      expect(matchesChoSeong('서울특별시', '부산')).toBe(false);
    });

    it('초성 검색이 작동해야 함', () => {
      expect(matchesChoSeong('서울특별시', 'ㅅㅇ')).toBe(true);
      expect(matchesChoSeong('서울특별시', 'ㅌㅂ')).toBe(true);
      expect(matchesChoSeong('부산광역시', 'ㅂㅅ')).toBe(true);
    });

    it('대소문자를 구분하지 않아야 함', () => {
      expect(matchesChoSeong('Seoul', 'seoul')).toBe(true);
      expect(matchesChoSeong('SEOUL', 'seoul')).toBe(true);
    });

    it('부분 일치를 지원해야 함', () => {
      expect(matchesChoSeong('서울특별시', '울')).toBe(true);
      expect(matchesChoSeong('서울특별시', '별시')).toBe(true);
    });

    it('일치하지 않으면 false를 반환해야 함', () => {
      expect(matchesChoSeong('서울', '부산')).toBe(false);
      expect(matchesChoSeong('서울', 'ㅂㅅ')).toBe(false);
    });

    it('숫자가 포함된 문자열 검색이 작동해야 함', () => {
      expect(matchesChoSeong('2024년', '2024')).toBe(true);
      expect(matchesChoSeong('2024년', '년')).toBe(true);
    });

    it('공백이 포함된 문자열 검색이 작동해야 함', () => {
      expect(matchesChoSeong('서울 특별시', '서울')).toBe(true);
      expect(matchesChoSeong('서울 특별시', '특별')).toBe(true);
    });
  });

  describe('searchInFields', () => {
    it('빈 쿼리는 항상 true를 반환해야 함', () => {
      expect(searchInFields(['서울', '부산'], '')).toBe(true);
    });

    it('여러 필드 중 하나라도 일치하면 true를 반환해야 함', () => {
      const fields = ['서울특별시', '수도권', '대한민국'];
      expect(searchInFields(fields, '서울')).toBe(true);
      expect(searchInFields(fields, '수도')).toBe(true);
      expect(searchInFields(fields, '대한민국')).toBe(true);
    });

    it('초성 검색이 여러 필드에서 작동해야 함', () => {
      const fields = ['서울특별시', '부산광역시', '대구광역시'];
      expect(searchInFields(fields, 'ㅅㅇ')).toBe(true);
      expect(searchInFields(fields, 'ㅂㅅ')).toBe(true);
      expect(searchInFields(fields, 'ㄷㄱ')).toBe(true);
    });

    it('모든 필드가 일치하지 않으면 false를 반환해야 함', () => {
      const fields = ['서울', '부산', '대구'];
      expect(searchInFields(fields, '인천')).toBe(false);
      expect(searchInFields(fields, 'ㅇㅊ')).toBe(false);
    });

    it('빈 배열은 false를 반환해야 함', () => {
      expect(searchInFields([], '서울')).toBe(false);
    });

    it('혼합 타입 필드에서 검색이 작동해야 함', () => {
      const fields = ['서울', '2024', 'Seoul'];
      expect(searchInFields(fields, '서울')).toBe(true);
      expect(searchInFields(fields, '2024')).toBe(true);
      expect(searchInFields(fields, 'Seoul')).toBe(true);
    });
  });
});
