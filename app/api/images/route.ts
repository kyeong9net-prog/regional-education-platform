import { NextRequest, NextResponse } from 'next/server';
import { getRegionImages, getThemeImages } from '@/lib/api/images';

// 동적 라우트로 설정 (정적 빌드 불가)
export const dynamic = 'force-dynamic';

/**
 * 이미지 검색 API
 * GET /api/images?region=서울&photoStyle=realistic&count=10
 * GET /api/images?theme=nature&photoStyle=illustration&count=5
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const region = searchParams.get('region');
    const theme = searchParams.get('theme');
    const photoStyle = searchParams.get('photoStyle') as 'realistic' | 'illustration' | 'mixed' || 'realistic';
    const count = parseInt(searchParams.get('count') || '10', 10);

    // 입력 검증
    if (!['realistic', 'illustration', 'mixed'].includes(photoStyle)) {
      return NextResponse.json(
        { error: 'Invalid photoStyle. Must be realistic, illustration, or mixed.' },
        { status: 400 }
      );
    }

    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 50.' },
        { status: 400 }
      );
    }

    let images;

    if (region) {
      // 지역별 이미지 검색
      images = await getRegionImages(region, photoStyle, count);
    } else if (theme) {
      // 주제별 이미지 검색
      images = await getThemeImages(theme, photoStyle, count);
    } else {
      return NextResponse.json(
        { error: 'Either region or theme parameter is required.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        images,
        count: images.length,
        photoStyle,
        query: region || theme,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Image API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images.' },
      { status: 500 }
    );
  }
}
