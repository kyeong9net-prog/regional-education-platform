import { useState, useMemo } from 'react';
import type { Template } from '@/types';

/**
 * 템플릿 검색 훅
 * SOLID 원칙: Single Responsibility - 템플릿 검색 로직만 담당
 */
export function useTemplateSearch(templates: Template[]) {
  const [searchQuery, setSearchQuery] = useState('');

  // 제목 및 설명 기반 검색
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(template =>
      template.title.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      (template.category && template.category.toLowerCase().includes(query)) ||
      (template.tags && template.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [templates, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return {
    searchQuery,
    filteredTemplates,
    handleSearch,
    clearSearch,
    hasResults: filteredTemplates.length > 0,
    resultCount: filteredTemplates.length,
  };
}
