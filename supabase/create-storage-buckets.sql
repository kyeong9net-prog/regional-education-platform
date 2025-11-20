-- ================================================
-- Storage Buckets 생성 및 정책 설정
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- ================================================

-- 1. templates 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  false,
  52428800, -- 50MB
  ARRAY['application/vnd.openxmlformats-officedocument.presentationml.presentation']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. generated-files 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'generated-files',
  'generated-files',
  false,
  52428800 -- 50MB
)
ON CONFLICT (id) DO NOTHING;

-- 3. thumbnails 버킷 생성 (공개)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'thumbnails',
  'thumbnails',
  true,
  5242880 -- 5MB
)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- Storage 정책 설정
-- ================================================

-- templates 버킷 정책
-- 기존 정책이 있으면 먼저 삭제
DROP POLICY IF EXISTS "templates_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "templates_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "templates_delete_policy" ON storage.objects;

-- 모든 사용자가 읽을 수 있음
CREATE POLICY "templates_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');

-- 모든 사용자가 업로드 가능
CREATE POLICY "templates_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'templates');

-- 모든 사용자가 삭제 가능
CREATE POLICY "templates_delete_policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'templates');

-- generated-files 버킷 정책
CREATE POLICY "generated_files_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-files');

CREATE POLICY "generated_files_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-files');

CREATE POLICY "generated_files_delete_policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-files');

-- thumbnails 버킷 정책 (공개)
CREATE POLICY "thumbnails_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails');

CREATE POLICY "thumbnails_delete_policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'thumbnails');
