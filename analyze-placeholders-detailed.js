// Supabase Storage에서 템플릿 다운로드 및 상세 Placeholder 분석
const { createClient } = require('@supabase/supabase-js');
const PizZip = require('pizzip');
const fs = require('fs');

const supabaseUrl = 'https://unecftmielwzlclitatx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWNmdG1pZWx3emxjbGl0YXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NzAxODIsImV4cCI6MjA3NzU0NjE4Mn0.ugdtaamBaYfNMK_eS3J3lrPre5-mdsg4gF2FTFmgmCY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzePlaceholders() {
  console.log('='.repeat(80));
  console.log('Supabase Storage에서 템플릿 다운로드 및 상세 분석');
  console.log('='.repeat(80));
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Bucket: templates`);
  console.log(`File: 1762081339012-1uq0q8c6rtv.pptx\n`);

  try {
    // Signed URL로 다운로드
    const filePath = '1762081339012-1uq0q8c6rtv.pptx';
    const { data: signedUrlData, error } = await supabase.storage
      .from('templates')
      .createSignedUrl(filePath, 60);

    if (error) {
      console.error('Signed URL 생성 오류:', error);
      return;
    }

    console.log(`Signed URL 생성 완료`);
    console.log(`다운로드 중...\n`);

    const response = await fetch(signedUrlData.signedUrl);
    if (!response.ok) {
      console.error('다운로드 실패:', response.status, response.statusText);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`✓ 다운로드 완료: ${buffer.length} bytes\n`);

    // ZIP 파일로 파싱
    const zip = new PizZip(buffer);

    // 모든 슬라이드 파일 찾기
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)[1]);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)[1]);
        return numA - numB;
      });

    console.log(`발견된 슬라이드: ${slideFiles.length}개\n`);

    // 전체 결과를 저장할 객체
    const results = {
      textPlaceholders: {},
      imagePlaceholders: {},
      allPlaceholders: new Set(),
      slideDetails: {}
    };

    // 각 슬라이드 분석
    for (const slideFile of slideFiles) {
      const slideName = slideFile.match(/slide(\d+)\.xml/)[0];
      const slideNum = slideFile.match(/slide(\d+)\.xml/)[1];

      const slideXml = zip.file(slideFile).asText();

      // 슬라이드 상세 정보 저장
      results.slideDetails[slideName] = {
        textPlaceholders: [],
        imagePlaceholders: [],
        allDescr: []
      };

      // 1. 텍스트 Placeholder 찾기 ({{...}} 형식)
      const tTagRegex = /<a:t[^>]*>([^<]*)<\/a:t>/g;
      let match;
      let fullText = '';

      while ((match = tTagRegex.exec(slideXml)) !== null) {
        fullText += match[1];
      }

      // {{...}} 패턴 찾기
      const placeholderRegex = /\{\{([^}]+)\}\}/g;
      while ((match = placeholderRegex.exec(fullText)) !== null) {
        const placeholder = `{{${match[1]}}}`;
        results.slideDetails[slideName].textPlaceholders.push(placeholder);
        results.allPlaceholders.add(placeholder);
      }

      if (!results.textPlaceholders[slideName]) {
        results.textPlaceholders[slideName] = [];
      }
      results.textPlaceholders[slideName] = results.slideDetails[slideName].textPlaceholders;

      // 2. 이미지 관련 모든 속성 찾기
      // <p:cNvPr 태그의 모든 속성 추출
      const cNvPrRegex = /<p:cNvPr([^>]+)>/g;
      while ((match = cNvPrRegex.exec(slideXml)) !== null) {
        const attributes = match[1];

        // name 속성
        const nameMatch = attributes.match(/name="([^"]+)"/);
        const name = nameMatch ? nameMatch[1] : '';

        // descr 속성
        const descrMatch = attributes.match(/descr="([^"]+)"/);
        const descr = descrMatch ? descrMatch[1] : '';

        if (descr) {
          results.slideDetails[slideName].allDescr.push({
            name: name,
            descr: descr
          });

          // descr 안에서 {{...}} 패턴 찾기
          const descrPlaceholderRegex = /\{\{([^}]+)\}\}/g;
          let descrMatch2;
          while ((descrMatch2 = descrPlaceholderRegex.exec(descr)) !== null) {
            const placeholder = `{{${descrMatch2[1]}}}`;
            results.slideDetails[slideName].imagePlaceholders.push(placeholder);
            results.allPlaceholders.add(placeholder);
          }
        }
      }

      if (results.slideDetails[slideName].imagePlaceholders.length > 0) {
        results.imagePlaceholders[slideName] = results.slideDetails[slideName].imagePlaceholders;
      }
    }

    // 최종 결과 출력
    console.log('='.repeat(80));
    console.log('분석 결과');
    console.log('='.repeat(80));

    console.log('\n## 슬라이드별 상세 정보\n');

    for (let i = 1; i <= slideFiles.length; i++) {
      const slideName = `slide${i}.xml`;
      const details = results.slideDetails[slideName];

      if (!details) continue;

      console.log(`### Slide ${i} (${slideName})`);

      if (details.textPlaceholders.length > 0) {
        console.log(`\n**텍스트 Placeholder:**`);
        const uniqueText = [...new Set(details.textPlaceholders)];
        uniqueText.forEach(p => console.log(`  - ${p}`));
      }

      if (details.imagePlaceholders.length > 0) {
        console.log(`\n**이미지 Placeholder (descr):**`);
        const uniqueImage = [...new Set(details.imagePlaceholders)];
        uniqueImage.forEach(p => console.log(`  - ${p}`));
      }

      if (details.allDescr.length > 0) {
        console.log(`\n**모든 descr 속성:**`);
        details.allDescr.forEach(d => {
          console.log(`  - name: "${d.name}"`);
          console.log(`    descr: "${d.descr}"`);
        });
      }

      if (details.textPlaceholders.length === 0 &&
          details.imagePlaceholders.length === 0 &&
          details.allDescr.length === 0) {
        console.log('  (Placeholder 및 descr 없음)');
      }

      console.log();
    }

    // 전체 요약
    console.log('='.repeat(80));
    console.log('전체 요약');
    console.log('='.repeat(80));

    console.log('\n### 전체 고유 Placeholder 목록');
    const sortedPlaceholders = Array.from(results.allPlaceholders).sort();
    console.log(`총 ${sortedPlaceholders.length}개의 고유한 placeholder:\n`);
    sortedPlaceholders.forEach((p, i) => console.log(`${(i + 1).toString().padStart(2)}. ${p}`));

    console.log('\n### 텍스트 vs 이미지 Placeholder');
    console.log(`텍스트 Placeholder가 있는 슬라이드: ${Object.keys(results.textPlaceholders).length}개`);
    console.log(`이미지 Placeholder가 있는 슬라이드: ${Object.keys(results.imagePlaceholders).length}개`);

    console.log('\n' + '='.repeat(80));
    console.log('분석 완료');
    console.log('='.repeat(80));

    // 결과를 JSON 파일로도 저장
    fs.writeFileSync(
      'C:\\project1\\template-placeholders.json',
      JSON.stringify({
        allPlaceholders: sortedPlaceholders,
        slideDetails: results.slideDetails,
        textPlaceholders: results.textPlaceholders,
        imagePlaceholders: results.imagePlaceholders
      }, null, 2)
    );
    console.log('\n✓ 결과를 template-placeholders.json에 저장했습니다.');

  } catch (error) {
    console.error('\n오류 발생:', error);
    throw error;
  }
}

analyzePlaceholders().catch(console.error);
