import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Template Upload Started ===');

    // 관리자 인증 확인
    const adminSecret = request.headers.get('x-admin-secret');
    console.log('Admin secret check:', adminSecret === process.env.ADMIN_SECRET_KEY);

    if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
      console.error('Auth failed');
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const slidesCount = parseInt(formData.get('slidesCount') as string);

    console.log('Form data:', { title, description, category, slidesCount, fileName: file?.name });

    if (!file || !title || !description || !category || !slidesCount) {
      console.error('Missing fields');
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // PPTX 파일 확인
    if (!file.name.endsWith('.pptx')) {
      console.error('Invalid file type:', file.name);
      return NextResponse.json(
        { error: 'PPTX 파일만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 파일을 Supabase Storage에 업로드
    // 한글 파일명 문제 해결: 원본 파일명 대신 타임스탬프 + UUID 사용
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomId}.pptx`;
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    console.log('Uploading to storage:', fileName, 'Original:', file.name, 'Size:', buffer.byteLength);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('templates')
      .upload(fileName, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        {
          error: '파일 업로드에 실패했습니다.',
          details: uploadError.message,
          hint: 'Supabase Storage에서 templates 버킷을 생성했는지 확인하세요.'
        },
        { status: 500 }
      );
    }

    console.log('File uploaded successfully:', uploadData);

    // 템플릿 정보를 데이터베이스에 저장
    const { data: templateData, error: dbError } = await supabase
      .from('templates')
      .insert({
        title,
        description,
        category,
        slides_count: slidesCount,
        file_path: uploadData.path,
        is_active: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // 업로드된 파일 삭제
      await supabase.storage.from('templates').remove([fileName]);
      return NextResponse.json(
        { error: '템플릿 정보 저장에 실패했습니다.', details: dbError.message },
        { status: 500 }
      );
    }

    console.log('Template created successfully:', templateData);

    return NextResponse.json({
      success: true,
      template: templateData,
    });
  } catch (error: any) {
    console.error('Template upload error:', error);
    return NextResponse.json(
      { error: '템플릿 업로드 중 오류가 발생했습니다.', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
