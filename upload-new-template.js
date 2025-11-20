const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadTemplate() {
  const filePath = './template-slide2-only.pptx';
  const title = '지역의 여러장소 알아보기';

  console.log('템플릿 업로드 중...\n');

  // 파일 읽기
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.pptx`;
  const storagePath = `${fileName}`;

  // 1. 기존 템플릿 삭제
  const { data: existingTemplates } = await supabase
    .from('templates')
    .select('*')
    .eq('title', title);

  if (existingTemplates && existingTemplates.length > 0) {
    for (const template of existingTemplates) {
      // Storage에서 파일 삭제
      await supabase.storage
        .from('templates')
        .remove([template.file_path]);

      // DB에서 레코드 삭제
      await supabase
        .from('templates')
        .delete()
        .eq('id', template.id);

      console.log(`✓ 기존 템플릿 삭제: ${template.file_path}`);
    }
  }

  // 2. Storage에 파일 업로드
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('templates')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      upsert: true
    });

  if (uploadError) {
    console.error('업로드 오류:', uploadError);
    return;
  }

  console.log(`✓ 파일 업로드 완료: ${storagePath}`);

  // 3. DB에 템플릿 정보 저장
  const { data: insertData, error: insertError } = await supabase
    .from('templates')
    .insert({
      title: title,
      description: '지역별 관광지를 소개하는 교육용 PPT 템플릿 (이미지 자동 교체 지원)',
      file_path: storagePath,
      thumbnail_url: null,
      category: 'education',
      is_active: true
    })
    .select()
    .single();

  if (insertError) {
    console.error('DB 저장 오류:', insertError);
    return;
  }

  console.log(`✓ DB에 템플릿 저장 완료`);
  console.log(`\n✅ 템플릿 업로드 성공!`);
  console.log(`   ID: ${insertData.id}`);
  console.log(`   제목: ${insertData.title}`);
  console.log(`   경로: ${insertData.file_path}`);
}

uploadTemplate().catch(console.error);
