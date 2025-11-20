const PizZip = require('pizzip');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreTemplate() {
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

  // Slide 3~9의 Alt Text 제거
  const slidesToClean = ['slide3.xml', 'slide4.xml', 'slide6.xml', 'slide7.xml', 'slide8.xml', 'slide9.xml'];

  let modified = false;

  for (const slideFile of slidesToClean) {
    const slideFileName = `ppt/slides/${slideFile}`;
    let slideContent = zip.file(slideFileName)?.asText();

    if (!slideContent) continue;

    // descr 속성 제거
    const newContent = slideContent.replace(/\s+descr="[^"]*"/g, '');

    if (newContent !== slideContent) {
      zip.file(slideFileName, newContent);
      console.log(`✓ ${slideFile}의 Alt Text 제거`);
      modified = true;
    }
  }

  if (!modified) {
    console.log('변경 사항이 없습니다.');
    return;
  }

  const outputBuffer = zip.generate({ type: 'nodebuffer' });
  const outputPath = './template-slide2-only.pptx';
  fs.writeFileSync(outputPath, outputBuffer);

  console.log(`\n✅ 완료! 파일 저장됨: ${outputPath}`);
}

restoreTemplate().catch(console.error);
