const PizZip = require('pizzip');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAltTextToAllSlides() {
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

  // Alt Text 추가 매핑 (슬라이드 번호 → placeholder)
  const altTextMap = {
    'slide3.xml': '{{NATURAL_SITE_IMAGE_1}}',  // 자연명소 1 상세
    'slide4.xml': '{{NATURAL_SITE_IMAGE_2}}',  // 자연명소 2 상세
    'slide6.xml': '{{EDU_SITE_IMAGE_1}}',      // 교육시설 1 상세
    'slide7.xml': '{{EDU_SITE_IMAGE_2}}',      // 교육시설 2 상세
    'slide8.xml': '{{HISTORICAL_SITE_IMAGE_1}}', // 역사유적 1 상세
    'slide9.xml': '{{HISTORICAL_SITE_IMAGE_2}}', // 역사유적 2 상세
  };

  let modified = false;

  for (const [slideFile, placeholder] of Object.entries(altTextMap)) {
    const slideFileName = `ppt/slides/${slideFile}`;
    const slideContent = zip.file(slideFileName)?.asText();

    if (!slideContent) {
      console.log(`⚠ ${slideFile} 파일을 찾을 수 없습니다.`);
      continue;
    }

    console.log(`\n처리 중: ${slideFile}`);

    // 가장 큰 이미지 찾기 (cx, cy 값이 가장 큰 이미지)
    const picRegex = /<p:pic>[\s\S]*?<\/p:pic>/g;
    const pics = slideContent.match(picRegex) || [];

    let largestPic = null;
    let largestSize = 0;
    let largestPicIndex = -1;

    pics.forEach((pic, index) => {
      // <a:ext cx="..." cy="..."/> 에서 크기 추출
      const extMatch = pic.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
      if (extMatch) {
        const cx = parseInt(extMatch[1]);
        const cy = parseInt(extMatch[2]);
        const size = cx * cy;

        if (size > largestSize) {
          largestSize = size;
          largestPic = pic;
          largestPicIndex = index;
        }
      }
    });

    if (!largestPic) {
      console.log(`  ⚠ 이미지를 찾을 수 없습니다.`);
      continue;
    }

    console.log(`  ✓ 가장 큰 이미지 발견 (크기: ${largestSize}, 인덱스: ${largestPicIndex})`);

    // 이미 descr이 있는지 확인
    if (largestPic.includes('descr=')) {
      console.log(`  ⚠ 이미 Alt Text가 설정되어 있습니다.`);
      continue;
    }

    // <p:cNvPr id="X" name="Picture X"/> 를 찾아서 descr 추가
    const cNvPrMatch = largestPic.match(/<p:cNvPr ([^>]*)\/>/);
    if (!cNvPrMatch) {
      console.log(`  ⚠ cNvPr 태그를 찾을 수 없습니다.`);
      continue;
    }

    const originalTag = cNvPrMatch[0];
    const newTag = originalTag.replace('/>', ` descr="${placeholder}"/>`);

    const newPic = largestPic.replace(originalTag, newTag);
    const newContent = slideContent.replace(largestPic, newPic);

    zip.file(slideFileName, newContent);
    modified = true;

    console.log(`  ✅ Alt Text 추가: ${placeholder}`);
  }

  if (!modified) {
    console.log('\n변경 사항이 없습니다.');
    return;
  }

  // 수정된 템플릿 저장
  const outputBuffer = zip.generate({ type: 'nodebuffer' });
  const outputPath = './template-with-alt-text.pptx';
  fs.writeFileSync(outputPath, outputBuffer);

  console.log(`\n✅ 완료! 파일 저장됨: ${outputPath}`);
  console.log('\n다음 단계:');
  console.log('1. template-with-alt-text.pptx 파일을 PowerPoint로 열어서 확인');
  console.log('2. 문제없으면 Supabase Storage에 업로드');
}

addAltTextToAllSlides().catch(console.error);
