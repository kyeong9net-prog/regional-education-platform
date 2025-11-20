const PizZip = require('pizzip');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDescr() {
  console.log('Supabase에서 최신 템플릿 다운로드 중...\n');

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!templates || templates.length === 0) {
    console.log('템플릿을 찾을 수 없습니다.');
    return;
  }

  const template = templates[0];
  console.log(`템플릿: ${template.title}`);
  console.log(`파일: ${template.file_path}\n`);

  const { data: signedUrlData } = await supabase.storage
    .from('templates')
    .createSignedUrl(template.file_path, 60);

  if (!signedUrlData?.signedUrl) {
    console.log('다운로드 URL 생성 실패');
    return;
  }

  const response = await fetch(signedUrlData.signedUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new PizZip(buffer);

  console.log('================================================================================');
  console.log('이미지 대체 텍스트(Alt Text) 검색 결과:');
  console.log('================================================================================\n');

  const slides = Object.keys(zip.files)
    .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort();

  let totalImagesWithDescr = 0;
  let totalImages = 0;

  slides.forEach(slideName => {
    const slideNum = slideName.match(/slide(\d+)\.xml$/)[1];
    const content = zip.file(slideName).asText();

    // 모든 이미지 찾기
    const allImages = content.match(/<p:cNvPr[^>]*id="\d+"[^>]*name="[^"]*"[^>]*>/g) || [];
    totalImages += allImages.length;

    // descr 속성 있는 이미지 찾기
    const descrMatches = content.match(/<p:cNvPr[^>]*descr="([^"]+)"[^>]*>/g);

    if (descrMatches && descrMatches.length > 0) {
      console.log(`Slide ${slideNum}: ${descrMatches.length}개 이미지에 대체 텍스트 설정됨`);
      descrMatches.forEach(match => {
        const descr = match.match(/descr="([^"]+)"/)[1];
        console.log(`  ✅ ${descr}`);
        totalImagesWithDescr++;
      });
      console.log('');
    }
  });

  console.log('================================================================================');
  console.log(`총 이미지 수: ${totalImages}개`);
  console.log(`대체 텍스트 설정된 이미지: ${totalImagesWithDescr}개`);

  if (totalImagesWithDescr === 0) {
    console.log('\n⚠️  경고: 대체 텍스트가 설정된 이미지가 없습니다!');
    console.log('PowerPoint에서 이미지 우클릭 → "그림 서식" → "대체 텍스트"에 placeholder 입력 필요');
  } else {
    console.log('\n✅ 이미지 교체 준비 완료!');
  }
  console.log('================================================================================');
}

checkDescr().catch(console.error);
