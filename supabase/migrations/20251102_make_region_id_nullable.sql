-- Make region_id nullable in generation_requests table
-- 지역명은 options JSONB에 저장하므로 region_id는 nullable로 변경

ALTER TABLE generation_requests
ALTER COLUMN region_id DROP NOT NULL;

-- Update existing constraint to allow NULL values
-- 기존 foreign key는 유지하되, NULL 값 허용
