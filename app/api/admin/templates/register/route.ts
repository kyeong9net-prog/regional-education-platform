import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, slides_count, file_path } = body;

    if (!title || !description || !category || !slides_count || !file_path) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 템플릿 정보를 데이터베이스에 저장
    const { data: templateData, error: dbError } = await supabase
      .from('templates')
      .insert({
        title,
        description,
        category,
        slides_count,
        file_path,
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { error: '템플릿 정보 저장에 실패했습니다.', details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: templateData,
    });
  } catch (error: any) {
    console.error('Template register error:', error);
    return NextResponse.json(
      { error: '템플릿 등록 중 오류가 발생했습니다.', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
