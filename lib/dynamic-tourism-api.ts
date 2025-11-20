/**
 * 동적 Tourism API 호출 시스템
 * 템플릿의 카테고리 요구사항에 따라 자동으로 Tourism 데이터를 가져옵니다.
 */

import { CategoryRequirement, getCategoryMapping } from './category-mapping';
import { KOREA_AREA_CODES, findAreaCode } from './korea-area-codes';

export interface TourismSpot {
  name: string;
  address: string;
  image: string;
  contentTypeId: string;
  category: string; // 템플릿의 카테고리명 (NATURAL_SITE, EDU_SITE 등)
  description?: string; // 장소 설명 (3줄 요약)
  contentId?: string; // 상세정보 조회를 위한 콘텐츠 ID
  readcount?: number; // 조회수 (인기도)
}

export interface TourismDataByCategory {
  [category: string]: TourismSpot[];
}

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

/**
 * 초등학생용 교육 자료에 부적절한 장소 필터링 (화이트리스트 기반)
 */
function isAppropriateForElementaryStudents(spot: { name: string; address: string; readcount?: number }): boolean {
  const inappropriateKeywords = [
    // 주점/술집
    '주점', '술집', '호프', '맥주', '소주', '바(bar)', '선술집', '포차', '이자카야',
    '와인바', '칵테일', '펍', '비어', 'beer', 'bar',

    // 성인시설
    '노래방', '단란주점', '유흥', '나이트', '클럽', '룸살롱', '안마', '마사지',
    '스파', '찜질방', '사우나', '목욕탕', '목욕', '온천', '카지노', '도박', '게임장',

    // 숙박시설
    '호텔', '모텔', '펜션', '리조트', '콘도', '민박', '게스트하우스', '여관',
    'hotel', 'motel', 'resort',

    // 상업시설 (대폭 강화)
    '쇼핑몰', '아울렛', '백화점', '면세점', '매장', '전문점', '판매점', '대리점',
    '약국', '성형외과', '피부과', '병원', '의원', '한의원', '치과',
    '은행', '우체국', '부동산', '공인중개사',
    '편의점', 'gs25', 'cu', '세븐일레븐', '이마트24',
    '패션', '의류', '옷가게', '신발', '가방', '액세서리',
    '화장품', '코스메틱', '뷰티', '네일', '헤어', '미용실',
    '휴대폰', '핸드폰', '통신', '가전', '컴퓨터', 'pc방',
    '렌탈', '대여', '리스',

    // 기타 부적절
    '성인', '19금', '담배', '흡연', '프랜차이즈', '체인점',
  ];

  const lowerName = spot.name.toLowerCase();
  const lowerAddress = spot.address.toLowerCase();
  const combinedText = `${lowerName} ${lowerAddress}`;

  // 부적절한 키워드가 포함되어 있는지 확인
  for (const keyword of inappropriateKeywords) {
    if (combinedText.includes(keyword.toLowerCase())) {
      console.log(`[Filter] ❌ 부적절한 콘텐츠 필터링: ${spot.name} (키워드: ${keyword})`);
      return false;
    }
  }

  // 괄호 안에 회사명/브랜드명이 있는 경우 필터링 (예: (주)회사명, [브랜드])
  if (/\(주\)|㈜|주식회사|유한회사|\[.*?\]/.test(spot.name)) {
    console.log(`[Filter] ❌ 상업시설 필터링: ${spot.name} (회사명 포함)`);
    return false;
  }

  // 조회수가 너무 낮은 장소 필터링 (5,000 미만)
  if (spot.readcount && spot.readcount < 5000) {
    console.log(`[Filter] ❌ 조회수 낮음: ${spot.name} (조회수: ${spot.readcount})`);
    return false;
  }

  return true;
}

/**
 * 템플릿의 카테고리 요구사항에 따라 Tourism 데이터를 동적으로 가져오기
 */
export async function fetchTourismDataByCategories(
  region: string,
  categoryRequirements: CategoryRequirement[],
  apiKey: string
): Promise<TourismDataByCategory> {
  const result: TourismDataByCategory = {};

  // 지역 코드 찾기 (전체 지역 코드 DB 사용)
  const areaInfo = findAreaCode(region);

  if (!areaInfo) {
    console.warn(`[Dynamic Tourism] 지역 코드를 찾을 수 없음: ${region} - 빈 데이터 반환`);
    // 빈 데이터 반환 (나중에 이미지 fallback이 처리함)
    for (const requirement of categoryRequirements) {
      result[requirement.category] = [];
    }
    return result;
  }

  console.log(`[Dynamic Tourism] 지역: ${region}, areaCode: ${areaInfo.areaCode}, sigunguCode: ${areaInfo.sigunguCode || 'none'}`);

  // 각 카테고리별로 데이터 가져오기
  for (const requirement of categoryRequirements) {
    const { category, count, mapping } = requirement;

    console.log(`[Dynamic Tourism] 카테고리: ${category} (${mapping.displayName}), 필요 개수: ${count}`);

    try {
      const spots = await fetchTourismData(
        apiKey,
        areaInfo.areaCode,
        areaInfo.sigunguCode,
        mapping.contentTypeId,
        count,
        mapping.pageNo || 1
      );

      // 카테고리명 추가 및 필터링
      let spotsWithCategory = spots
        .map(spot => ({
          ...spot,
          category: category
        }))
        .filter(spot => isAppropriateForElementaryStudents(spot))
        .filter(spot => spot.image && spot.image.trim() !== ''); // 이미지가 있는 장소만 선택

      // 필터링 후 충분한 데이터가 없으면 상위 지역(도/특별시)에서 가져오기
      if (spotsWithCategory.length < count) {
        console.warn(`[Dynamic Tourism] ⚠️ ${category}: 필터링 후 ${spotsWithCategory.length}개만 남음. 상위 지역에서 추가 검색...`);

        const additionalSpots = await fetchTourismData(
          apiKey,
          areaInfo.areaCode,
          undefined, // sigunguCode 없이 (도/특별시 전체)
          mapping.contentTypeId,
          count * 2, // 더 많이 가져와서 필터링
          mapping.pageNo || 1
        );

        const additionalFiltered = additionalSpots
          .map(spot => ({
            ...spot,
            category: category
          }))
          .filter(spot => isAppropriateForElementaryStudents(spot))
          .filter(spot => spot.image && spot.image.trim() !== '') // 이미지가 있는 장소만 선택
          .filter(spot => !spotsWithCategory.some(existing => existing.name === spot.name)); // 중복 제거

        spotsWithCategory = [...spotsWithCategory, ...additionalFiltered];
        console.log(`[Dynamic Tourism] ✅ 상위 지역에서 ${additionalFiltered.length}개 추가, 총 ${spotsWithCategory.length}개`);
      }

      result[category] = spotsWithCategory;

      console.log(`[Dynamic Tourism] ✅ ${category}: ${spotsWithCategory.length}개 항목 가져옴 (필터링 후)`);
    } catch (error) {
      console.error(`[Dynamic Tourism] ❌ ${category} 데이터 가져오기 실패:`, error);
      result[category] = [];
    }
  }

  return result;
}

/**
 * Tourism API에서 데이터 가져오기 (fallback 포함)
 */
async function fetchTourismData(
  apiKey: string,
  areaCode: string,
  sigunguCode: string | undefined,
  contentTypeId: string,
  numOfRows: number,
  pageNo: number = 1
): Promise<TourismSpot[]> {
  // TOP 10에서 선택하기 위해 더 많은 결과를 요청 (최소 10개 또는 요청한 개수의 3배)
  const fetchCount = Math.max(10, numOfRows * 3);

  // 1차 시도: sigunguCode 포함
  const paramsWithSigungu = new URLSearchParams({
    serviceKey: apiKey,
    numOfRows: fetchCount.toString(),
    pageNo: pageNo.toString(),
    MobileOS: 'ETC',
    MobileApp: 'RegionalEduPlatform',
    _type: 'json',
    arrange: 'B', // B = 조회순 (인기순), Q = 추천순, A = 제목순
    areaCode: areaCode,
    contentTypeId: contentTypeId,
  });

  if (sigunguCode) {
    paramsWithSigungu.append('sigunguCode', sigunguCode);
  }

  const urlWithSigungu = `${BASE_URL}/areaBasedList2?${paramsWithSigungu.toString()}`;

  console.log(`[Tourism API] 1차 시도 (sigunguCode=${sigunguCode || 'none'})`);

  let response = await fetch(urlWithSigungu);
  let data = await response.json();

  // 결과가 있으면 반환
  if (data.response?.body?.items?.item) {
    const items = Array.isArray(data.response.body.items.item)
      ? data.response.body.items.item
      : [data.response.body.items.item];

    console.log(`[Tourism API] ✅ 1차 성공: ${items.length}개 항목 발견`);

    const spots = items.map((item: any) => ({
      name: item.title || '관광지',
      address: item.addr1 || '',
      image: item.firstimage || item.firstimage2 || '',
      contentTypeId: item.contenttypeid || contentTypeId,
      category: '', // 나중에 추가됨
      readcount: parseInt(item.readcount || '0', 10) // 조회수
    }));

    // 조회수 기준으로 내림차순 정렬 (인기있는 장소 우선)
    spots.sort((a: TourismSpot, b: TourismSpot) => (b.readcount || 0) - (a.readcount || 0));

    return spots;
  }

  // 2차 시도: sigunguCode 없이 (상위 지역)
  if (sigunguCode) {
    console.log(`[Tourism API] ⚠ 1차 실패. 2차 시도: areaCode만 사용`);

    const paramsWithoutSigungu = new URLSearchParams({
      serviceKey: apiKey,
      numOfRows: fetchCount.toString(),
      pageNo: pageNo.toString(),
      MobileOS: 'ETC',
      MobileApp: 'RegionalEduPlatform',
      _type: 'json',
      arrange: 'B', // 조회순 (인기순)
      areaCode: areaCode,
      contentTypeId: contentTypeId,
    });

    const urlWithoutSigungu = `${BASE_URL}/areaBasedList2?${paramsWithoutSigungu.toString()}`;

    response = await fetch(urlWithoutSigungu);
    data = await response.json();

    if (data.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item)
        ? data.response.body.items.item
        : [data.response.body.items.item];

      console.log(`[Tourism API] ✅ 2차 성공: ${items.length}개 항목 발견`);

      const spots = items.map((item: any) => ({
        name: item.title || '관광지',
        address: item.addr1 || '',
        image: item.firstimage || item.firstimage2 || '',
        contentTypeId: item.contenttypeid || contentTypeId,
        category: '',
        readcount: parseInt(item.readcount || '0', 10) // 조회수
      }));

      // 조회수 기준으로 내림차순 정렬 (인기있는 장소 우선)
      spots.sort((a: TourismSpot, b: TourismSpot) => (b.readcount || 0) - (a.readcount || 0));

      return spots;
    }
  }

  console.log(`[Tourism API] ❌ 데이터 없음`);
  return [];
}
