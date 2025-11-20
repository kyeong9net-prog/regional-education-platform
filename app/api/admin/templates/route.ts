import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// 모든 템플릿 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: '템플릿 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('Template fetch error:', error);
    return NextResponse.json(
      { error: '템플릿 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 템플릿 수정
export async function PUT(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const body = await request.json();
    const { title, description, category, slides_count, display_order, file_path } = body;

    if (!title || !description || !category || !slides_count) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 템플릿 업데이트
    const updateData: any = {
      title,
      description,
      category,
      slides_count: parseInt(slides_count, 10),
      updated_at: new Date().toISOString(),
    };

    // file_path가 있으면 추가
    if (file_path) {
      updateData.file_path = file_path;
    }

    // display_order가 있으면 추가
    if (display_order !== undefined && display_order !== null) {
      updateData.display_order = parseInt(display_order, 10);
    }

    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json(
        { error: '템플릿 수정에 실패했습니다.', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    console.error('Template update error:', error);
    return NextResponse.json(
      { error: '템플릿 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 템플릿 삭제
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const adminSecret = request.headers.get('x-admin-secret');
    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: '템플릿 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 템플릿 정보 조회
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('file_path')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Storage에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from('templates')
      .remove([template.file_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
    }

    // 데이터베이스에서 템플릿 삭제
    const { error: deleteError } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (deleteError) {
      console.error('Database delete error:', deleteError);
      return NextResponse.json(
        { error: '템플릿 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Template delete error:', error);
    return NextResponse.json(
      { error: '템플릿 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
