import { useState, useMemo } from 'react';
import type { Template } from '@/types';

export type SortOption = 'latest' | 'name' | 'category';

/**
 * 템플릿 필터링 및 정렬 훅
 * SOLID 원칙: Single Responsibility - 필터링 및 정렬 로직만 담당
 */
export function useTemplateFilter(templates: Template[]) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showInactiveTemplates, setShowInactiveTemplates] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const categorySet = new Set(
      templates
        .map(t => t.category)
        .filter((c): c is string => c !== undefined && c !== null)
    );
    return Array.from(categorySet).sort();
  }, [templates]);

  // 필터링 및 정렬된 템플릿
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    // 카테고리 필터
    if (selectedCategory) {
      result = result.filter(t => t.category === selectedCategory);
    }

    // 활성화 상태 필터
    if (!showInactiveTemplates) {
      result = result.filter(t => t.isActive !== false);
    }

    // 정렬
    result.sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'category':
          const catA = a.category || '';
          const catB = b.category || '';
          return catA.localeCompare(catB);
        default:
          return 0;
      }
    });

    return result;
  }, [templates, selectedCategory, showInactiveTemplates, sortBy]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setShowInactiveTemplates(true);
    setSortBy('latest');
  };

  return {
    selectedCategory,
    setSelectedCategory,
    showInactiveTemplates,
    setShowInactiveTemplates,
    sortBy,
    setSortBy,
    categories,
    filteredTemplates,
    clearFilters,
    isFiltered: selectedCategory !== null || !showInactiveTemplates || sortBy !== 'latest',
  };
}
