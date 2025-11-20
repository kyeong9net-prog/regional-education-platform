import { useState, useEffect } from 'react';

const STORAGE_KEY = 'region_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * 검색 히스토리 관리 훅
 * SOLID 원칙: Single Responsibility - 검색 히스토리 관리만 담당
 */
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // localStorage에서 히스토리 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // 히스토리에 검색어 추가
  const addToHistory = (query: string) => {
    if (!query.trim()) return;

    setHistory(prev => {
      // 중복 제거 및 최신 항목을 앞에 배치
      const newHistory = [
        query,
        ...prev.filter(item => item !== query)
      ].slice(0, MAX_HISTORY_ITEMS);

      // localStorage에 저장
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }

      return newHistory;
    });
  };

  // 히스토리에서 항목 제거
  const removeFromHistory = (query: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== query);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error('Failed to save search history:', error);
      }

      return newHistory;
    });
  };

  // 히스토리 전체 삭제
  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
