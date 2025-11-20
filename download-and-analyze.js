// Supabase Storage에서 템플릿 다운로드 및 분석
const { createClient } = require('@supabase/supabase-js');
const PizZip = require('pizzip');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeTemplate() {
  console.log('Supabase에서 템플릿 다운로드 중...\n');

  // 템플릿 정보 가져오기
  const { data: template } = await supabase
    .from('templates')
    .select('*')
    .eq('id', '0d3b4a92-3a2a-4d45-9f75-9084599f7362')
    .single();

  if (!template) {
    console.error('템플릿을 찾을 수 없습니다!');
    return;
  }

  console.log('템플릿:', template.title);
  console.log('파일 경로:', template.file_path);

  // Signed URL로 다운로드
  const { data: signedUrlData, error } = await supabase.storage
    .from('templates')
    .createSignedUrl(template.file_path, 60);

  if (error) {
    console.error('Signed URL 생성 오류:', error);
    return;
  }

  console.log('다운로드 URL:', signedUrlData.signedUrl);

  const response = await fetch(signedUrlData.signedUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`다운로드 완료: ${buffer.length} bytes\n`);

  // ZIP 파싱
  const zip = new PizZip(buffer);

  // slide1.xml 분석
  const slide1 = zip.file('ppt/slides/slide1.xml')?.asText() || '';

  console.log('='.repeat(80));
  console.log('slide1.xml 원본 (처음 2000자):');
  console.log('='.repeat(80));
  console.log(slide1.substring(0, 2000));

  console.log('\n' + '='.repeat(80));
  console.log('<p:txBody> 블록 찾기:');
  console.log('='.repeat(80));

  const txBodyRegex = /<p:txBody[^>]*>[\s\S]*?<\/p:txBody>/g;
  const txBodies = slide1.match(txBodyRegex);

  if (txBodies) {
    console.log(`${txBodies.length}개의 <p:txBody> 블록 발견\n`);

    txBodies.forEach((txBody, i) => {
      const tTags = txBody.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (tTags) {
        const combinedText = tTags
          .map(tag => tag.replace(/<a:t[^>]*>([^<]*)<\/a:t>/, '$1'))
          .join('');

        if (combinedText.trim()) {
          console.log(`txBody ${i + 1}:`);
          console.log(`  합친 텍스트: "${combinedText}"`);
          console.log(`  <a:t> 태그 수: ${tTags.length}`);

          // Placeholder 확인
          if (combinedText.includes('[REGION_NAME]') || combinedText.includes('REGION_NAME')) {
            console.log(`  ✓ REGION_NAME 관련 텍스트 발견!`);
            console.log(`  원본 블록 샘플:\n${txBody.substring(0, 500)}\n`);
          }
        }
      }
    });
  } else {
    console.log('<p:txBody> 블록을 찾을 수 없습니다!');
  }

  // slide2.xml도 분석
  console.log('\n' + '='.repeat(80));
  console.log('slide2.xml 분석:');
  console.log('='.repeat(80));

  const slide2 = zip.file('ppt/slides/slide2.xml')?.asText() || '';
  const txBodies2 = slide2.match(txBodyRegex);

  if (txBodies2) {
    console.log(`${txBodies2.length}개의 <p:txBody> 블록 발견\n`);

    txBodies2.forEach((txBody, i) => {
      const tTags = txBody.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
      if (tTags) {
        const combinedText = tTags
          .map(tag => tag.replace(/<a:t[^>]*>([^<]*)<\/a:t>/, '$1'))
          .join('');

        if (combinedText.trim()) {
          console.log(`txBody ${i + 1}:`);
          console.log(`  합친 텍스트: "${combinedText}"`);

          if (combinedText.includes('[') || combinedText.includes('REGION') || combinedText.includes('NATURAL')) {
            console.log(`  ✓ Placeholder 관련 텍스트 발견!`);
            console.log(`  원본 블록 샘플:\n${txBody.substring(0, 800)}\n`);
          }
        }
      }
    });
  }
}

analyzeTemplate().catch(console.error);
