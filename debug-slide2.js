const PizZip = require('pizzip');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugSlide2() {
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
  const { data: signedUrlData } = await supabase.storage
    .from('templates')
    .createSignedUrl(template.file_path, 60);

  const response = await fetch(signedUrlData.signedUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new PizZip(buffer);

  const slide2Content = zip.file('ppt/slides/slide2.xml')?.asText() || '';

  console.log('================================================================================');
  console.log('Slide2.xml에서 <p:cNvPr> 태그 검색:');
  console.log('================================================================================\n');

  // <p:cNvPr>로 시작하는 모든 태그 찾기 (여러 줄에 걸쳐 있을 수 있음)
  const cNvPrRegex = /<p:cNvPr[^>]*>/g;
  const matches = slide2Content.match(cNvPrRegex);

  if (matches) {
    console.log(`총 ${matches.length}개의 <p:cNvPr> 태그 발견:\n`);
    matches.forEach((match, index) => {
      console.log(`${index + 1}. ${match}`);

      // descr 속성이 있는지 확인
      const descrMatch = match.match(/descr="([^"]*)"/);
      if (descrMatch) {
        console.log(`   ✅ descr="${descrMatch[1]}"`);
      } else {
        console.log(`   ❌ descr 속성 없음`);
      }
      console.log('');
    });
  } else {
    console.log('❌ <p:cNvPr> 태그를 찾을 수 없습니다.');
  }

  console.log('================================================================================');
  console.log('직접 "descr=" 문자열 검색:');
  console.log('================================================================================\n');

  const descrMatches = slide2Content.match(/descr="[^"]*"/g);
  if (descrMatches) {
    console.log(`총 ${descrMatches.length}개 발견:\n`);
    descrMatches.forEach((match, index) => {
      console.log(`${index + 1}. ${match}`);
    });
  } else {
    console.log('❌ descr 속성을 찾을 수 없습니다.');
  }
}

debugSlide2().catch(console.error);
