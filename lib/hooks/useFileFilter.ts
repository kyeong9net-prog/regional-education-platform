import { useState, useMemo } from 'react';
import type { GeneratedFile, FileFilter, FileSortOption } from '@/types';

/**
 * 파일 필터링 및 정렬 훅
 * Phase 5: 상태별, 날짜별 필터링 및 정렬 기능
 */
export function useFileFilter(files: GeneratedFile[]) {
  const [filter, setFilter] = useState<FileFilter>({
    status: null,
    dateFrom: null,
    dateTo: null,
  });
  const [sortBy, setSortBy] = useState<FileSortOption>('latest');

  const filteredFiles = useMemo(() => {
    let result = [...files];

    // 상태 필터
    if (filter.status) {
      result = result.filter(file => file.status === filter.status);
    }

    // 날짜 범위 필터
    if (filter.dateFrom) {
      const fromDate = new Date(filter.dateFrom);
      result = result.filter(file => {
        const fileDate = new Date(file.generatedAt);
        return fileDate >= fromDate;
      });
    }

    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo);
      result = result.filter(file => {
        const fileDate = new Date(file.generatedAt);
        return fileDate <= toDate;
      });
    }

    // 정렬
    result.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
        case 'name':
          return a.regionName.localeCompare(b.regionName);
        case 'region':
          return a.regionName.localeCompare(b.regionName);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return result;
  }, [files, filter, sortBy]);

  const setStatusFilter = (status: string | null) => {
    setFilter({ ...filter, status: status as any });
  };

  const setDateRange = (dateFrom: string | null, dateTo: string | null) => {
    setFilter({ ...filter, dateFrom, dateTo });
  };

  const clearFilters = () => {
    setFilter({
      status: null,
      dateFrom: null,
      dateTo: null,
    });
    setSortBy('latest');
  };

  const isFiltered = filter.status !== null || filter.dateFrom !== null || filter.dateTo !== null || sortBy !== 'latest';

  return {
    filter,
    sortBy,
    filteredFiles,
    setStatusFilter,
    setDateRange,
    setSortBy,
    clearFilters,
    isFiltered,
  };
}
