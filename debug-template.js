// 템플릿 상세 디버깅
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'A.pptx');
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);

// slide1.xml의 XML 구조를 자세히 분석
const slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';

console.log('='.repeat(80));
console.log('slide1.xml 원본 XML (처음 3000자):');
console.log('='.repeat(80));
console.log(slide1.substring(0, 3000));

console.log('\n' + '='.repeat(80));
console.log('<a:t> 태그 그룹 찾기:');
console.log('='.repeat(80));

// 새로운 정규식 테스트
const tGroupRegex = /(<a:t[^>]*>[^<]*<\/a:t>(?:\s|<[^>]*>)*)+/g;
const groups = slide1.match(tGroupRegex);

if (groups) {
  console.log(`총 ${groups.length}개의 <a:t> 태그 그룹 발견\n`);

  groups.forEach((group, i) => {
    // 각 그룹의 텍스트 추출
    const textMatches = group.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
      const combinedText = textMatches
        .map(tag => tag.replace(/<a:t[^>]*>([^<]*)<\/a:t>/, '$1'))
        .join('');

      if (combinedText.trim()) {
        console.log(`그룹 ${i + 1}:`);
        console.log(`  합친 텍스트: "${combinedText}"`);
        console.log(`  태그 수: ${textMatches.length}`);
        console.log(`  원본 그룹:\n${group.substring(0, 500)}\n`);
      }
    }
  });
} else {
  console.log('그룹을 찾을 수 없습니다!');
}

// Placeholder 검색
console.log('\n' + '='.repeat(80));
console.log('Placeholder 검색:');
console.log('='.repeat(80));

const placeholders = ["'[REGION_NAME]'", "'[NATURAL_SITE_1]'"];

placeholders.forEach(placeholder => {
  if (slide1.includes(placeholder)) {
    console.log(`✓ "${placeholder}" 발견 (분리되지 않음)`);
  } else {
    // 문자별로 찾기
    const chars = placeholder.split('');
    let allFound = true;
    chars.forEach(char => {
      if (!slide1.includes(char)) {
        allFound = false;
      }
    });

    if (allFound) {
      console.log(`⚠ "${placeholder}" 문자들은 있지만 분리되어 있음`);
    } else {
      console.log(`✗ "${placeholder}" 없음`);
    }
  }
});
