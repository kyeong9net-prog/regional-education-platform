/**
 * Supabase 데이터베이스 타입 정의
 */

// Database row type
export interface RegionRow {
  id: string;
  name: string;
  code: string;
  province: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

// Application-facing type (matches existing Region interface)
export interface Region {
  id: string;
  name: string;
  code: string;
  province: string;
  district: string; // Derived from name (e.g., "서울특별시 종로구" -> "종로구")
  description?: string;
  imageUrl?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  slides_count: number;
  file_path: string;
  thumbnail_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GenerationRequest {
  id: string;
  region_id: string;
  template_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: Record<string, any>;
  result_file_path: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  // Relations
  region?: Region;
  template?: Template;
}

export interface Statistic {
  id: string;
  date: string;
  region_id: string | null;
  generation_count: number;
  download_count: number;
  created_at: string;
}
