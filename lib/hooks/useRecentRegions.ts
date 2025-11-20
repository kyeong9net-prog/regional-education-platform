import { useState, useEffect } from 'react';
import type { Region } from '@/types';

const STORAGE_KEY = 'recent_regions';
const MAX_RECENT_ITEMS = 5;

/**
 * 최근 선택 지역 관리 훅
 * SOLID 원칙: Single Responsibility - 최근 선택 지역 관리만 담당
 */
export function useRecentRegions() {
  const [recentRegions, setRecentRegions] = useState<Region[]>([]);

  // localStorage에서 최근 지역 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRecentRegions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load recent regions:', error);
    }
  }, []);

  // 최근 선택에 지역 추가
  const addRecentRegion = (region: Region) => {
    setRecentRegions(prev => {
      // 중복 제거 (ID 기준) 및 최신 항목을 앞에 배치
      const newRecent = [
        region,
        ...prev.filter(item => item.id !== region.id)
      ].slice(0, MAX_RECENT_ITEMS);

      // localStorage에 저장
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecent));
      } catch (error) {
        console.error('Failed to save recent regions:', error);
      }

      return newRecent;
    });
  };

  // 최근 선택 전체 삭제
  const clearRecentRegions = () => {
    setRecentRegions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent regions:', error);
    }
  };

  return {
    recentRegions,
    addRecentRegion,
    clearRecentRegions,
  };
}
