/**
 * 이미지 API 통합 모듈
 * - Unsplash API: 실사 사진
 * - Pixabay API: 일러스트
 * - 한국관광공사 Tour API: 지역별 실사 사진
 */

export interface ImageResult {
  url: string;
  thumbnail: string;
  photographer?: string;
  source: 'unsplash' | 'pixabay' | 'korean-tourism';
  alt?: string;
}

/**
 * Unsplash API - 실사 사진
 */
async function fetchUnsplashImages(
  query: string,
  count: number
): Promise<ImageResult[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  if (!accessKey) {
    console.warn('Unsplash API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Unsplash API error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.results.map((photo: any) => ({
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      photographer: photo.user.name,
      source: 'unsplash' as const,
      alt: photo.alt_description || query,
    }));
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return [];
  }
}

/**
 * Pixabay API - 일러스트
 */
async function fetchPixabayImages(
  query: string,
  count: number,
  imageType: 'photo' | 'illustration' = 'illustration'
): Promise<ImageResult[]> {
  const apiKey = process.env.PIXABAY_API_KEY;

  if (!apiKey) {
    console.warn('Pixabay API key not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=${imageType}&per_page=${count}&orientation=horizontal`
    );

    if (!response.ok) {
      console.error('Pixabay API error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.hits.map((hit: any) => ({
      url: hit.largeImageURL,
      thumbnail: hit.previewURL,
      photographer: hit.user,
      source: 'pixabay' as const,
      alt: hit.tags,
    }));
  } catch (error) {
    console.error('Pixabay fetch error:', error);
    return [];
  }
}

/**
 * 한국관광공사 Tour API - 지역별 실사 사진
 */
async function fetchKoreanTourismImages(
  regionName: string,
  count: number
): Promise<ImageResult[]> {
  const serviceKey = process.env.KOREAN_TOURISM_API_KEY;

  if (!serviceKey) {
    console.warn('Korean Tourism API key not configured');
    return [];
  }

  try {
    // 지역 코드 매핑 (지역명 -> areaCode)
    const areaCodeMap: Record<string, string> = {
      '서울': '1',
      '인천': '2',
      '대전': '3',
      '대구': '4',
      '광주': '5',
      '부산': '6',
      '울산': '7',
      '세종': '8',
      '경기': '31',
      '강원': '32',
      '충북': '33',
      '충남': '34',
      '경북': '35',
      '경남': '36',
      '전북': '37',
      '전남': '38',
      '제주': '39',
    };

    const areaCode = areaCodeMap[regionName];

    if (!areaCode) {
      console.warn(`Unknown region: ${regionName}`);
      return [];
    }

    // 관광정보 검색 API 호출
    const response = await fetch(
      `https://apis.data.go.kr/B551011/KorService1/areaBasedList1?` +
      `serviceKey=${serviceKey}&` +
      `numOfRows=${count}&` +
      `pageNo=1&` +
      `MobileOS=ETC&` +
      `MobileApp=EduPPT&` +
      `areaCode=${areaCode}&` +
      `contentTypeId=12&` + // 12: 관광지
      `_type=json`
    );

    if (!response.ok) {
      console.error('Korean Tourism API error:', response.status);
      return [];
    }

    const data = await response.json();
    const items = data.response?.body?.items?.item || [];

    if (!Array.isArray(items)) {
      return items.firstimage
        ? [{
            url: items.firstimage,
            thumbnail: items.firstimage2 || items.firstimage,
            source: 'korean-tourism' as const,
            alt: items.title || regionName,
          }]
        : [];
    }

    return items
      .filter((item: any) => item.firstimage) // 이미지가 있는 항목만
      .map((item: any) => ({
        url: item.firstimage,
        thumbnail: item.firstimage2 || item.firstimage,
        source: 'korean-tourism' as const,
        alt: item.title || regionName,
      }));
  } catch (error) {
    console.error('Korean Tourism API fetch error:', error);
    return [];
  }
}

/**
 * 지역과 스타일에 맞는 이미지 가져오기
 */
export async function getRegionImages(
  regionName: string,
  photoStyle: 'realistic' | 'illustration' | 'mixed',
  count: number = 10
): Promise<ImageResult[]> {
  let images: ImageResult[] = [];

  switch (photoStyle) {
    case 'realistic':
      // 1. 한국관광공사 API 우선
      const tourismImages = await fetchKoreanTourismImages(regionName, count);
      images = [...tourismImages];

      // 2. 부족하면 Unsplash로 보충
      if (images.length < count) {
        const remaining = count - images.length;
        const unsplashImages = await fetchUnsplashImages(
          `${regionName} Korea landscape`,
          remaining
        );
        images = [...images, ...unsplashImages];
      }

      // 3. 여전히 부족하면 일반 검색어로 Unsplash 재검색
      if (images.length < count) {
        const remaining = count - images.length;
        const fallbackImages = await fetchUnsplashImages(
          `Korea nature landscape`,
          remaining
        );
        images = [...images, ...fallbackImages];
      }
      break;

    case 'illustration':
      // Pixabay 일러스트
      images = await fetchPixabayImages(
        `${regionName} Korea illustration`,
        count,
        'illustration'
      );

      // 부족하면 일반 일러스트로 보충
      if (images.length < count) {
        const remaining = count - images.length;
        const fallbackImages = await fetchPixabayImages(
          'Korea nature illustration',
          remaining,
          'illustration'
        );
        images = [...images, ...fallbackImages];
      }
      break;

    case 'mixed':
      // 혼합: 50% 실사 + 50% 일러스트
      const halfCount = Math.ceil(count / 2);

      // 실사 (한국관광공사 + Unsplash)
      const tourismImagesMixed = await fetchKoreanTourismImages(
        regionName,
        halfCount
      );
      const unsplashImagesMixed = await fetchUnsplashImages(
        `${regionName} Korea`,
        halfCount - tourismImagesMixed.length
      );

      // 일러스트 (Pixabay)
      const illustrationImages = await fetchPixabayImages(
        `${regionName} Korea`,
        halfCount,
        'illustration'
      );

      images = [
        ...tourismImagesMixed,
        ...unsplashImagesMixed,
        ...illustrationImages,
      ];
      break;
  }

  // 요청한 개수만큼만 반환
  return images.slice(0, count);
}

/**
 * 주제에 맞는 이미지 가져오기 (지역과 무관)
 */
export async function getThemeImages(
  theme: string,
  photoStyle: 'realistic' | 'illustration' | 'mixed',
  count: number = 10
): Promise<ImageResult[]> {
  let images: ImageResult[] = [];

  switch (photoStyle) {
    case 'realistic':
      images = await fetchUnsplashImages(theme, count);
      break;

    case 'illustration':
      images = await fetchPixabayImages(theme, count, 'illustration');
      break;

    case 'mixed':
      const halfCount = Math.ceil(count / 2);
      const realisticImages = await fetchUnsplashImages(theme, halfCount);
      const illustrationImages = await fetchPixabayImages(
        theme,
        halfCount,
        'illustration'
      );
      images = [...realisticImages, ...illustrationImages];
      break;
  }

  return images.slice(0, count);
}
