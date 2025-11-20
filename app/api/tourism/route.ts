import { NextRequest, NextResponse } from 'next/server';

/**
 * 한국관광공사 Tour API 4.0을 사용하여 지역별 관광지 정보를 가져옵니다.
 *
 * API 문서: https://www.data.go.kr/data/15101578/openapi.do
 */

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

interface TourismSpot {
  name: string;
  address: string;
  image: string;
  contentTypeId: string; // 12: 관광지, 14: 문화시설, 15: 축제공연행사, 28: 레포츠, 38: 쇼핑, 39: 음식점
}

/**
 * 지역 코드 매핑 (시군구 코드)
 * 한국관광공사 API에서 사용하는 지역 코드
 */
const AREA_CODES: { [key: string]: { areaCode: string; sigunguCode?: string } } = {
  // 서울
  '서울특별시': { areaCode: '1' },

  // 인천
  '인천광역시': { areaCode: '2' },

  // 대전
  '대전광역시': { areaCode: '3' },

  // 대구
  '대구광역시': { areaCode: '4' },

  // 광주
  '광주광역시': { areaCode: '5' },

  // 부산
  '부산광역시': { areaCode: '6' },

  // 울산
  '울산광역시': { areaCode: '7' },
  '울산광역시 남구': { areaCode: '7', sigunguCode: '2' },
  '울산광역시 동구': { areaCode: '7', sigunguCode: '1' },
  '울산광역시 북구': { areaCode: '7', sigunguCode: '3' },
  '울산광역시 중구': { areaCode: '7', sigunguCode: '4' },
  '울산광역시 울주군': { areaCode: '7', sigunguCode: '5' },

  // 세종
  '세종특별자치시': { areaCode: '8' },

  // 경기
  '경기도': { areaCode: '31' },
  '경기도 가평군': { areaCode: '31', sigunguCode: '13' },
  '가평군': { areaCode: '31', sigunguCode: '13' },
  '경기도 강화군': { areaCode: '31', sigunguCode: '23' },
  '강화군': { areaCode: '31', sigunguCode: '23' },

  // 강원
  '강원특별자치도': { areaCode: '32' },

  // 충북
  '충청북도': { areaCode: '33' },

  // 충남
  '충청남도': { areaCode: '34' },

  // 경북
  '경상북도': { areaCode: '35' },

  // 경남
  '경상남도': { areaCode: '36' },

  // 전북
  '전북특별자치도': { areaCode: '37' },

  // 전남
  '전라남도': { areaCode: '38' },
  '전라남도 고흥군': { areaCode: '38', sigunguCode: '4' },

  // 제주
  '제주특별자치도': { areaCode: '39' },
  '제주특별자치도 서귀포시': { areaCode: '39', sigunguCode: '2' },
  '제주특별자치도 제주시': { areaCode: '39', sigunguCode: '1' },
  '서귀포시': { areaCode: '39', sigunguCode: '2' },
  '제주시': { areaCode: '39', sigunguCode: '1' },
};

/**
 * contentTypeId 매핑
 * 12: 관광지 (자연 명소 포함)
 * 14: 문화시설 (박물관, 미술관, 교육시설 등)
 * 15: 축제공연행사
 * 25: 여행코스
 * 28: 레포츠
 * 32: 숙박
 * 38: 쇼핑
 * 39: 음식점
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    if (!region) {
      return NextResponse.json(
        { error: '지역명(region)이 필요합니다.' },
        { status: 400 }
      );
    }

    // API 키를 함수 내에서 직접 읽기 (캐싱 문제 해결)
    const API_KEY = process.env.KOREAN_TOURISM_API_KEY;

    console.log('[Tourism API] API_KEY:', API_KEY ? `${API_KEY.substring(0, 15)}...` : 'NOT FOUND');

    if (!API_KEY || API_KEY === 'your-korean-tourism-api-key') {
      console.warn('[Tourism API] API 키가 설정되지 않았습니다. 샘플 데이터를 반환합니다.');
      return NextResponse.json(getSampleData(region));
    }

    // 지역 코드 찾기
    const areaInfo = AREA_CODES[region] || AREA_CODES[region.split(' ')[0]];

    if (!areaInfo) {
      console.warn(`[Tourism API] "${region}"에 대한 지역 코드를 찾을 수 없습니다. 샘플 데이터를 반환합니다.`);
      return NextResponse.json(getSampleData(region));
    }

    console.log(`[Tourism API] Fetching data for region: ${region}, areaCode: ${areaInfo.areaCode}`);

    // 자연 관광지 (contentTypeId=12)
    const naturalSpots = await fetchTourismData(API_KEY, areaInfo.areaCode, areaInfo.sigunguCode, '12', 2);

    // 문화시설 (contentTypeId=14)
    const culturalSpots = await fetchTourismData(API_KEY, areaInfo.areaCode, areaInfo.sigunguCode, '14', 2);

    // 역사/문화 관광지 - 관광지(12) 중에서 추가로 가져오기
    const historicalSpots = await fetchTourismData(API_KEY, areaInfo.areaCode, areaInfo.sigunguCode, '12', 2, 3);

    return NextResponse.json({
      region,
      naturalSpots: naturalSpots.slice(0, 2),
      culturalSpots: culturalSpots.slice(0, 2),
      historicalSpots: historicalSpots.slice(0, 2),
    });

  } catch (error) {
    console.error('[Tourism API] Error:', error);

    // 에러 발생 시 샘플 데이터 반환
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '지역';

    return NextResponse.json(getSampleData(region));
  }
}

/**
 * 한국관광공사 API에서 관광지 데이터 가져오기
 * fallback 전략: sigunguCode로 검색했을 때 결과가 없으면 areaCode만으로 재시도
 */
async function fetchTourismData(
  apiKey: string,
  areaCode: string,
  sigunguCode: string | undefined,
  contentTypeId: string,
  numOfRows: number,
  pageNo: number = 1
): Promise<TourismSpot[]> {
  // 1차 시도: sigunguCode 포함 (세부 지역)
  const paramsWithSigungu = new URLSearchParams({
    serviceKey: apiKey,
    numOfRows: numOfRows.toString(),
    pageNo: pageNo.toString(),
    MobileOS: 'ETC',
    MobileApp: 'RegionalEduPlatform',
    _type: 'json',
    arrange: 'Q', // 제목순 정렬 (A: 제목순, C: 수정일순, D: 생성일순, Q: 추천순)
    areaCode: areaCode,
    contentTypeId: contentTypeId,
  });

  if (sigunguCode) {
    paramsWithSigungu.append('sigunguCode', sigunguCode);
  }

  const urlWithSigungu = `${BASE_URL}/areaBasedList2?${paramsWithSigungu.toString()}`;

  console.log(`[Tourism API] 1차 시도 (sigunguCode=${sigunguCode || 'none'}): ${urlWithSigungu.replace(apiKey, 'HIDDEN')}`);

  let response = await fetch(urlWithSigungu);
  let data = await response.json();

  console.log(`[Tourism API] 1차 응답:`, JSON.stringify(data).substring(0, 200));

  // 결과가 있으면 반환
  if (data.response?.body?.items?.item) {
    const items = Array.isArray(data.response.body.items.item)
      ? data.response.body.items.item
      : [data.response.body.items.item];

    console.log(`[Tourism API] ✅ 1차 성공: ${items.length}개 항목 발견`);

    return items.map((item: any) => ({
      name: item.title || '관광지',
      address: item.addr1 || '',
      image: item.firstimage || item.firstimage2 || '',
      contentTypeId: item.contenttypeid || contentTypeId,
    }));
  }

  // 2차 시도: sigunguCode 없이 (상위 지역) - sigunguCode가 있었을 때만 재시도
  if (sigunguCode) {
    console.log(`[Tourism API] ⚠ 1차 실패 (결과 없음). 2차 시도: areaCode만 사용`);

    const paramsWithoutSigungu = new URLSearchParams({
      serviceKey: apiKey,
      numOfRows: numOfRows.toString(),
      pageNo: pageNo.toString(),
      MobileOS: 'ETC',
      MobileApp: 'RegionalEduPlatform',
      _type: 'json',
      arrange: 'Q',
      areaCode: areaCode,
      contentTypeId: contentTypeId,
    });

    const urlWithoutSigungu = `${BASE_URL}/areaBasedList2?${paramsWithoutSigungu.toString()}`;

    console.log(`[Tourism API] 2차 시도 (areaCode만): ${urlWithoutSigungu.replace(apiKey, 'HIDDEN')}`);

    response = await fetch(urlWithoutSigungu);
    data = await response.json();

    console.log(`[Tourism API] 2차 응답:`, JSON.stringify(data).substring(0, 200));

    if (data.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item)
        ? data.response.body.items.item
        : [data.response.body.items.item];

      console.log(`[Tourism API] ✅ 2차 성공 (상위 지역 데이터 사용): ${items.length}개 항목 발견`);

      return items.map((item: any) => ({
        name: item.title || '관광지',
        address: item.addr1 || '',
        image: item.firstimage || item.firstimage2 || '',
        contentTypeId: item.contenttypeid || contentTypeId,
      }));
    }
  }

  console.log(`[Tourism API] ❌ 데이터 없음 (1차, 2차 모두 실패)`);
  return [];
}

/**
 * API 키가 없거나 에러 발생 시 반환할 샘플 데이터
 */
function getSampleData(region: string) {
  return {
    region,
    naturalSpots: [
      {
        name: `${region} 자연명소 1`,
        address: `${region}`,
        image: '',
        contentTypeId: '12'
      },
      {
        name: `${region} 자연명소 2`,
        address: `${region}`,
        image: '',
        contentTypeId: '12'
      }
    ],
    culturalSpots: [
      {
        name: `${region} 교육시설 1`,
        address: `${region}`,
        image: '',
        contentTypeId: '14'
      },
      {
        name: `${region} 교육시설 2`,
        address: `${region}`,
        image: '',
        contentTypeId: '14'
      }
    ],
    historicalSpots: [
      {
        name: `${region} 역사유적 1`,
        address: `${region}`,
        image: '',
        contentTypeId: '12'
      },
      {
        name: `${region} 역사유적 2`,
        address: `${region}`,
        image: '',
        contentTypeId: '12'
      }
    ]
  };
}
