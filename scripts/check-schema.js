/**
 * 데이터베이스 스키마 확인 스크립트
 * generation_requests 테이블의 region_id 컬럼이 nullable인지 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking generation_requests table schema...\n');

  // 테이블 구조 확인 쿼리
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'generation_requests'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.error('❌ Error querying schema:', error);
    console.log('\n💡 Try this SQL query directly in Supabase SQL Editor:');
    console.log(`
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'generation_requests'
  AND column_name = 'region_id';
    `);
    return;
  }

  console.log('📊 Table structure:');
  console.table(data);

  // region_id 확인
  const regionIdColumn = data?.find(col => col.column_name === 'region_id');
  if (regionIdColumn) {
    console.log('\n📌 region_id column:');
    console.log(`   is_nullable: ${regionIdColumn.is_nullable}`);

    if (regionIdColumn.is_nullable === 'NO') {
      console.log('\n❌ PROBLEM FOUND: region_id is NOT NULL');
      console.log('\n💡 Run this SQL in Supabase Dashboard → SQL Editor:');
      console.log('   ALTER TABLE generation_requests ALTER COLUMN region_id DROP NOT NULL;');
    } else {
      console.log('\n✅ region_id is nullable - schema is correct!');
    }
  }
}

checkSchema().catch(console.error);
