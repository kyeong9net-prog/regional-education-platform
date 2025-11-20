/**
 * 카테고리 매핑 테스트
 */

import {
  getCategoryMapping,
  analyzeCategoryRequirements,
  CATEGORY_MAPPINGS,
  type TemplatePlaceholder,
  type CategoryRequirement,
} from '../category-mapping';

describe('category-mapping', () => {
  describe('getCategoryMapping()', () => {
    // ✅ 성공 케이스 - 존재하는 카테고리 조회
    describe('존재하는 카테고리 조회', () => {
      it('NATURAL_SITE 카테고리를 올바르게 반환해야 함', () => {
        const result = getCategoryMapping('NATURAL_SITE');
        expect(result).toEqual({
          contentTypeId: '12',
          pageNo: 1,
          displayName: '자연명소',
        });
      });

      it('EDU_SITE 카테고리를 올바르게 반환해야 함', () => {
        const result = getCategoryMapping('EDU_SITE');
        expect(result).toEqual({
          contentTypeId: '14',
          pageNo: 1,
          displayName: '교육시설',
        });
      });

      it('CULTURE_SITE 카테고리를 올바르게 반환해야 함', () => {
        const result = getCategoryMapping('CULTURE_SITE');
        expect(result).toEqual({
          contentTypeId: '14',
          pageNo: 1,
          displayName: '문화시설',
        });
      });

      it('MARKETPLACE 카테고리를 올바르게 반환해야 함', () => {
        const result = getCategoryMapping('MARKETPLACE');
        expect(result).toEqual({
          contentTypeId: '38',
          pageNo: 2,
          displayName: '전통시장',
        });
      });

      it('HISTORICAL_SITE 카테고리를 올바르게 반환해야 함', () => {
        const result = getCategoryMapping('HISTORICAL_SITE');
        expect(result).toEqual({
          contentTypeId: '12',
          pageNo: 3,
          displayName: '역사유적',
        });
      });

      it('오타가 있는 HISTOIRCAL_SITE도 지원해야 함', () => {
        const result = getCategoryMapping('HISTOIRCAL_SITE');
        expect(result).toEqual({
          contentTypeId: '12',
          pageNo: 3,
          displayName: '역사유적',
        });
      });
    });

    // ❌ 실패 케이스 - 존재하지 않는 카테고리
    describe('존재하지 않는 카테고리', () => {
      it('알 수 없는 카테고리는 null을 반환해야 함', () => {
        const result = getCategoryMapping('UNKNOWN_CATEGORY');
        expect(result).toBeNull();
      });

      it('빈 문자열은 null을 반환해야 함', () => {
        const result = getCategoryMapping('');
        expect(result).toBeNull();
      });

      it('대소문자가 다른 경우 null을 반환해야 함', () => {
        const result = getCategoryMapping('natural_site'); // 소문자
        expect(result).toBeNull();
      });
    });
  });

  describe('analyzeCategoryRequirements()', () => {
    // ✅ 성공 케이스 - 카테고리 개수 집계
    describe('카테고리 개수 집계', () => {
      it('같은 카테고리가 여러 개 있으면 개수를 집계해야 함', () => {
        const placeholders: TemplatePlaceholder[] = [
          {
            placeholder: '{{NATURAL_SITE_IMAGE_1}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 1,
            slideNumber: 1,
          },
          {
            placeholder: '{{NATURAL_SITE_IMAGE_2}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 2,
            slideNumber: 2,
          },
        ];

        const result = analyzeCategoryRequirements(placeholders);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          category: 'NATURAL_SITE',
          count: 2,
          mapping: {
            contentTypeId: '12',
            pageNo: 1,
            displayName: '자연명소',
          },
        });
      });

      it('다양한 카테고리를 올바르게 집계해야 함', () => {
        const placeholders: TemplatePlaceholder[] = [
          {
            placeholder: '{{NATURAL_SITE_IMAGE_1}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 1,
            slideNumber: 1,
          },
          {
            placeholder: '{{NATURAL_SITE_IMAGE_2}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 2,
            slideNumber: 2,
          },
          {
            placeholder: '{{EDU_SITE_IMAGE_1}}',
            type: 'IMAGE',
            category: 'EDU_SITE',
            index: 1,
            slideNumber: 3,
          },
          {
            placeholder: '{{EDU_SITE_IMAGE_2}}',
            type: 'IMAGE',
            category: 'EDU_SITE',
            index: 2,
            slideNumber: 4,
          },
          {
            placeholder: '{{EDU_SITE_IMAGE_3}}',
            type: 'IMAGE',
            category: 'EDU_SITE',
            index: 3,
            slideNumber: 5,
          },
        ];

        const result = analyzeCategoryRequirements(placeholders);

        expect(result).toHaveLength(2);

        // NATURAL_SITE 확인
        const naturalSite = result.find((r) => r.category === 'NATURAL_SITE');
        expect(naturalSite).toBeDefined();
        expect(naturalSite?.count).toBe(2);

        // EDU_SITE 확인
        const eduSite = result.find((r) => r.category === 'EDU_SITE');
        expect(eduSite).toBeDefined();
        expect(eduSite?.count).toBe(3);
      });
    });

    // ✅ TEXT 타입 제외
    describe('TEXT 타입 제외', () => {
      it('IMAGE 타입만 집계하고 TEXT 타입은 제외해야 함', () => {
        const placeholders: TemplatePlaceholder[] = [
          {
            placeholder: '{{NATURAL_SITE_IMAGE_1}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 1,
            slideNumber: 1,
          },
          {
            placeholder: '{{NATURAL_SITE_IMAGE_2}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 2,
            slideNumber: 2,
          },
          {
            placeholder: '{{PLACE_NAME_1}}',
            type: 'TEXT',
            category: 'NATURAL_SITE',
            index: 1,
            slideNumber: 1,
          },
        ];

        const result = analyzeCategoryRequirements(placeholders);

        expect(result).toHaveLength(1);
        expect(result[0].count).toBe(2); // TEXT는 제외되어 2개만
      });

      it('TEXT만 있으면 빈 배열을 반환해야 함', () => {
        const placeholders: TemplatePlaceholder[] = [
          {
            placeholder: '{{PLACE_NAME_1}}',
            type: 'TEXT',
            category: 'NATURAL_SITE',
            index: 1,
            slideNumber: 1,
          },
          {
            placeholder: '{{PLACE_NAME_2}}',
            type: 'TEXT',
            category: 'EDU_SITE',
            index: 1,
            slideNumber: 2,
          },
        ];

        const result = analyzeCategoryRequirements(placeholders);

        expect(result).toHaveLength(0);
      });
    });

    // ❌ 실패 케이스 - 알 수 없는 카테고리
    describe('알 수 없는 카테고리 처리', () => {
      it('알 수 없는 카테고리는 무시하고 console.warn을 호출해야 함', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const placeholders: TemplatePlaceholder[] = [
          {
            placeholder: '{{UNKNOWN_IMAGE_1}}',
            type: 'IMAGE',
            category: 'UNKNOWN_CATEGORY',
            index: 1,
            slideNumber: 1,
          },
          {
            placeholder: '{{NATURAL_SITE_IMAGE_1}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 1,
            slideNumber: 2,
          },
        ];

        const result = analyzeCategoryRequirements(placeholders);

        // 알 수 없는 카테고리는 제외되고 NATURAL_SITE만 반환
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('NATURAL_SITE');

        // console.warn 호출 확인
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('알 수 없는 카테고리: UNKNOWN_CATEGORY')
        );

        consoleWarnSpy.mockRestore();
      });
    });

    // ❌ 빈 배열 처리
    describe('빈 배열 처리', () => {
      it('빈 배열이 입력되면 빈 배열을 반환해야 함', () => {
        const result = analyzeCategoryRequirements([]);
        expect(result).toEqual([]);
      });
    });

    // ✅ category가 null인 경우 처리
    describe('category가 null인 경우', () => {
      it('category가 null이면 무시해야 함', () => {
        const placeholders: TemplatePlaceholder[] = [
          {
            placeholder: '{{SOME_IMAGE}}',
            type: 'IMAGE',
            category: null,
            index: null,
            slideNumber: 1,
          },
          {
            placeholder: '{{NATURAL_SITE_IMAGE_1}}',
            type: 'IMAGE',
            category: 'NATURAL_SITE',
            index: 1,
            slideNumber: 2,
          },
        ];

        const result = analyzeCategoryRequirements(placeholders);

        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('NATURAL_SITE');
      });
    });
  });

  // CATEGORY_MAPPINGS 상수 테스트
  describe('CATEGORY_MAPPINGS 상수', () => {
    it('NATURAL_SITE는 contentTypeId 12를 가져야 함', () => {
      expect(CATEGORY_MAPPINGS['NATURAL_SITE'].contentTypeId).toBe('12');
    });

    it('EDU_SITE는 contentTypeId 14를 가져야 함', () => {
      expect(CATEGORY_MAPPINGS['EDU_SITE'].contentTypeId).toBe('14');
    });

    it('MARKETPLACE는 contentTypeId 38을 가져야 함', () => {
      expect(CATEGORY_MAPPINGS['MARKETPLACE'].contentTypeId).toBe('38');
    });

    it('FESTIVAL_SITE는 contentTypeId 15를 가져야 함', () => {
      expect(CATEGORY_MAPPINGS['FESTIVAL_SITE'].contentTypeId).toBe('15');
    });

    it('모든 매핑은 displayName을 가져야 함', () => {
      Object.values(CATEGORY_MAPPINGS).forEach((mapping) => {
        expect(mapping.displayName).toBeDefined();
        expect(typeof mapping.displayName).toBe('string');
        expect(mapping.displayName.length).toBeGreaterThan(0);
      });
    });
  });
});
