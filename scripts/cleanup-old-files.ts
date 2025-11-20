/**
 * 일회성 스크립트: Supabase Storage의 오래된 PPTX 파일 정리
 * 최근 20개만 유지하고 나머지 삭제
 *
 * 실행 방법:
 * npx tsx scripts/cleanup-old-files.ts
 */

import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupOldFiles() {
  console.log('========================================');
  console.log('🧹 오래된 PPTX 파일 정리 시작');
  console.log('========================================\n');

  try {
    // 1. generation_requests 테이블에서 모든 레코드 조회 (최신순)
    console.log('[Step 1] 데이터베이스에서 생성 기록 조회 중...');
    const { data: allRecords, error: fetchError } = await supabase
      .from('generation_requests')
      .select('id, result_file_path, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 데이터베이스 조회 실패:', fetchError);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      console.log('ℹ️  생성 기록이 없습니다.');
      return;
    }

    console.log(`✓ 총 ${allRecords.length}개 레코드 발견\n`);

    // 2. Storage에서 실제 파일 목록 조회
    console.log('[Step 2] Storage에서 파일 목록 조회 중...');
    const { data: storageFiles, error: listError } = await supabase.storage
      .from('templates')
      .list('generated', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (listError) {
      console.error('❌ Storage 파일 목록 조회 실패:', listError);
      return;
    }

    if (!storageFiles || storageFiles.length === 0) {
      console.log('ℹ️  Storage에 파일이 없습니다.');
      return;
    }

    console.log(`✓ Storage에 ${storageFiles.length}개 파일 발견\n`);

    // 3. 최근 20개를 제외한 DB 레코드 삭제
    if (allRecords.length > 20) {
      const recordsToDelete = allRecords.slice(20);
      const idsToDelete = recordsToDelete.map(r => r.id);

      console.log(`[Step 3] 데이터베이스에서 오래된 ${recordsToDelete.length}개 레코드 삭제 중...`);

      const { error: deleteError } = await supabase
        .from('generation_requests')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('❌ DB 레코드 삭제 실패:', deleteError);
      } else {
        console.log(`✓ ${recordsToDelete.length}개 레코드 삭제 완료\n`);
      }
    } else {
      console.log('[Step 3] 20개 이하이므로 DB 레코드 삭제 건너뜀\n');
    }

    // 4. Storage에서 최근 20개를 제외한 파일 삭제
    if (storageFiles.length > 20) {
      const filesToDelete = storageFiles.slice(20);
      const filePathsToDelete = filesToDelete.map(f => `generated/${f.name}`);

      console.log(`[Step 4] Storage에서 오래된 ${filesToDelete.length}개 파일 삭제 중...`);
      console.log('삭제할 파일들:');
      filesToDelete.forEach((f, idx) => {
        console.log(`  ${idx + 1}. ${f.name} (${new Date(f.created_at).toLocaleString('ko-KR')})`);
      });
      console.log('');

      const { error: storageDeleteError } = await supabase.storage
        .from('templates')
        .remove(filePathsToDelete);

      if (storageDeleteError) {
        console.error('❌ Storage 파일 삭제 실패:', storageDeleteError);
      } else {
        console.log(`✓ ${filesToDelete.length}개 파일 삭제 완료\n`);
      }
    } else {
      console.log('[Step 4] 20개 이하이므로 Storage 파일 삭제 건너뜀\n');
    }

    // 5. 최종 상태 확인
    console.log('[Step 5] 최종 상태 확인 중...');

    const { data: remainingRecords } = await supabase
      .from('generation_requests')
      .select('id')
      .order('created_at', { ascending: false });

    const { data: remainingFiles } = await supabase.storage
      .from('templates')
      .list('generated', { limit: 100 });

    console.log(`✓ 남은 DB 레코드: ${remainingRecords?.length || 0}개`);
    console.log(`✓ 남은 Storage 파일: ${remainingFiles?.length || 0}개`);

    console.log('\n========================================');
    console.log('✅ 정리 완료!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 예상치 못한 오류 발생:', error);
  }
}

// 스크립트 실행
cleanupOldFiles();
