import { Filter, X } from 'lucide-react';
import type { PeriodFilter } from '@/types';

interface StatsFilterProps {
  period: PeriodFilter;
  regionId: string | null;
  templateId: string | null;
  onPeriodChange: (period: PeriodFilter['period']) => void;
  onCustomDateChange: (startDate: string | undefined, endDate: string | undefined) => void;
  onRegionChange: (regionId: string | null) => void;
  onTemplateChange: (templateId: string | null) => void;
  onClearFilters: () => void;
  isFiltered: boolean;
}

export default function StatsFilter({
  period,
  regionId,
  templateId,
  onPeriodChange,
  onCustomDateChange,
  onRegionChange,
  onTemplateChange,
  onClearFilters,
  isFiltered,
}: StatsFilterProps) {
  return (
    <div className="bg-white border rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">필터:</span>
        </div>

        {/* 기간 선택 */}
        <select
          value={period.period}
          onChange={(e) => onPeriodChange(e.target.value as PeriodFilter['period'])}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="7days">최근 7일</option>
          <option value="30days">최근 30일</option>
          <option value="90days">최근 90일</option>
          <option value="all">전체</option>
          <option value="custom">직접 선택</option>
        </select>

        {/* 커스텀 날짜 범위 */}
        {period.period === 'custom' && (
          <>
            <input
              type="date"
              value={period.startDate || ''}
              onChange={(e) => onCustomDateChange(e.target.value || undefined, period.endDate)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-gray-500">~</span>
            <input
              type="date"
              value={period.endDate || ''}
              onChange={(e) => onCustomDateChange(period.startDate, e.target.value || undefined)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </>
        )}

        {/* 지역 필터 */}
        <select
          value={regionId || ''}
          onChange={(e) => onRegionChange(e.target.value || null)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">전체 지역</option>
          <option value="1">서울시 강남구</option>
          <option value="2">서울시 서초구</option>
          <option value="3">서울시 송파구</option>
          <option value="4">경기도 성남시</option>
        </select>

        {/* 템플릿 필터 */}
        <select
          value={templateId || ''}
          onChange={(e) => onTemplateChange(e.target.value || null)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">전체 템플릿</option>
          <option value="1">우리 지역 소개</option>
          <option value="2">지역 특산물</option>
          <option value="3">지역 문화재</option>
          <option value="4">지역 축제</option>
        </select>

        {/* 필터 초기화 */}
        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            <X className="w-3 h-3" />
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
