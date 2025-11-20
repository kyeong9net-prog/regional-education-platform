import { useState, useMemo } from 'react';
import type { Pagination } from '@/types';

/**
 * 페이지네이션 훅
 * Phase 5: 페이지당 10개 아이템 표시
 */
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const pagination: Pagination = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
    };
  }, [items.length, itemsPerPage, currentPage]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, pagination.totalPages));
    setCurrentPage(validPage);
  };

  const nextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    pagination,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
  };
}
