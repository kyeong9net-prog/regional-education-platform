import { useState } from 'react';
import type { PeriodFilter } from '@/types';

/**
 * Phase 6: 통계 필터 훅
 * 기간, 지역, 템플릿 필터를 관리합니다.
 */
export function useStatsFilter() {
  const [period, setPeriod] = useState<PeriodFilter>({
    period: '30days',
  });
  const [regionId, setRegionId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const handlePeriodChange = (newPeriod: PeriodFilter['period']) => {
    setPeriod({
      period: newPeriod,
      startDate: newPeriod === 'custom' ? period.startDate : undefined,
      endDate: newPeriod === 'custom' ? period.endDate : undefined,
    });
  };

  const handleCustomDateChange = (startDate: string | undefined, endDate: string | undefined) => {
    setPeriod({
      period: 'custom',
      startDate,
      endDate,
    });
  };

  const clearFilters = () => {
    setPeriod({ period: '30days' });
    setRegionId(null);
    setTemplateId(null);
  };

  const isFiltered = period.period !== '30days' || regionId !== null || templateId !== null;

  return {
    period,
    regionId,
    templateId,
    handlePeriodChange,
    handleCustomDateChange,
    setRegionId,
    setTemplateId,
    clearFilters,
    isFiltered,
  };
}
