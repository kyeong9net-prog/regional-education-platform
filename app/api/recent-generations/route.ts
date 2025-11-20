import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * 최근 생성된 PPT 목록 조회 API
 * GET /api/recent-generations?limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const supabase = createServerClient();

    // 최근 생성 요청 조회 (완료된 것만)
    const { data, error } = await supabase
      .from('generation_requests')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[GET /api/recent-generations] Error:', error);
      return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }

    // 응답 형식 변환
    const generatedFiles = data.map((record) => {
      const options = record.options as any;
      return {
        id: record.id,
        regionName: options.regionName || '알 수 없음',
        templateTitle: '템플릿', // template 조인이 필요하면 별도 쿼리
        generatedAt: new Date(record.created_at).toLocaleString('ko-KR'),
        status: 'completed' as const,
        downloadUrl: `/api/download?jobId=${record.id}`,
      };
    });

    return NextResponse.json(generatedFiles);
  } catch (error) {
    console.error('[GET /api/recent-generations] Exception:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
