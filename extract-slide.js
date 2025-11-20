// 슬라이드 XML 내용 추출
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'A.pptx');
const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);

// slide2.xml 내용 추출 (가장 큰 파일)
const slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';

console.log('='.repeat(80));
console.log('slide2.xml 내용 (처음 2000자):');
console.log('='.repeat(80));
console.log(slide2.substring(0, 2000));

console.log('\n' + '='.repeat(80));
console.log('텍스트 관련 태그 검색:');
console.log('='.repeat(80));

// 다양한 텍스트 태그 검색
const tagPatterns = [
  { name: '<a:t>', regex: /<a:t[^>]*>/g },
  { name: '<p:txBody>', regex: /<p:txBody[^>]*>/g },
  { name: '<a:p>', regex: /<a:p[^>]*>/g },
  { name: '<a:r>', regex: /<a:r[^>]*>/g },
  { name: 'CDATA', regex: /<!\[CDATA\[/g },
];

tagPatterns.forEach(({ name, regex }) => {
  const matches = slide2.match(regex);
  if (matches) {
    console.log(`${name}: ${matches.length}개 발견`);
  } else {
    console.log(`${name}: 없음`);
  }
});

// <p:txBody> 섹션 찾기
console.log('\n' + '='.repeat(80));
console.log('<p:txBody> 섹션 샘플:');
console.log('='.repeat(80));
const txBodyIndex = slide2.indexOf('<p:txBody>');
if (txBodyIndex !== -1) {
  console.log(slide2.substring(txBodyIndex, txBodyIndex + 1000));
} else {
  console.log('<p:txBody> 태그를 찾을 수 없습니다!');
}
