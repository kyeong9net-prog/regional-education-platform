# Supabase 설정 가이드

## 1단계: 환경 변수 확인

✅ `.env.local` 파일이 생성되었습니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://unecftmielwzlclitatx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 2단계: 데이터베이스 스키마 생성

1. Supabase 대시보드 접속: https://supabase.com/dashboard
2. 프로젝트 선택: `regional-education-platform` (또는 생성한 프로젝트)
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New Query** 클릭
5. `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭

### 생성되는 테이블:
- ✅ **regions** - 지역 정보
- ✅ **templates** - PPT 템플릿
- ✅ **generation_requests** - 생성 요청 기록
- ✅ **statistics** - 통계 데이터

### 샘플 데이터:
- 5개 지역 (서울 종로, 강남, 부산 해운대, 대구 중구, 인천 연수)
- 3개 템플릿 (기본 소개, 관광, 경제)

## 3단계: Storage Buckets 생성

### 방법 1: UI에서 생성 (권장)

1. 좌측 메뉴에서 **Storage** 클릭
2. **New bucket** 클릭하여 다음 버킷들을 생성:
   - `templates` (Private)
   - `generated-files` (Private)
   - `thumbnails` (Public)

### 방법 2: SQL로 생성

1. **SQL Editor**에서 새 쿼리 생성
2. `supabase/storage-setup.sql` 파일의 내용을 붙여넣기
3. **Run** 클릭

## 4단계: 연결 테스트

개발 서버를 실행하여 연결을 테스트합니다:

```bash
npm run dev
```

브라우저에서 http://localhost:3000/regions 접속하여 지역 데이터가 로드되는지 확인합니다.

## 5단계: 다음 작업

✅ 환경 설정 완료!

이제 다음 작업을 진행할 수 있습니다:
- 지역 데이터 조회 기능 구현
- 템플릿 업로드 기능 구현
- PPT 생성 API 구현

## 트러블슈팅

### 연결 오류가 발생하는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수 값이 올바른지 확인
3. 개발 서버 재시작: `Ctrl+C` 후 `npm run dev`

### RLS 정책 오류

데이터가 조회되지 않으면:
1. Supabase 대시보드 → Authentication → Policies
2. 각 테이블의 RLS 정책이 활성화되어 있는지 확인
3. `regions`와 `templates` 테이블은 SELECT 정책이 있어야 함

### Storage 접근 오류

1. Supabase 대시보드 → Storage → Policies
2. 각 버킷의 정책 확인
3. `templates`, `generated-files`, `thumbnails` 버킷이 생성되어 있는지 확인

## 유용한 SQL 쿼리

### 데이터 확인
```sql
-- 지역 데이터 확인
SELECT * FROM regions;

-- 템플릿 데이터 확인
SELECT * FROM templates;

-- 생성 요청 확인
SELECT * FROM generation_requests;
```

### 데이터 초기화
```sql
-- 모든 생성 요청 삭제
DELETE FROM generation_requests;

-- 통계 초기화
DELETE FROM statistics;
```

## 다음 단계

구현할 기능:
1. ✅ 환경 설정 완료
2. ⏳ 지역 조회 API
3. ⏳ 템플릿 업로드 기능
4. ⏳ PPT 생성 기능
5. ⏳ 파일 다운로드 기능
