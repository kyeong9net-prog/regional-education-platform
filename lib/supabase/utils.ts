/**
 * Supabase 데이터 변환 유틸리티
 */

import type { RegionRow, Region } from './types';

/**
 * Supabase RegionRow를 애플리케이션 Region 타입으로 변환
 */
export function transformRegionRow(row: RegionRow): Region {
  // name에서 district 추출 (예: "서울특별시 종로구" -> "종로구")
  const district = row.name.replace(row.province, '').trim();

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    province: row.province,
    district: district,
    description: row.description || undefined,
    imageUrl: row.image_url || undefined,
  };
}
