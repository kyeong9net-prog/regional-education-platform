# 이미지 API 설정 가이드

이 문서는 PPT 생성 시 사용할 이미지를 가져오기 위한 API 설정 방법을 안내합니다.

## 개요

시스템은 3가지 사진 스타일을 지원합니다:
- **실사 (Realistic)**: 한국관광공사 API + Unsplash 사용
- **일러스트 (Illustration)**: Pixabay 사용
- **혼합 (Mixed)**: 실사와 일러스트 조합

## API 키 발급

### 1. Unsplash API (무료)

1. [Unsplash Developers](https://unsplash.com/developers) 방문
2. 계정 생성/로그인
3. "New Application" 클릭
4. 약관 동의 후 애플리케이션 이름 입력
5. Access Key 복사

**무료 한도**: 50 requests/hour

### 2. Pixabay API (무료)

1. [Pixabay API](https://pixabay.com/api/docs/) 방문
2. 계정 생성/로그인
3. API 문서 페이지에서 API Key 확인
4. Key 복사

**무료 한도**: 5,000 requests/hour

### 3. 한국관광공사 Tour API (무료)

1. [공공데이터포털](https://www.data.go.kr) 방문
2. 회원가입/로그인
3. [한국관광공사_국문 관광정보 서비스](https://www.data.go.kr/data/15101578/openapi.do) 검색
4. "활용신청" 클릭
5. 상세기능정보에서 "지역기반 관광정보 조회" 선택
6. 일반 인증키(Encoding) 또는 일반 인증키(Decoding) 발급
7. 마이페이지에서 인증키 확인

**무료 한도**: 1,000 requests/day

## 환경 변수 설정

`.env.local` 파일에 다음 내용을 추가하세요:

```env
# Image API Keys (이미지 검색용)
# Unsplash: https://unsplash.com/developers 에서 발급
UNSPLASH_ACCESS_KEY=your-unsplash-access-key

# Pixabay: https://pixabay.com/api/docs/ 에서 발급
PIXABAY_API_KEY=your-pixabay-api-key

# 한국관광공사 Tour API: https://www.data.go.kr/data/15101578/openapi.do 에서 발급
KOREAN_TOURISM_API_KEY=your-korean-tourism-api-key
```

발급받은 실제 API 키로 교체하세요.

## API 사용법

### REST API

```bash
# 지역별 이미지 검색 (실사)
GET /api/images?region=서울&photoStyle=realistic&count=10

# 지역별 이미지 검색 (일러스트)
GET /api/images?region=부산&photoStyle=illustration&count=5

# 지역별 이미지 검색 (혼합)
GET /api/images?region=제주&photoStyle=mixed&count=8

# 주제별 이미지 검색
GET /api/images?theme=nature&photoStyle=realistic&count=10
```

### 프로그래밍 방식

```typescript
import { getRegionImages, getThemeImages } from '@/lib/api/images';

// 지역별 이미지 가져오기
const images = await getRegionImages('서울', 'realistic', 10);

// 주제별 이미지 가져오기
const themeImages = await getThemeImages('nature', 'illustration', 5);
```

### 응답 형식

```json
{
  "images": [
    {
      "url": "https://images.unsplash.com/photo-xxxxx",
      "thumbnail": "https://images.unsplash.com/photo-xxxxx?w=400",
      "photographer": "사진작가 이름",
      "source": "unsplash",
      "alt": "서울 한강공원"
    }
  ],
  "count": 10,
  "photoStyle": "realistic",
  "query": "서울"
}
```

## 이미지 선택 우선순위

### 실사 (Realistic) 스타일
1. **한국관광공사 API**: 지역 관광지 사진 (최우선)
2. **Unsplash**: 한국 지역 사진 보충
3. **Unsplash**: 일반 한국 풍경 (최종 대체)

### 일러스트 (Illustration) 스타일
1. **Pixabay**: 한국 관련 일러스트
2. **Pixabay**: 일반 일러스트 (대체)

### 혼합 (Mixed) 스타일
- 50% 실사 (한국관광공사 + Unsplash)
- 50% 일러스트 (Pixabay)

## 지역 코드 매핑

한국관광공사 API는 지역 코드를 사용합니다:

| 지역 | 코드 |
|------|------|
| 서울 | 1 |
| 인천 | 2 |
| 대전 | 3 |
| 대구 | 4 |
| 광주 | 5 |
| 부산 | 6 |
| 울산 | 7 |
| 세종 | 8 |
| 경기 | 31 |
| 강원 | 32 |
| 충북 | 33 |
| 충남 | 34 |
| 경북 | 35 |
| 경남 | 36 |
| 전북 | 37 |
| 전남 | 38 |
| 제주 | 39 |

## 주의사항

1. **API 키 보안**: `.env.local` 파일은 절대 Git에 커밋하지 마세요
2. **Rate Limiting**: 각 API의 무료 한도를 확인하고 초과하지 않도록 주의하세요
3. **에러 처리**: API 키가 없거나 잘못된 경우 빈 배열을 반환합니다
4. **캐싱**: 이미지 API 응답은 1시간 동안 캐시됩니다 (s-maxage=3600)

## 문제 해결

### API 키가 작동하지 않는 경우

1. `.env.local` 파일에 올바른 형식으로 키가 입력되었는지 확인
2. 개발 서버 재시작 (Ctrl+C 후 `npm run dev`)
3. 각 API 제공자 사이트에서 키 상태 확인

### 이미지가 반환되지 않는 경우

1. 브라우저 콘솔에서 에러 메시지 확인
2. API 요청 한도 초과 여부 확인
3. 네트워크 연결 상태 확인

### 한국관광공사 API 응답이 없는 경우

1. 지역명이 정확한지 확인 (예: "서울", "부산")
2. 인증키가 일반 인증키(Decoding)인지 확인
3. 일일 한도(1,000건) 초과 여부 확인

## 라이선스 및 저작권

- **Unsplash**: 무료 사용 가능, 상업적 이용 가능
- **Pixabay**: 무료 사용 가능, 상업적 이용 가능
- **한국관광공사**: 공공데이터 개방, 출처 표시 권장

모든 이미지 사용 시 각 API의 라이선스 조건을 준수하세요.
