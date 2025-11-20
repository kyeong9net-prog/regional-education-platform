# Supabase Storage 설정 가이드

## 문제: 파일 업로드 실패

템플릿 업로드 시 "파일 업로드에 실패했습니다" 오류가 발생하면 Storage 버킷이 생성되지 않았을 가능성이 높습니다.

## 해결 방법 1: UI에서 버킷 생성 (권장)

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택
3. 좌측 메뉴에서 **Storage** 클릭
4. **New bucket** 버튼 클릭
5. 다음 버킷 생성:

### templates 버킷
- Name: `templates`
- Public bucket: **체크 해제 (Private)**
- File size limit: 50MB (선택사항)
- Allowed MIME types: `application/vnd.openxmlformats-officedocument.presentationml.presentation`

### generated-files 버킷 (나중에 사용)
- Name: `generated-files`
- Public bucket: **체크 해제 (Private)**

### thumbnails 버킷 (나중에 사용)
- Name: `thumbnails`
- Public bucket: **체크 (Public)**

## 해결 방법 2: SQL로 버킷 생성

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- templates 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false)
ON CONFLICT (id) DO NOTHING;

-- generated-files 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-files', 'generated-files', false)
ON CONFLICT (id) DO NOTHING;

-- thumbnails 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;
```

## 버킷 생성 후 정책 설정

SQL Editor에서 실행:

```sql
-- templates 버킷 정책
-- 모든 사용자가 읽을 수 있음
CREATE POLICY "templates_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');

-- Service Role만 업로드 가능
CREATE POLICY "templates_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'templates');

-- Service Role만 삭제 가능
CREATE POLICY "templates_delete_policy"
ON storage.objects FOR DELETE
USING (bucket_id = 'templates');
```

## 확인 방법

1. Supabase 대시보드 → Storage
2. `templates` 버킷이 보이는지 확인
3. 버킷 클릭 → 빈 상태여야 함
4. 다시 템플릿 업로드 시도

## 여전히 실패하는 경우

브라우저 개발자 도구(F12) → Console 탭에서 오류 메시지 확인 후 알려주세요.
