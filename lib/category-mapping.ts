/**
 * 템플릿 카테고리와 Tourism API contentTypeId 매핑 설정
 *
 * 이 파일은 템플릿의 placeholder 카테고리를 Tourism API의 contentTypeId로 변환합니다.
 * 새로운 템플릿이 추가되면 이 매핑만 업데이트하면 됩니다.
 */

/**
 * Tourism API contentTypeId
 * 12: 관광지 (자연 명소 포함)
 * 14: 문화시설 (박물관, 미술관, 교육시설 등)
 * 15: 축제공연행사
 * 25: 여행코스
 * 28: 레포츠
 * 32: 숙박
 * 38: 쇼핑
 * 39: 음식점
 */

export interface CategoryMapping {
  contentTypeId: string;
  pageNo?: number; // 같은 contentTypeId에서 다른 결과를 가져오려면 페이지 번호 사용
  displayName: string; // 사용자에게 보여질 이름
}

/**
 * 카테고리 매핑 테이블
 * 템플릿의 placeholder 카테고리명 → Tourism API 설정
 */
export const CATEGORY_MAPPINGS: Record<string, CategoryMapping> = {
  // 자연 명소
  'NATURAL_SITE': {
    contentTypeId: '12',
    pageNo: 1,
    displayName: '자연명소'
  },

  // 교육/문화 시설
  'EDU_SITE': {
    contentTypeId: '14',
    pageNo: 1,
    displayName: '교육시설'
  },
  'CULTURE_SITE': {
    contentTypeId: '14',
    pageNo: 1,
    displayName: '문화시설'
  },

  // 역사 유적 (관광지 카테고리에서 다른 페이지)
  'HISTORICAL_SITE': {
    contentTypeId: '12',
    pageNo: 3,
    displayName: '역사유적'
  },
  'HISTOIRCAL_SITE': { // 템플릿의 오타도 지원
    contentTypeId: '12',
    pageNo: 3,
    displayName: '역사유적'
  },

  // 축제/공연
  'FESTIVAL_SITE': {
    contentTypeId: '15',
    pageNo: 1,
    displayName: '축제공연'
  },

  // 레포츠
  'SPORTS_SITE': {
    contentTypeId: '28',
    pageNo: 1,
    displayName: '레포츠'
  },

  // 쇼핑
  'SHOPPING_SITE': {
    contentTypeId: '38',
    pageNo: 1,
    displayName: '쇼핑'
  },

  // 음식점
  'FOOD_SITE': {
    contentTypeId: '39',
    pageNo: 1,
    displayName: '음식점'
  },

  // 숙박
  'HOTEL_SITE': {
    contentTypeId: '32',
    pageNo: 1,
    displayName: '숙박'
  },

  // 여행코스
  'TOUR_COURSE': {
    contentTypeId: '25',
    pageNo: 1,
    displayName: '여행코스'
  },

  // 교통 중심지 (버스터미널, 기차역 등)
  'TRANSITHUB_SITE': {
    contentTypeId: '12',
    pageNo: 2,
    displayName: '교통중심지'
  },
  'TRANSIT_HUB': {
    contentTypeId: '12',
    pageNo: 2,
    displayName: '교통중심지'
  },

  // 전통시장
  'MARKETPLACE': {
    contentTypeId: '38',
    pageNo: 2,
    displayName: '전통시장'
  },

  // 휴양지/공원
  'RECREATIONAREA': {
    contentTypeId: '28',
    pageNo: 2,
    displayName: '휴양지'
  },
};

/**
 * 카테고리명으로 매핑 정보 가져오기
 */
export function getCategoryMapping(category: string): CategoryMapping | null {
  return CATEGORY_MAPPINGS[category] || null;
}

/**
 * 템플릿 메타데이터에서 필요한 카테고리 목록 추출
 */
export interface TemplatePlaceholder {
  placeholder: string;
  type: string;
  category: string | null;
  index: number | null;
  slideNumber: number;
  imageId?: string;
}

export interface CategoryRequirement {
  category: string;
  count: number; // 이 카테고리에서 필요한 항목 수
  mapping: CategoryMapping;
}

/**
 * 템플릿의 placeholder 목록에서 필요한 카테고리와 개수 추출
 */
export function analyzeCategoryRequirements(
  placeholders: TemplatePlaceholder[]
): CategoryRequirement[] {
  const categoryCount: Record<string, number> = {};

  // 카테고리별 개수 집계
  for (const placeholder of placeholders) {
    if (placeholder.category && placeholder.type === 'IMAGE') {
      categoryCount[placeholder.category] = (categoryCount[placeholder.category] || 0) + 1;
    }
  }

  // CategoryRequirement 배열 생성
  const requirements: CategoryRequirement[] = [];

  for (const [category, count] of Object.entries(categoryCount)) {
    const mapping = getCategoryMapping(category);

    if (!mapping) {
      console.warn(`[Category Mapping] 알 수 없는 카테고리: ${category}`);
      continue;
    }

    requirements.push({
      category,
      count,
      mapping
    });
  }

  return requirements;
}
