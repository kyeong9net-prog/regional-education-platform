-- 최근 10개를 제외한 오래된 생성 기록 삭제
-- generation_requests 테이블과 Supabase Storage의 파일 정리

-- 1. 삭제할 레코드의 파일 경로 확인 (최근 10개를 제외한 나머지)
-- 실행 전 확인용 쿼리 (이 쿼리로 먼저 확인해보세요)
SELECT
  id,
  result_file_path,
  created_at
FROM generation_requests
WHERE id NOT IN (
  SELECT id
  FROM generation_requests
  ORDER BY created_at DESC
  LIMIT 10
)
ORDER BY created_at DESC;

-- 2. 오래된 레코드 삭제 (최근 10개만 유지)
-- ⚠️ 주의: 이 쿼리는 실제로 데이터를 삭제합니다!
-- 위의 SELECT 쿼리로 먼저 확인한 후 실행하세요.

-- DELETE FROM generation_requests
-- WHERE id NOT IN (
--   SELECT id
--   FROM generation_requests
--   ORDER BY created_at DESC
--   LIMIT 10
-- );

-- 참고: Supabase Storage의 파일은 별도로 삭제해야 합니다
-- Storage → Buckets → templates → generated 폴더에서 수동으로 삭제하거나
-- 아래 함수를 사용하여 자동 삭제할 수 있습니다 (선택사항)
