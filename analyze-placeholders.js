// Supabase Storage에서 템플릿 다운로드 및 Placeholder 분석
const { createClient } = require('@supabase/supabase-js');
const PizZip = require('pizzip');

const supabaseUrl = 'https://unecftmielwzlclitatx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuZWNmdG1pZWx3emxjbGl0YXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NzAxODIsImV4cCI6MjA3NzU0NjE4Mn0.ugdtaamBaYfNMK_eS3J3lrPre5-mdsg4gF2FTFmgmCY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzePlaceholders() {
  console.log('='.repeat(80));
  console.log('Supabase Storage에서 템플릿 다운로드 시작');
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

    console.log('='.repeat(80));
    console.log('PPTX 파일 구조 분석');
    console.log('='.repeat(80));

    // 모든 슬라이드 파일 찾기
    const slideFiles = Object.keys(zip.files).filter(name =>
      name.match(/ppt\/slides\/slide\d+\.xml$/)
    );

    console.log(`발견된 슬라이드: ${slideFiles.length}개`);
    slideFiles.forEach(file => console.log(`  - ${file}`));
    console.log();

    // 전체 결과를 저장할 객체
    const results = {
      textPlaceholders: {},
      imagePlaceholders: {},
      allPlaceholders: new Set()
    };

    // 각 슬라이드 분석
    for (const slideFile of slideFiles) {
      const slideName = slideFile.match(/slide(\d+)\.xml/)[0];
      console.log('='.repeat(80));
      console.log(`${slideName} 분석 중...`);
      console.log('='.repeat(80));

      const slideXml = zip.file(slideFile).asText();

      // 1. 텍스트 Placeholder 찾기 ({{...}} 형식)
      const textPlaceholders = [];

      // <a:t> 태그에서 텍스트 추출
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
        textPlaceholders.push(placeholder);
        results.allPlaceholders.add(placeholder);
      }

      if (textPlaceholders.length > 0) {
        console.log(`\n✓ 텍스트 Placeholder 발견: ${textPlaceholders.length}개`);
        textPlaceholders.forEach(p => console.log(`  - ${p}`));
        results.textPlaceholders[slideName] = textPlaceholders;
      }

      // 2. 이미지 대체 텍스트 Placeholder 찾기 (descr 속성)
      const imagePlaceholders = [];

      // <p:cNvPr descr="..."> 패턴 찾기
      const descrRegex = /<p:cNvPr[^>]+descr="([^"]+)"/g;
      while ((match = descrRegex.exec(slideXml)) !== null) {
        const descr = match[1];
        // descr 안에서 {{...}} 패턴 찾기
        const descrPlaceholderRegex = /\{\{([^}]+)\}\}/g;
        let descrMatch;
        while ((descrMatch = descrPlaceholderRegex.exec(descr)) !== null) {
          const placeholder = `{{${descrMatch[1]}}}`;
          imagePlaceholders.push(placeholder);
          results.allPlaceholders.add(placeholder);
        }
      }

      if (imagePlaceholders.length > 0) {
        console.log(`\n✓ 이미지 대체 텍스트 Placeholder 발견: ${imagePlaceholders.length}개`);
        imagePlaceholders.forEach(p => console.log(`  - ${p}`));
        results.imagePlaceholders[slideName] = imagePlaceholders;
      }

      if (textPlaceholders.length === 0 && imagePlaceholders.length === 0) {
        console.log('\n  (Placeholder 없음)');
      }
      console.log();
    }

    // 최종 결과 출력
    console.log('\n' + '='.repeat(80));
    console.log('최종 분석 결과');
    console.log('='.repeat(80));

    console.log('\n### 텍스트 Placeholder (슬라이드별)');
    if (Object.keys(results.textPlaceholders).length === 0) {
      console.log('  (없음)');
    } else {
      for (const [slide, placeholders] of Object.entries(results.textPlaceholders)) {
        console.log(`\n${slide}:`);
        placeholders.forEach(p => console.log(`  - ${p}`));
      }
    }

    console.log('\n### 이미지 Placeholder (대체 텍스트)');
    if (Object.keys(results.imagePlaceholders).length === 0) {
      console.log('  (없음)');
    } else {
      for (const [slide, placeholders] of Object.entries(results.imagePlaceholders)) {
        console.log(`\n${slide}:`);
        placeholders.forEach(p => console.log(`  - ${p} (descr 속성)`));
      }
    }

    console.log('\n### 전체 고유 Placeholder 목록');
    const sortedPlaceholders = Array.from(results.allPlaceholders).sort();
    if (sortedPlaceholders.length === 0) {
      console.log('  (없음)');
    } else {
      console.log(`총 ${sortedPlaceholders.length}개의 고유한 placeholder 발견:\n`);
      sortedPlaceholders.forEach((p, i) => console.log(`${i + 1}. ${p}`));
    }

    console.log('\n' + '='.repeat(80));
    console.log('분석 완료');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n오류 발생:', error);
    throw error;
  }
}

analyzePlaceholders().catch(console.error);
