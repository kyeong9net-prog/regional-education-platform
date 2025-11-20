import { NextRequest, NextResponse } from 'next/server';

/**
 * 이미지 검색 API
 * Unsplash와 Pixabay를 사용하여 관광지 이미지 검색
 */

interface ImageResult {
  url: string;
  thumbnail: string;
  source: 'unsplash' | 'pixabay';
  width: number;
  height: number;
}

/**
 * Unsplash API로 이미지 검색
 */
async function searchUnsplash(apiKey: string | undefined, query: string): Promise<ImageResult[]> {
  if (!apiKey || apiKey === 'your-unsplash-access-key') {
    console.log('[Unsplash] API key not configured');
    return [];
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' korea landscape')}&per_page=3&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error('[Unsplash] API error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.results.map((photo: any) => ({
      url: photo.urls.regular,
      thumbnail: photo.urls.small,
      source: 'unsplash' as const,
      width: photo.width,
      height: photo.height
    }));
  } catch (error) {
    console.error('[Unsplash] Error:', error);
    return [];
  }
}

/**
 * Pixabay API로 이미지 검색
 */
async function searchPixabay(apiKey: string | undefined, query: string): Promise<ImageResult[]> {
  console.log('[Pixabay] Received API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'UNDEFINED');

  if (!apiKey || apiKey === 'your-pixabay-api-key') {
    console.log('[Pixabay] API key not configured');
    return [];
  }

  try {
    const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query + ' korea')}&image_type=photo&orientation=horizontal&per_page=3`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('[Pixabay] API error:', response.status);
      return [];
    }

    const data = await response.json();

    return data.hits.map((hit: any) => ({
      url: hit.largeImageURL,
      thumbnail: hit.previewURL,
      source: 'pixabay' as const,
      width: hit.imageWidth,
      height: hit.imageHeight
    }));
  } catch (error) {
    console.error('[Pixabay] Error:', error);
    return [];
  }
}

/**
 * 한국어 지역명을 영어로 변환 (간단한 매핑)
 */
function translateToEnglish(koreanName: string): string {
  const translations: { [key: string]: string } = {
    '서귀포시': 'Seogwipo',
    '제주시': 'Jeju',
    '가평군': 'Gapyeong',
    '순창군': 'Sunchang',
    '서울': 'Seoul',
    '부산': 'Busan',
    '경주': 'Gyeongju',
    '전주': 'Jeonju',
    '속초': 'Sokcho',
    '강릉': 'Gangneung',
  };

  // 정확한 매칭
  if (translations[koreanName]) {
    return translations[koreanName];
  }

  // 부분 매칭 (예: "제주특별자치도 서귀포시" → "Seogwipo")
  for (const [korean, english] of Object.entries(translations)) {
    if (koreanName.includes(korean)) {
      return english;
    }
  }

  // 매칭 실패 시 한글 그대로 (Pixabay는 한글 지원 안 됨)
  return koreanName;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: '검색어(q)가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`[Image Search] Searching for: "${query}"`);

    // 한국어를 영어로 변환
    const englishQuery = translateToEnglish(query);
    console.log(`[Image Search] Translated to: "${englishQuery}"`);

    // API 키를 함수 내에서 직접 읽기
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    const pixabayKey = process.env.PIXABAY_API_KEY;

    console.log('[Image Search] Unsplash key:', unsplashKey ? 'configured' : 'not configured');
    console.log('[Image Search] Pixabay key:', pixabayKey ? 'configured' : 'not configured');

    // 두 API를 병렬로 호출
    const [unsplashResults, pixabayResults] = await Promise.all([
      searchUnsplash(unsplashKey, englishQuery),
      searchPixabay(pixabayKey, englishQuery)
    ]);

    // 결과 합치기 (Unsplash 우선)
    const allResults = [...unsplashResults, ...pixabayResults];

    console.log(`[Image Search] Found ${allResults.length} images`);

    // API 키가 없거나 결과가 없으면 기본 이미지 반환
    if (allResults.length === 0) {
      console.log('[Image Search] No results, using placeholder images');
      return NextResponse.json({
        query,
        englishQuery,
        results: [
          {
            url: `https://via.placeholder.com/1200x800/4A90E2/FFFFFF?text=${encodeURIComponent(query)}`,
            thumbnail: `https://via.placeholder.com/400x300/4A90E2/FFFFFF?text=${encodeURIComponent(query)}`,
            source: 'placeholder' as const,
            width: 1200,
            height: 800
          }
        ],
        count: 1,
        note: 'Using placeholder images. Please configure UNSPLASH_ACCESS_KEY or PIXABAY_API_KEY in .env.local'
      });
    }

    return NextResponse.json({
      query,
      englishQuery,
      results: allResults.slice(0, 5), // 최대 5개
      count: allResults.length
    });

  } catch (error) {
    console.error('[Image Search] Error:', error);
    return NextResponse.json(
      { error: '이미지 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
