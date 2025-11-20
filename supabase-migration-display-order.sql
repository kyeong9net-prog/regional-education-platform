-- Add display_order column to templates table
-- 이 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. display_order 컬럼 추가 (기본값 0)
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. 기존 데이터에 display_order 설정 (created_at 순서대로 0, 1, 2, ... 할당)
WITH ranked_templates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS row_order
  FROM templates
)
UPDATE templates
SET display_order = ranked_templates.row_order
FROM ranked_templates
WHERE templates.id = ranked_templates.id;

-- 3. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_templates_display_order
ON templates(display_order);

-- 4. 결과 확인
SELECT id, title, display_order, created_at
FROM templates
ORDER BY display_order ASC, created_at DESC;
