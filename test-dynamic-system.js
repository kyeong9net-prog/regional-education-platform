/**
 * 동적 PPTX 생성 시스템 테스트
 * 템플릿 메타데이터를 로드하고 Tourism 데이터를 가져와서 매핑 테스트
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDynamicSystem() {
  console.log('🧪 동적 PPTX 생성 시스템 테스트\n');

  // 1. 템플릿 메타데이터 로드
  const metadataPath = './template-placeholders.json';
  if (!fs.existsSync(metadataPath)) {
    console.error('❌ 메타데이터 파일이 없습니다. analyze-template-placeholders.js를 먼저 실행하세요.');
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  console.log(`✅ 템플릿 메타데이터 로드: ${metadata.templateTitle}`);
  console.log(`   Placeholder 수: ${metadata.placeholders.length}`);
  console.log('');

  // 2. 카테고리 요구사항 분석
  const categoryCount = {};
  for (const p of metadata.placeholders) {
    if (p.category && p.type === 'IMAGE') {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    }
  }

  console.log('📊 카테고리 요구사항:');
  for (const [category, count] of Object.entries(categoryCount)) {
    console.log(`   ${category}: ${count}개 필요`);
  }
  console.log('');

  // 3. 테스트 지역 선택
  const testRegion = '강화군';
  console.log(`🌍 테스트 지역: ${testRegion}\n`);

  // 4. Tourism API 호출 시뮬레이션
  console.log('📡 Tourism API 호출 중...');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/api/tourism?region=${encodeURIComponent(testRegion)}`);

    if (!response.ok) {
      console.error(`❌ Tourism API 오류: ${response.status}`);
      return;
    }

    const tourismData = await response.json();

    console.log(`✅ Tourism 데이터 가져오기 성공`);
    console.log(`   자연명소: ${tourismData.naturalSpots?.length || 0}개`);
    console.log(`   교육시설: ${tourismData.culturalSpots?.length || 0}개`);
    console.log(`   역사유적: ${tourismData.historicalSpots?.length || 0}개`);
    console.log('');

    // 5. Placeholder 매핑 시뮬레이션
    console.log('🔗 Placeholder → Tourism 데이터 매핑:');
    console.log('');

    // 카테고리명 → Tourism 데이터 필드 매핑
    const categoryToDataMapping = {
      'NATURAL_SITE': 'naturalSpots',
      'EDU_SITE': 'culturalSpots',
      'HISTORICAL_SITE': 'historicalSpots',
      'HISTOIRCAL_SITE': 'historicalSpots', // 오타 지원
    };

    for (const placeholder of metadata.placeholders) {
      if (placeholder.type !== 'IMAGE') continue;

      const dataField = categoryToDataMapping[placeholder.category];
      if (!dataField) {
        console.warn(`⚠ 알 수 없는 카테고리: ${placeholder.category}`);
        continue;
      }

      const spots = tourismData[dataField] || [];
      const spotIndex = placeholder.index - 1;
      const spot = spots[spotIndex];

      if (spot) {
        console.log(`✓ ${placeholder.placeholder}`);
        console.log(`  → ${spot.name}`);
        console.log(`     주소: ${spot.address || '정보 없음'}`);
        console.log(`     이미지: ${spot.image ? '있음' : '없음 (외부 API 필요)'}`);
      } else {
        console.log(`✗ ${placeholder.placeholder}`);
        console.log(`  → 데이터 없음 (${dataField}[${spotIndex}])`);
      }
      console.log('');
    }

    // 6. 결과 요약
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 테스트 요약');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const mappedCount = metadata.placeholders.filter(p => {
      if (p.type !== 'IMAGE') return false;
      const dataField = categoryToDataMapping[p.category];
      if (!dataField) return false;
      const spots = tourismData[dataField] || [];
      const spotIndex = p.index - 1;
      return !!spots[spotIndex];
    }).length;

    console.log(`총 Placeholder: ${metadata.placeholders.length}개`);
    console.log(`매핑 성공: ${mappedCount}개`);
    console.log(`매핑 실패: ${metadata.placeholders.length - mappedCount}개`);
    console.log('');

    if (mappedCount === metadata.placeholders.length) {
      console.log('✅ 모든 Placeholder가 성공적으로 매핑되었습니다!');
    } else {
      console.log('⚠ 일부 Placeholder는 외부 이미지 API가 필요합니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

testDynamicSystem().catch(console.error);
