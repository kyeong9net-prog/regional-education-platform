import { useState, useEffect } from 'react';
import type { Region } from '@/types';

const STORAGE_KEY = 'favorite_regions';

/**
 * 즐겨찾기 관리 훅
 * SOLID 원칙: Single Responsibility - 즐겨찾기 관리만 담당
 */
export function useFavoriteRegions() {
  const [favoriteRegions, setFavoriteRegions] = useState<Region[]>([]);

  // localStorage에서 즐겨찾기 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFavoriteRegions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load favorite regions:', error);
    }
  }, []);

  // 즐겨찾기 추가
  const addFavorite = (region: Region) => {
    setFavoriteRegions(prev => {
      // 중복 방지
      if (prev.some(item => item.id === region.id)) {
        return prev;
      }

      const newFavorites = [...prev, region];

      // localStorage에 저장
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      } catch (error) {
        console.error('Failed to save favorite regions:', error);
      }

      return newFavorites;
    });
  };

  // 즐겨찾기 제거
  const removeFavorite = (regionId: string) => {
    setFavoriteRegions(prev => {
      const newFavorites = prev.filter(item => item.id !== regionId);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      } catch (error) {
        console.error('Failed to save favorite regions:', error);
      }

      return newFavorites;
    });
  };

  // 즐겨찾기 여부 확인
  const isFavorite = (regionId: string): boolean => {
    return favoriteRegions.some(item => item.id === regionId);
  };

  // 즐겨찾기 토글
  const toggleFavorite = (region: Region) => {
    if (isFavorite(region.id)) {
      removeFavorite(region.id);
    } else {
      addFavorite(region);
    }
  };

  // 즐겨찾기 전체 삭제
  const clearFavorites = () => {
    setFavoriteRegions([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear favorite regions:', error);
    }
  };

  return {
    favoriteRegions,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    clearFavorites,
  };
}
