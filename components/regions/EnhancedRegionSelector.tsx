'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, X, Star, Clock, ChevronRight } from 'lucide-react';
import type { Region } from '@/types';
import { useRegionSearch } from '@/lib/hooks/useRegionSearch';
import { useSearchHistory } from '@/lib/hooks/useSearchHistory';
import { useRegionFilter } from '@/lib/hooks/useRegionFilter';
import { useRecentRegions } from '@/lib/hooks/useRecentRegions';
import { useFavoriteRegions } from '@/lib/hooks/useFavoriteRegions';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface EnhancedRegionSelectorProps {
  regions: Region[];
  onSelect: (region: Region) => void;
}

type TabType = 'all' | 'favorites' | 'recent';

export default function EnhancedRegionSelector({ regions, onSelect }: EnhancedRegionSelectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [inputValue, setInputValue] = useState('');

  // 검색어 디바운싱 (300ms)
  const debouncedSearchQuery = useDebounce(inputValue, 300);

  // 검색 기능
  const { searchQuery, filteredRegions, handleSearch, clearSearch } = useRegionSearch(regions);
  const { history, addToHistory } = useSearchHistory();

  // 필터 기능
  const {
    selectedProvince,
    setSelectedProvince,
    filteredRegions: provinceFilteredRegions,
    provinces,
    clearFilter
  } = useRegionFilter(filteredRegions);

  // 최근 선택 및 즐겨찾기
  const { recentRegions, addRecentRegion } = useRecentRegions();
  const { favoriteRegions, isFavorite, toggleFavorite } = useFavoriteRegions();

  // 디바운스된 검색어로 실제 검색 수행
  useEffect(() => {
    handleSearch(debouncedSearchQuery);
    if (debouncedSearchQuery.trim()) {
      addToHistory(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, handleSearch, addToHistory]);

  // 현재 탭에 따른 지역 목록 (메모이제이션)
  const currentRegions = useMemo((): Region[] => {
    if (activeTab === 'favorites') return favoriteRegions;
    if (activeTab === 'recent') return recentRegions;
    return provinceFilteredRegions;
  }, [activeTab, favoriteRegions, recentRegions, provinceFilteredRegions]);

  // 검색 입력 처리 (디바운싱 적용)
  const handleSearchChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // 지역 선택 처리
  const handleRegionSelect = useCallback((region: Region) => {
    setSelectedRegion(region);
    addRecentRegion(region);
    onSelect(region);
  }, [addRecentRegion, onSelect]);

  // 검색 초기화
  const handleClearSearch = useCallback(() => {
    setInputValue('');
    clearSearch();
    clearFilter();
  }, [clearSearch, clearFilter]);

  return (
    <div className="space-y-6">
      {/* 검색 바 */}
      <div className="relative">
        <label htmlFor="region-search" className="sr-only">
          지역명 검색
        </label>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
        <input
          id="region-search"
          type="text"
          placeholder="지역명 검색 (초성 검색 가능: ㅅㅇ → 서울)"
          value={inputValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          aria-label="지역명 검색 입력창"
          aria-describedby="search-hint"
        />
        <span id="search-hint" className="sr-only">
          초성 검색을 사용할 수 있습니다. 예: ㅅㅇ 입력 시 서울이 검색됩니다
        </span>
        {inputValue && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded"
            aria-label="검색어 지우기"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* 검색 히스토리 (검색어 입력 중일 때만 표시) */}
      {inputValue && history.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {history.slice(0, 5).map((item, index) => (
            <button
              key={index}
              onClick={() => handleSearch(item)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* 탭 메뉴 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label="지역 필터 탭">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-t ${
            activeTab === 'all'
              ? 'text-primary'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
          role="tab"
          aria-selected={activeTab === 'all'}
          aria-controls="region-list"
        >
          전체 지역
          {activeTab === 'all' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 font-medium transition-colors relative flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-t ${
            activeTab === 'favorites'
              ? 'text-primary'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
          role="tab"
          aria-selected={activeTab === 'favorites'}
          aria-controls="region-list"
          aria-label={`즐겨찾기 ${favoriteRegions.length}개`}
        >
          <Star className="w-4 h-4" aria-hidden="true" />
          즐겨찾기
          {favoriteRegions.length > 0 && (
            <span className="text-xs bg-primary text-white rounded-full px-1.5 py-0.5 ml-1" aria-hidden="true">
              {favoriteRegions.length}
            </span>
          )}
          {activeTab === 'favorites' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`px-4 py-2 font-medium transition-colors relative flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-t ${
            activeTab === 'recent'
              ? 'text-primary'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
          }`}
          role="tab"
          aria-selected={activeTab === 'recent'}
          aria-controls="region-list"
          aria-label={`최근 선택 ${recentRegions.length}개`}
        >
          <Clock className="w-4 h-4" aria-hidden="true" />
          최근 선택
          {recentRegions.length > 0 && (
            <span className="text-xs bg-primary text-white rounded-full px-1.5 py-0.5 ml-1" aria-hidden="true">
              {recentRegions.length}
            </span>
          )}
          {activeTab === 'recent' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* 시/도 필터 (전체 탭일 때만 표시) */}
      {activeTab === 'all' && !inputValue && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearFilter}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
              !selectedProvince
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            전체
          </button>
          {provinces.map((province) => (
            <button
              key={province}
              onClick={() => setSelectedProvince(province)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                selectedProvince === province
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {province}
            </button>
          ))}
        </div>
      )}

      {/* 지역 목록 */}
      <div
        id="region-list"
        className="space-y-2 max-h-96 overflow-y-auto"
        role="tabpanel"
        aria-label={`${activeTab === 'all' ? '전체' : activeTab === 'favorites' ? '즐겨찾기' : '최근 선택'} 지역 목록`}
      >
        {currentRegions.length === 0 ? (
          <div className="py-12 text-center text-gray-400" role="status">
            <p>
              {activeTab === 'favorites' && '즐겨찾기한 지역이 없습니다'}
              {activeTab === 'recent' && '최근 선택한 지역이 없습니다'}
              {activeTab === 'all' && '검색 결과가 없습니다'}
            </p>
          </div>
        ) : (
          currentRegions.map((region) => (
            <div
              key={region.id}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:shadow-sm transition-all"
            >
              <button
                onClick={() => handleRegionSelect(region)}
                className="flex-1 flex items-center justify-between text-left group focus:outline-none focus:ring-2 focus:ring-primary rounded"
                aria-label={`${region.name} 선택 - ${region.province} ${region.district}`}
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary">
                    {region.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {region.province} {region.district}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary" aria-hidden="true" />
              </button>
              <button
                onClick={() => toggleFavorite(region)}
                className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  isFavorite(region.id)
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-gray-300 hover:text-gray-400'
                }`}
                aria-label={isFavorite(region.id) ? `${region.name} 즐겨찾기 해제` : `${region.name} 즐겨찾기 추가`}
                aria-pressed={isFavorite(region.id)}
              >
                <Star className="w-5 h-5" fill={isFavorite(region.id) ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* 선택된 지역 미리보기 */}
      {selectedRegion && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-1">선택된 지역</h4>
          <p className="text-lg font-semibold text-primary">
            {selectedRegion.province} {selectedRegion.name}
          </p>
          {selectedRegion.description && (
            <p className="text-sm text-gray-600 mt-2">{selectedRegion.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
