const { createClient } = require('@supabase/supabase-js');
const PizZip = require('pizzip');

const supabase = createClient(
  'https://unecftmielwzlclitatx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWNmdG1pZWx3emxjbGl0YXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NzAxODIsImV4cCI6MjA3NzU0NjE4Mn0.ugdtaamBaYfNMK_eS3J3lrPre5-mdsg4gF2FTFmgmCY'
);

async function main() {
  // 템플릿 목록 가져오기
  const { data: templates, error } = await supabase
    .from('templates')
    .select('id, title, file_path')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching templates:', error);
    return;
  }

  console.log('\n=== 템플릿 목록 ===');
  templates.forEach((t, i) => {
    console.log(`${i + 1}. ${t.title} (ID: ${t.id})`);
    console.log(`   파일: ${t.file_path}`);
  });

  // 가장 최근 템플릿 분석
  if (templates.length === 0) {
    console.log('\n템플릿이 없습니다.');
    return;
  }

  const template = templates[0];
  console.log(`\n\n=== "${template.title}" 템플릿 분석 ===`);

  // 템플릿 파일 다운로드
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('templates')
    .download(template.file_path);

  if (downloadError) {
    console.error('Error downloading template:', downloadError);
    return;
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const zip = new PizZip(buffer);

  // 슬라이드 파일 찾기
  const slideFiles = Object.keys(zip.files).filter(
    (fileName) => fileName.match(/^ppt\/slides\/slide\d+\.xml$/)
  );

  console.log(`\n슬라이드 개수: ${slideFiles.length}`);

  // 각 슬라이드의 이미지 placeholder 추출
  for (const slideFile of slideFiles) {
    const slideNumber = parseInt(slideFile.match(/slide(\d+)\.xml$/)[1]);
    const slideContent = zip.file(slideFile)?.asText();

    if (!slideContent) continue;

    console.log(`\n--- 슬라이드 ${slideNumber} ---`);

    // 이미지 placeholder 찾기
    const picRegex = /<p:pic>[\s\S]*?<\/p:pic>/g;
    const pics = slideContent.match(picRegex) || [];

    console.log(`  총 이미지 개수: ${pics.length}`);
    pics.forEach((pic, index) => {
      const cNvPrMatch = pic.match(/<p:cNvPr ([^>]*)\/>/);
      if (!cNvPrMatch) {
        console.log(`  이미지 ${index + 1}: cNvPr 태그 없음`);
        return;
      }

      const attributes = cNvPrMatch[1];
      const descrMatch = attributes.match(/descr="([^"]*)"/);
      const nameMatch = attributes.match(/name="([^"]*)"/);

      console.log(`  이미지 ${index + 1}:`);
      console.log(`    name="${nameMatch ? nameMatch[1] : '없음'}"`);
      console.log(`    descr="${descrMatch && descrMatch[1].trim() ? descrMatch[1] : '없음'}"`);
    });

    // 텍스트 placeholder 찾기 (처음 5개만)
    const textPlaceholderRegex = /\{\{([A-Z_0-9]+)\}\}/g;
    const textPlaceholders = [];
    let match;
    while ((match = textPlaceholderRegex.exec(slideContent)) !== null) {
      textPlaceholders.push(match[0]);
      if (textPlaceholders.length >= 5) break;
    }

    if (textPlaceholders.length > 0) {
      console.log(`  텍스트 placeholder: ${textPlaceholders.join(', ')}`);
    }
  }
}

main().catch(console.error);
