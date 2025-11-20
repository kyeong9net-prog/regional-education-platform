// 템플릿의 실제 Placeholder와 코드에서 사용하는 Placeholder 비교
const fs = require('fs');

console.log('='.repeat(80));
console.log('Placeholder 비교 분석');
console.log('='.repeat(80));

// 1. 템플릿에서 발견된 실제 Placeholder (분석 결과에서)
const templatePlaceholders = new Set([
  '{{REGION}}',
  '{{NATURAL_SITE_1}}',
  '{{NATURAL_SITE_2}}',
  '{{EDU_SITE_1}}',
  '{{EDU_SITE_2}}',
  '{{HISTORI_SITE_1}}',  // 템플릿에서는 HISTORI (오타)
  '{{HISTORI_SITE_2}}',  // 템플릿에서는 HISTORI (오타)
  '{{NATURAL_SITE_1-1}}',
  '{{NATURAL_SITE_1_DESC}}'
]);

// 2. 코드에서 사용하는 Placeholder (route.ts에서)
const codePlaceholders = new Set([
  // 기본 정보
  '{{REGION}}',
  '{{SCHOOL}}',
  '{{TITLE}}',
  '{{DATE}}',

  // 자연 명소
  '{{NATURAL_SITE_1}}',
  '{{NATURAL_SITE_2}}',

  // 교육/문화 시설
  '{{EDU_SITE_1}}',
  '{{EDU_SITE_2}}',

  // 역사 명소 (코드에서는 HISTORICAL)
  '{{HISTORICAL_SITE_1}}',
  '{{HISTORICAL_SITE_2}}',

  // 이미지 placeholder
  '{{NATURAL_SITE_IMAGE_1}}',
  '{{NATURAL_SITE_IMAGE_2}}',
  '{{EDU_SITE_IMAGE_1}}',
  '{{EDU_SITE_IMAGE_2}}',
  '{{HISTORICAL_SITE_IMAGE_1}}',
  '{{HISTORICAL_SITE_IMAGE_2}}'
]);

console.log('\n## 1. 템플릿에 있는 Placeholder (실제 파일에서 발견됨)');
console.log(`총 ${templatePlaceholders.size}개:\n`);
Array.from(templatePlaceholders).sort().forEach((p, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${p}`);
});

console.log('\n## 2. 코드에서 사용하는 Placeholder (route.ts)');
console.log(`총 ${codePlaceholders.size}개:\n`);
Array.from(codePlaceholders).sort().forEach((p, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${p}`);
});

// 3. 불일치 분석
console.log('\n' + '='.repeat(80));
console.log('불일치 분석');
console.log('='.repeat(80));

// 템플릿에는 있지만 코드에 없는 것
const inTemplateNotInCode = Array.from(templatePlaceholders).filter(p => !codePlaceholders.has(p));

console.log('\n### A. 템플릿에는 있지만 코드에서 사용하지 않는 Placeholder:');
if (inTemplateNotInCode.length === 0) {
  console.log('  (없음)');
} else {
  console.log(`  총 ${inTemplateNotInCode.length}개:\n`);
  inTemplateNotInCode.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p} ⚠ 코드에서 값을 제공하지 않음`);
  });
}

// 코드에는 있지만 템플릿에 없는 것
const inCodeNotInTemplate = Array.from(codePlaceholders).filter(p => !templatePlaceholders.has(p));

console.log('\n### B. 코드에서 사용하지만 템플릿에 없는 Placeholder:');
if (inCodeNotInTemplate.length === 0) {
  console.log('  (없음)');
} else {
  console.log(`  총 ${inCodeNotInTemplate.length}개:\n`);
  inCodeNotInTemplate.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p} ⚠ 템플릿에 적용되지 않음`);
  });
}

// 4. 오타 감지
console.log('\n### C. 오타로 추정되는 Placeholder:');
console.log('\n  발견된 오타:');
console.log('  - 템플릿: {{HISTORI_SITE_1}}, {{HISTORI_SITE_2}}');
console.log('  - 코드:    {{HISTORICAL_SITE_1}}, {{HISTORICAL_SITE_2}}');
console.log('  ⚠ "HISTORI" vs "HISTORICAL" 불일치!');
console.log('  → 템플릿을 수정하거나 코드를 수정해야 합니다.');

// 5. 특이사항
console.log('\n### D. 특이사항:');
console.log('\n  1. {{NATURAL_SITE_1-1}} - 템플릿에만 존재');
console.log('     용도: 불명확. 제목용? 부제목용?');
console.log('\n  2. {{NATURAL_SITE_1_DESC}} - 템플릿에만 존재');
console.log('     용도: NATURAL_SITE_1의 설명(description)으로 추정');
console.log('\n  3. 이미지 Placeholder는 모두 코드에만 존재');
console.log('     - 템플릿에 이미지의 대체 텍스트(descr 속성)가 없음');
console.log('     - replaceExistingImages() 함수가 작동하지 않을 수 있음');

// 6. 권장 수정사항
console.log('\n' + '='.repeat(80));
console.log('권장 수정사항');
console.log('='.repeat(80));

console.log('\n### 방법 1: 템플릿 수정 (권장)');
console.log('\n  A. PowerPoint 템플릿 파일 열기');
console.log('  B. 다음 텍스트 수정:');
console.log('     - {{HISTORI_SITE_1}} → {{HISTORICAL_SITE_1}}');
console.log('     - {{HISTORI_SITE_2}} → {{HISTORICAL_SITE_2}}');
console.log('\n  C. 코드에서 사용할 추가 placeholder 반영:');
console.log('     - {{NATURAL_SITE_1-1}} → {{NATURAL_SITE_1}} (통일)');
console.log('     - {{NATURAL_SITE_1_DESC}} 용도 확인 및 매핑');
console.log('\n  D. 이미지에 대체 텍스트(Alt Text) 추가:');
console.log('     1. 이미지 우클릭 → 그림 서식');
console.log('     2. 대체 텍스트 입력:');
console.log('        - {{NATURAL_SITE_IMAGE_1}}');
console.log('        - {{NATURAL_SITE_IMAGE_2}}');
console.log('        - {{EDU_SITE_IMAGE_1}}');
console.log('        - {{EDU_SITE_IMAGE_2}}');
console.log('        - {{HISTORICAL_SITE_IMAGE_1}}');
console.log('        - {{HISTORICAL_SITE_IMAGE_2}}');

console.log('\n### 방법 2: 코드 수정 (임시 해결)');
console.log('\n  route.ts의 replacements 객체에 추가:');
console.log('  ```typescript');
console.log('  const replacements = {');
console.log('    // 기존...');
console.log('    ');
console.log('    // 템플릿의 오타 대응');
console.log('    "{{HISTORI_SITE_1}}": historicalSite1,');
console.log('    "{{HISTORI_SITE_2}}": historicalSite2,');
console.log('    ');
console.log('    // 템플릿의 추가 placeholder');
console.log('    "{{NATURAL_SITE_1-1}}": naturalSite1, // 또는 별도 값');
console.log('    "{{NATURAL_SITE_1_DESC}}": tourismData?.naturalSpots?.[0]?.description || "",');
console.log('  };');
console.log('  ```');

console.log('\n' + '='.repeat(80));
console.log('요약');
console.log('='.repeat(80));

console.log('\n  - 템플릿 Placeholder: ' + templatePlaceholders.size + '개');
console.log('  - 코드 Placeholder: ' + codePlaceholders.size + '개');
console.log('  - 일치하는 것: ' + Array.from(templatePlaceholders).filter(p => codePlaceholders.has(p)).length + '개');
console.log('  - 불일치: ' + (inTemplateNotInCode.length + inCodeNotInTemplate.length) + '개');
console.log('  - 주요 문제: HISTORI vs HISTORICAL 오타');

console.log('\n');
