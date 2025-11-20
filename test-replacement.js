// 개선된 placeholder 치환 로직 테스트
const PizZip = require('pizzip');
const fs = require('fs');

/**
 * 가장 간단한 버전의 치환 함수
 */
function replacePlaceholdersSimplest(xmlContent, replacements) {
  let result = xmlContent;
  let foundCount = 0;

  for (const [placeholder, value] of Object.entries(replacements)) {
    // 1. 직접 치환 시도
    if (result.includes(placeholder)) {
      console.log(`  ✓ Direct: "${placeholder}" → "${value}"`);
      result = result.split(placeholder).join(value);
      foundCount++;
      continue;
    }

    // 2. 모든 <a:t> 태그의 내용을 하나로 합쳐서 확인
    const textRegex = /<a:t[^>]*>(.*?)<\/a:t>/g;
    const allMatches = [...result.matchAll(textRegex)];

    // 슬라이딩 윈도우 방식: 연속된 태그들을 확인
    for (let start = 0; start < allMatches.length; start++) {
      // 최대 10개의 연속 태그까지 확인
      for (let len = 1; len <= Math.min(10, allMatches.length - start); len++) {
        // start부터 len개의 태그 텍스트 합치기
        let combined = '';
        for (let i = start; i < start + len; i++) {
          combined += allMatches[i][1];
        }

        // placeholder가 있는지 확인
        if (combined.includes(placeholder)) {
          console.log(`  ✓ Merged ${len} tags: "${placeholder}" → "${value}"`);

          // 치환된 텍스트 생성
          const replaced = combined.replace(placeholder, value);

          // 첫 번째 태그에 모든 텍스트를 넣고 나머지는 비움
          let tagIndex = 0;
          result = result.replace(/<a:t([^>]*)>(.*?)<\/a:t>/g, (match, attrs, text) => {
            if (tagIndex === start) {
              tagIndex++;
              return `<a:t${attrs}>${replaced}</a:t>`;
            } else if (tagIndex > start && tagIndex < start + len) {
              tagIndex++;
              return `<a:t${attrs}></a:t>`;
            } else {
              tagIndex++;
              return match;
            }
          });

          foundCount++;
          break;
        }
      }
      if (foundCount > 0) break;
    }
  }

  return { result, foundCount };
}

// 테스트 케이스들
const testCases = [
  {
    name: "Case 1: 분리되지 않은 텍스트",
    xml: `<a:p><a:r><a:t>'[REGION_NAME]'</a:t></a:r></a:p>`,
    expected: "서울특별시"
  },
  {
    name: "Case 2: 3개로 분리된 텍스트",
    xml: `<a:p><a:r><a:t>'[</a:t></a:r><a:r><a:t>REGION_NAME</a:t></a:r><a:r><a:t>]'</a:t></a:r></a:p>`,
    expected: "서울특별시"
  },
  {
    name: "Case 3: 2개로 분리된 텍스트",
    xml: `<a:p><a:r><a:t>'[REGION_</a:t></a:r><a:r><a:t>NAME]'</a:t></a:r></a:p>`,
    expected: "서울특별시"
  },
  {
    name: "Case 4: 여러 개가 심하게 분리된 경우",
    xml: `<a:p><a:r><a:t>'</a:t></a:r><a:r><a:t>[</a:t></a:r><a:r><a:t>R</a:t></a:r><a:r><a:t>E</a:t></a:r><a:r><a:t>GION_NAME</a:t></a:r><a:r><a:t>]</a:t></a:r><a:r><a:t>'</a:t></a:r></a:p>`,
    expected: "서울특별시"
  }
];

const replacements = {
  "'[REGION_NAME]'": "서울특별시",
  "'[SCHOOL_NAME]'": "수업자료",
};

console.log("=" . repeat(80));
console.log("Placeholder 치환 테스트");
console.log("=" . repeat(80));

testCases.forEach(testCase => {
  console.log(`\n${testCase.name}:`);
  console.log(`  원본 XML: ${testCase.xml.substring(0, 100)}...`);

  const { result, foundCount } = replacePlaceholdersSimplest(testCase.xml, replacements);

  console.log(`  결과: ${result.substring(0, 100)}...`);
  console.log(`  치환 개수: ${foundCount}`);

  // 결과에 expected 값이 포함되어 있는지 확인
  if (result.includes(testCase.expected)) {
    console.log(`  ✅ 성공: "${testCase.expected}"가 포함됨`);
  } else {
    console.log(`  ❌ 실패: "${testCase.expected}"를 찾을 수 없음`);
  }
});

console.log("\n" + "=" . repeat(80));
console.log("복잡한 실제 케이스 테스트");
console.log("=" . repeat(80));

// 실제 PowerPoint에서 나올 수 있는 복잡한 구조
const complexCase = `
<p:txBody>
  <a:bodyPr/>
  <a:lstStyle/>
  <a:p>
    <a:pPr algn="ctr">
      <a:lnSpc>
        <a:spcPct val="100000"/>
      </a:lnSpc>
    </a:pPr>
    <a:r>
      <a:rPr lang="ko-KR" altLang="en-US" sz="8000" b="1">
        <a:solidFill>
          <a:srgbClr val="FFFFFF"/>
        </a:solidFill>
        <a:latin typeface="+mn-lt"/>
        <a:ea typeface="+mn-ea"/>
      </a:rPr>
      <a:t>'[</a:t>
    </a:r>
    <a:r>
      <a:rPr lang="ko-KR" altLang="en-US" sz="8000" b="1">
        <a:solidFill>
          <a:srgbClr val="FFFFFF"/>
        </a:solidFill>
        <a:latin typeface="+mn-lt"/>
        <a:ea typeface="+mn-ea"/>
      </a:rPr>
      <a:t>REGION_NAME</a:t>
    </a:r>
    <a:r>
      <a:rPr lang="ko-KR" altLang="en-US" sz="8000" b="1">
        <a:solidFill>
          <a:srgbClr val="FFFFFF"/>
        </a:solidFill>
        <a:latin typeface="+mn-lt"/>
        <a:ea typeface="+mn-ea"/>
      </a:rPr>
      <a:t>]'</a:t>
    </a:r>
  </a:p>
</p:txBody>
`;

console.log("\n실제 PowerPoint XML 구조:");
const { result: complexResult, foundCount: complexFound } = replacePlaceholdersSimplest(complexCase, replacements);

if (complexResult.includes("서울특별시")) {
  console.log("✅ 복잡한 구조에서도 치환 성공!");

  // 치환된 부분 추출해서 보여주기
  const textMatches = complexResult.match(/<a:t[^>]*>(.*?)<\/a:t>/g);
  if (textMatches) {
    console.log("\n치환 후 <a:t> 태그들:");
    textMatches.forEach((match, i) => {
      const text = match.replace(/<a:t[^>]*>(.*?)<\/a:t>/, '$1');
      if (text) {
        console.log(`  태그 ${i + 1}: "${text}"`);
      }
    });
  }
} else {
  console.log("❌ 복잡한 구조에서 치환 실패");
}

console.log("\n" + "=" . repeat(80));
console.log("테스트 완료!");
console.log("=" . repeat(80));