-- ================================================
-- 지역 교육 플랫폼 데이터베이스 스키마
-- ================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. regions 테이블 (지역 정보)
-- ================================================
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  province TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_regions_code ON regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_province ON regions(province);

-- ================================================
-- 2. templates 테이블 (템플릿 정보)
-- ================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  slides_count INTEGER NOT NULL DEFAULT 10,
  file_path TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON templates(is_active);

-- ================================================
-- 3. generation_requests 테이블 (PPT 생성 요청)
-- ================================================
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS generation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  status generation_status DEFAULT 'pending',
  options JSONB DEFAULT '{}'::jsonb,
  result_file_path TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_generation_requests_status ON generation_requests(status);
CREATE INDEX IF NOT EXISTS idx_generation_requests_region_id ON generation_requests(region_id);
CREATE INDEX IF NOT EXISTS idx_generation_requests_created_at ON generation_requests(created_at DESC);

-- ================================================
-- 4. statistics 테이블 (통계)
-- ================================================
CREATE TABLE IF NOT EXISTS statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  generation_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date DESC);
CREATE INDEX IF NOT EXISTS idx_statistics_region_id ON statistics(region_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_statistics_date_region ON statistics(date, region_id);

-- ================================================
-- 5. Row Level Security (RLS) 정책
-- ================================================

-- regions: 모두 읽기 가능
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions_select_policy" ON regions
  FOR SELECT
  USING (true);

-- templates: active=true인 것만 읽기 가능
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_policy" ON templates
  FOR SELECT
  USING (is_active = true);

-- generation_requests: 모두 읽기 가능
ALTER TABLE generation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generation_requests_select_policy" ON generation_requests
  FOR SELECT
  USING (true);

CREATE POLICY "generation_requests_insert_policy" ON generation_requests
  FOR INSERT
  WITH CHECK (true);

-- statistics: Service Role만 접근 가능 (RLS로 제한하지 않음)
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 6. 함수 및 트리거
-- ================================================

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- templates 테이블에 트리거 적용
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 7. 샘플 데이터 삽입
-- ================================================

-- 지역 데이터
INSERT INTO regions (name, code, province, description, image_url) VALUES
  ('서울특별시 종로구', 'seoul-jongno', '서울특별시', '역사와 문화가 살아있는 서울의 중심', 'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42'),
  ('서울특별시 강남구', 'seoul-gangnam', '서울특별시', '현대적이고 활기찬 서울의 상업 중심지', 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17'),
  ('부산광역시 해운대구', 'busan-haeundae', '부산광역시', '아름다운 해변과 함께하는 관광 명소', 'https://images.unsplash.com/photo-1566224924770-0c5820a92924'),
  ('대구광역시 중구', 'daegu-jung', '대구광역시', '전통과 현대가 어우러진 대구의 중심', 'https://images.unsplash.com/photo-1583953500536-81b52e7d0e5a'),
  ('인천광역시 연수구', 'incheon-yeonsu', '인천광역시', '송도국제도시가 있는 첨단 지역', 'https://images.unsplash.com/photo-1583339793403-3d9b001b6008')
ON CONFLICT (code) DO NOTHING;

-- 템플릿 데이터
INSERT INTO templates (title, description, category, slides_count, file_path, thumbnail_url, is_active) VALUES
  ('기본 지역 소개 템플릿', '지역의 역사와 문화를 소개하는 기본 템플릿', '역사/문화', 15, 'templates/basic-intro.pptx', 'https://via.placeholder.com/400x300', true),
  ('관광 명소 소개 템플릿', '지역의 주요 관광지를 소개하는 템플릿', '관광', 20, 'templates/tourism.pptx', 'https://via.placeholder.com/400x300', true),
  ('지역 경제 분석 템플릿', '지역의 산업과 경제를 분석하는 템플릿', '경제', 18, 'templates/economy.pptx', 'https://via.placeholder.com/400x300', true)
ON CONFLICT DO NOTHING;

-- 통계 초기 데이터
INSERT INTO statistics (date, region_id, generation_count, download_count)
SELECT
  CURRENT_DATE,
  id,
  0,
  0
FROM regions
ON CONFLICT (date, region_id) DO NOTHING;
