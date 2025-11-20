import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * 생성된 PPT 파일 다운로드 API
 * GET /api/download?jobId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 1. 생성 기록 조회
    const { data: generationRecord, error: recordError } = await supabase
      .from('generation_requests')
      .select('*')
      .eq('id', jobId)
      .single();

    if (recordError || !generationRecord) {
      return NextResponse.json(
        { error: '생성 기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (generationRecord.status !== 'completed') {
      return NextResponse.json(
        { error: '파일이 아직 생성 중이거나 실패했습니다.' },
        { status: 400 }
      );
    }

    // 2. 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('templates')
      .download(generationRecord.result_file_path);

    if (downloadError || !fileData) {
      console.error('File download error:', downloadError);
      return NextResponse.json(
        { error: '파일을 다운로드할 수 없습니다.' },
        { status: 500 }
      );
    }

    // 3. 통계 업데이트 (다운로드 횟수 증가) - region_id를 null로 처리
    const today = new Date().toISOString().split('T')[0];
    const { data: existingStat } = await supabase
      .from('statistics')
      .select('*')
      .eq('date', today)
      .is('region_id', null)
      .single();

    if (existingStat) {
      await supabase
        .from('statistics')
        .update({ download_count: existingStat.download_count + 1 })
        .eq('id', existingStat.id);
    } else {
      await supabase
        .from('statistics')
        .insert({
          date: today,
          region_id: null,
          generation_count: 0,
          download_count: 1,
        });
    }

    // 4. 파일 반환
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일명 생성 (지역명 + 학교명)
    const options = generationRecord.options as any;
    const regionName = options?.regionName || '지역';
    const schoolName = options?.schoolName || '수업자료';
    const fileName = `${regionName}_${schoolName}_${new Date().toISOString().split('T')[0]}.pptx`;

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: '다운로드 중 오류가 발생했습니다.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
