// PPTX 템플릿 분석 스크립트
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'A.pptx');

console.log('='.repeat(80));
console.log('PPTX 템플릿 분석 시작');
console.log('='.repeat(80));

try {
  // 파일 읽기
  const content = fs.readFileSync(templatePath);
  console.log(`✓ 파일 크기: ${content.length} bytes`);

  // ZIP으로 파싱
  const zip = new PizZip(content);
  console.log('✓ ZIP 파싱 성공');

  // 모든 파일 목록
  const allFiles = Object.keys(zip.files);
  console.log(`✓ 총 ${allFiles.length}개 파일 발견`);

  // 슬라이드 파일만 필터링
  const slideFiles = allFiles.filter(name =>
    name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
  );

  console.log('\n' + '='.repeat(80));
  console.log(`슬라이드 파일: ${slideFiles.length}개`);
  console.log('='.repeat(80));
  slideFiles.forEach(f => console.log(`  - ${f}`));

  // 각 슬라이드 분석
  slideFiles.forEach((fileName, index) => {
    console.log('\n' + '='.repeat(80));
    console.log(`슬라이드 ${index + 1}: ${fileName}`);
    console.log('='.repeat(80));

    const xmlContent = zip.file(fileName)?.asText() || '';

    if (!xmlContent) {
      console.log('⚠ 내용이 비어있습니다!');
      return;
    }

    console.log(`파일 크기: ${xmlContent.length} 문자`);

    // <a:t> 태그 찾기
    const atTagRegex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
    const matches = [];
    let match;

    while ((match = atTagRegex.exec(xmlContent)) !== null) {
      matches.push(match[1]);
    }

    if (matches.length === 0) {
      console.log('⚠ <a:t> 태그에 텍스트가 없습니다!');

      // 빈 <a:t> 태그가 있는지 확인
      const emptyTags = xmlContent.match(/<a:t[^>]*>/g);
      if (emptyTags) {
        console.log(`  - 빈 <a:t> 태그 ${emptyTags.length}개 발견`);
        console.log('  - 첫 번째 태그 주변:');
        const firstIndex = xmlContent.indexOf('<a:t');
        if (firstIndex !== -1) {
          console.log(xmlContent.substring(firstIndex, firstIndex + 300));
        }
      } else {
        console.log('  - <a:t> 태그 자체가 없습니다!');
      }
    } else {
      console.log(`✓ ${matches.length}개의 텍스트 발견:`);
      matches.forEach((text, i) => {
        if (text.trim()) {
          console.log(`  ${i + 1}. "${text}"`);
        }
      });

      // Placeholder 찾기
      const allText = matches.join(' ');
      const placeholders = [
        "'[REGION_NAME]'",
        "'[SCHOOL_NAME]'",
        "'[TEMPLATE_TITLE]'",
        "'[DATE]'",
        "'[NATURAL_SITE_IMAGE_1]'",
        "'[NATURAL_SITE_IMAGE_2]'",
        "'[EDU_SITE_IMAGE_1]'",
        "'[EDU_SITE_IMAGE_2]'",
        "'[HISTORICAL_SITE_IMAGE_1]'",
        "'[HISTORICAL_SITE_IMAGE_2]'",
        "'[NATURAL_SITE_1]'",
        "'[NATURAL_SITE_2]'",
        "'[EDU_SITE_1]'",
        "'[EDU_SITE_2]'",
        "'[HISTORICAL_SITE_1]'",
        "'[HISTORICAL_SITE_2]'",
        '{{지역명}}',
        '{{학교명}}',
        '{{템플릿제목}}',
        '{{날짜}}'
      ];

      const foundPlaceholders = placeholders.filter(p => allText.includes(p));
      if (foundPlaceholders.length > 0) {
        console.log('\n✓ 발견된 Placeholder:');
        foundPlaceholders.forEach(p => console.log(`  - ${p}`));
      } else {
        console.log('\n⚠ Placeholder가 발견되지 않았습니다!');
      }
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('분석 완료');
  console.log('='.repeat(80));

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
  console.error(error.stack);
}
