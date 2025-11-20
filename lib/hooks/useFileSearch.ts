import { useState, useMemo } from 'react';
import type { GeneratedFile } from '@/types';

/**
 * 파일 검색 훅
 * Phase 5: 지역명/템플릿명 기반 검색 기능
 */
export function useFileSearch(files: GeneratedFile[]) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return files;
    }

    const query = searchQuery.toLowerCase();
    return files.filter(file => {
      return (
        file.regionName.toLowerCase().includes(query) ||
        file.templateTitle.toLowerCase().includes(query)
      );
    });
  }, [files, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    filteredFiles,
    handleSearch,
    clearSearch,
  };
}
