-- ================================================
-- Storage Buckets 및 정책 설정
-- ================================================

-- 1. templates-bucket (템플릿 PPTX 파일)
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false)
ON CONFLICT (id) DO NOTHING;

-- templates 읽기 정책 (모두 읽기 가능)
CREATE POLICY "templates_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');

-- templates 업로드 정책 (Service Role만)
CREATE POLICY "templates_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'templates' AND auth.role() = 'service_role');

-- 2. generated-files-bucket (생성된 PPT 파일)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-files', 'generated-files', false)
ON CONFLICT (id) DO NOTHING;

-- generated-files 읽기 정책 (모두 읽기 가능)
CREATE POLICY "generated_files_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-files');

-- generated-files 업로드 정책 (Service Role만)
CREATE POLICY "generated_files_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-files' AND auth.role() = 'service_role');

-- 3. thumbnails-bucket (썸네일 이미지 - 공개)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- thumbnails 읽기 정책 (공개)
CREATE POLICY "thumbnails_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

-- thumbnails 업로드 정책 (Service Role만)
CREATE POLICY "thumbnails_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'service_role');
