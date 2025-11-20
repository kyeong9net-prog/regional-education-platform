import { useState, useMemo } from 'react';
import type { Region } from '@/types';
import { searchInFields } from '@/lib/utils/korean-search';

/**
 * 지역 검색 훅
 * SOLID 원칙: Single Responsibility - 검색 기능만 담당
 */
export function useRegionSearch(regions: Region[]) {
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 결과 필터링 (메모이제이션)
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) {
      return regions;
    }

    return regions.filter(region =>
      searchInFields(
        [region.name, region.province, region.district],
        searchQuery
      )
    );
  }, [regions, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    filteredRegions,
    handleSearch,
    clearSearch,
    hasResults: filteredRegions.length > 0,
    resultCount: filteredRegions.length,
  };
}
