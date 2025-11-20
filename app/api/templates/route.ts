import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * 템플릿 목록 조회 (교사용)
 * 모든 템플릿 반환
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch templates:', error);
      return NextResponse.json(
        { error: '템플릿 조회에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }

    console.log('[API] Templates fetched:', templates?.length || 0, templates?.map(t => ({ id: t.id, title: t.title })));

    return NextResponse.json(
      { templates: templates || [] },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { error: '템플릿 조회 중 오류가 발생했습니다.', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
