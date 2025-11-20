import { useState, useMemo } from 'react';
import type { Region } from '@/types';

/**
 * 지역 필터링 훅 (시/도 기준)
 * SOLID 원칙: Single Responsibility - 필터링 로직만 담당
 */
export function useRegionFilter(regions: Region[]) {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // 필터링된 지역 목록
  const filteredRegions = useMemo(() => {
    if (!selectedProvince) return regions;
    return regions.filter(region => region.province === selectedProvince);
  }, [regions, selectedProvince]);

  // 모든 시/도 목록 (중복 제거)
  const provinces = useMemo(() => {
    const provinceSet = new Set(regions.map(region => region.province));
    return Array.from(provinceSet).sort();
  }, [regions]);

  // 필터 초기화
  const clearFilter = () => {
    setSelectedProvince(null);
  };

  return {
    selectedProvince,
    setSelectedProvince,
    filteredRegions,
    provinces,
    clearFilter,
    isFiltered: selectedProvince !== null,
  };
}
