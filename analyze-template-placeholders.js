const PizZip = require('pizzip');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeTemplatePlaceholders() {
  console.log('📥 Supabase에서 템플릿 다운로드 중...\n');

  // 최신 템플릿 가져오기
  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .eq('title', '지역의 여러장소 알아보기')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!templates || templates.length === 0) {
    console.log('❌ 템플릿을 찾을 수 없습니다.');
    return;
  }

  const template = templates[0];
  console.log(`✅ 템플릿 발견: ${template.title}`);
  console.log(`   파일: ${template.file_path}\n`);

  // 템플릿 다운로드
  const { data: signedUrlData } = await supabase.storage
    .from('templates')
    .createSignedUrl(template.file_path, 60);

  if (!signedUrlData?.signedUrl) {
    console.log('❌ 다운로드 URL 생성 실패');
    return;
  }

  const response = await fetch(signedUrlData.signedUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  const zip = new PizZip(buffer);

  console.log('🔍 모든 슬라이드에서 Alt Text 분석 중...\n');

  // 모든 슬라이드 파일 찾기
  const slideFiles = Object.keys(zip.files).filter(
    (fileName) => fileName.match(/^ppt\/slides\/slide\d+\.xml$/)
  );

  const placeholderData = {
    templateId: template.id,
    templateTitle: template.title,
    templateFilePath: template.file_path,
    analyzedAt: new Date().toISOString(),
    totalSlides: slideFiles.length,
    placeholders: [],
    summary: {
      totalPlaceholders: 0,
      placeholdersByType: {},
      placeholdersByCategory: {},
      placeholdersBySlide: {}
    }
  };

  // 각 슬라이드 분석
  for (const slideFile of slideFiles) {
    const slideNumber = slideFile.match(/slide(\d+)\.xml$/)[1];
    const slideContent = zip.file(slideFile)?.asText();

    if (!slideContent) continue;

    // 모든 <p:pic> 태그 찾기
    const picRegex = /<p:pic>[\s\S]*?<\/p:pic>/g;
    const pics = slideContent.match(picRegex) || [];

    let imageIndexInSlide = 0;

    for (const pic of pics) {
      imageIndexInSlide++;

      // <p:cNvPr> 태그에서 descr 속성 찾기
      const cNvPrMatch = pic.match(/<p:cNvPr ([^>]*)\/>/);
      if (!cNvPrMatch) continue;

      const attributes = cNvPrMatch[1];
      const descrMatch = attributes.match(/descr="([^"]*)"/);

      if (!descrMatch) continue;

      const placeholder = descrMatch[1];

      // placeholder가 빈 문자열이면 스킵
      if (!placeholder || placeholder.trim() === '') continue;

      // 이미지 크기 정보 추출
      const extMatch = pic.match(/<a:ext cx="(\d+)" cy="(\d+)"\/>/);
      const imageSize = extMatch
        ? {
            width: parseInt(extMatch[1]),
            height: parseInt(extMatch[2]),
            area: parseInt(extMatch[1]) * parseInt(extMatch[2])
          }
        : null;

      // 이미지 ID와 이름 추출
      const idMatch = attributes.match(/id="(\d+)"/);
      const nameMatch = attributes.match(/name="([^"]*)"/);

      // Placeholder 분석
      const placeholderInfo = analyzePlaceholder(placeholder);

      const placeholderEntry = {
        slideNumber: parseInt(slideNumber),
        slideFile: slideFile,
        imageIndex: imageIndexInSlide,
        imageId: idMatch ? idMatch[1] : null,
        imageName: nameMatch ? nameMatch[1] : null,
        placeholder: placeholder,
        ...placeholderInfo,
        imageSize: imageSize
      };

      placeholderData.placeholders.push(placeholderEntry);

      console.log(`📍 Slide ${slideNumber}, 이미지 #${imageIndexInSlide}:`);
      console.log(`   Placeholder: ${placeholder}`);
      console.log(`   타입: ${placeholderInfo.type}`);
      console.log(`   카테고리: ${placeholderInfo.category || 'N/A'}`);
      console.log(`   인덱스: ${placeholderInfo.index || 'N/A'}`);
      if (imageSize) {
        console.log(`   크기: ${imageSize.width} x ${imageSize.height}`);
      }
      console.log('');
    }
  }

  // Summary 생성
  placeholderData.summary.totalPlaceholders = placeholderData.placeholders.length;

  // Type별 집계
  placeholderData.placeholders.forEach(p => {
    placeholderData.summary.placeholdersByType[p.type] =
      (placeholderData.summary.placeholdersByType[p.type] || 0) + 1;

    if (p.category) {
      placeholderData.summary.placeholdersByCategory[p.category] =
        (placeholderData.summary.placeholdersByCategory[p.category] || 0) + 1;
    }

    const slideKey = `slide${p.slideNumber}`;
    placeholderData.summary.placeholdersBySlide[slideKey] =
      (placeholderData.summary.placeholdersBySlide[slideKey] || 0) + 1;
  });

  // JSON 파일로 저장
  const outputPath = './template-placeholders.json';
  fs.writeFileSync(outputPath, JSON.stringify(placeholderData, null, 2));

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 분석 완료 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`총 슬라이드: ${placeholderData.totalSlides}`);
  console.log(`총 Placeholder: ${placeholderData.summary.totalPlaceholders}`);
  console.log('');
  console.log('📌 타입별 분포:');
  Object.entries(placeholderData.summary.placeholdersByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}개`);
  });
  console.log('');
  console.log('📌 카테고리별 분포:');
  Object.entries(placeholderData.summary.placeholdersByCategory).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}개`);
  });
  console.log('');
  console.log('📌 슬라이드별 분포:');
  Object.entries(placeholderData.summary.placeholdersBySlide).forEach(([slide, count]) => {
    console.log(`   ${slide}: ${count}개`);
  });
  console.log('');
  console.log(`✅ 메타데이터 저장 완료: ${outputPath}`);
}

/**
 * Placeholder 문자열을 분석하여 타입, 카테고리, 인덱스 추출
 *
 * 예시:
 * - {{REGION}} → { type: 'REGION', category: null, index: null }
 * - {{NATURAL_SITE_IMAGE_1}} → { type: 'IMAGE', category: 'NATURAL_SITE', index: 1 }
 * - {{EDU_SITE_NAME_2}} → { type: 'SITE', category: 'EDU_SITE', index: 2 }
 */
function analyzePlaceholder(placeholder) {
  // {{...}} 제거
  const cleaned = placeholder.replace(/^\{\{|\}\}$/g, '');

  // 패턴 1: {{REGION}} - 단순 텍스트
  if (!cleaned.includes('_')) {
    return {
      type: cleaned,
      category: null,
      index: null,
      pattern: placeholder
    };
  }

  // 패턴 2: {{CATEGORY_TYPE_INDEX}} - 예: NATURAL_SITE_IMAGE_1
  const parts = cleaned.split('_');

  // 마지막 부분이 숫자인지 확인 (인덱스)
  const lastPart = parts[parts.length - 1];
  const index = /^\d+$/.test(lastPart) ? parseInt(lastPart) : null;

  // 타입 감지 (IMAGE, SITE, NAME 등)
  let type = null;
  let category = null;

  if (cleaned.includes('_IMAGE_')) {
    type = 'IMAGE';
    // IMAGE 앞부분이 카테고리
    category = cleaned.split('_IMAGE_')[0];
  } else if (cleaned.includes('_SITE_')) {
    type = 'SITE';
    category = cleaned.split('_SITE_')[0] + '_SITE';
  } else if (cleaned.includes('_NAME_')) {
    type = 'NAME';
    category = cleaned.split('_NAME_')[0] + '_NAME';
  } else {
    // 알 수 없는 형태 - 전체를 타입으로
    type = cleaned;
  }

  return {
    type: type,
    category: category,
    index: index,
    pattern: placeholder,
    rawText: cleaned
  };
}

analyzeTemplatePlaceholders().catch(console.error);
