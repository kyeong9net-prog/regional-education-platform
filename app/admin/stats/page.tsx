'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FileText, Users, Clock, TrendingUp, Download, FileDown } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import StatsFilter from '@/components/admin/StatsFilter';
import Loading from '@/components/common/Loading';

// 차트 컴포넌트를 동적 import로 코드 스플리팅
const MonthlyChart = dynamic(() => import('@/components/admin/charts/MonthlyChart'), {
  loading: () => <div className="h-[300px] flex items-center justify-center"><Loading /></div>,
});
const RegionPieChart = dynamic(() => import('@/components/admin/charts/RegionPieChart'), {
  loading: () => <div className="h-[300px] flex items-center justify-center"><Loading /></div>,
});
const TemplateBarChart = dynamic(() => import('@/components/admin/charts/TemplateBarChart'), {
  loading: () => <div className="h-[300px] flex items-center justify-center"><Loading /></div>,
});
const UserGrowthChart = dynamic(() => import('@/components/admin/charts/UserGrowthChart'), {
  loading: () => <div className="h-[300px] flex items-center justify-center"><Loading /></div>,
});

// 위젯 컴포넌트도 동적 import
const RealtimeWidget = dynamic(() => import('@/components/admin/widgets/RealtimeWidget'));
const TodayStatsWidget = dynamic(() => import('@/components/admin/widgets/TodayStatsWidget'));
const WeeklyCompareWidget = dynamic(() => import('@/components/admin/widgets/WeeklyCompareWidget'));
const NotificationWidget = dynamic(() => import('@/components/admin/widgets/NotificationWidget'));
import { useStatsFilter } from '@/lib/hooks/useStatsFilter';
import {
  getOverallStats,
  getMonthlyStats,
  getRegionStats,
  getTemplateStats,
  getUserGrowthStats,
  getNotifications,
} from '@/lib/api/stats';
import { exportToCSV, exportToPDF, convertStatsToPDFContent } from '@/lib/utils/export';
import type {
  OverallStats,
  MonthlyStats,
  RegionStats,
  TemplateStats,
  DashboardNotification,
} from '@/types';

export default function AdminStatsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStats[]>([]);
  const [userGrowthStats, setUserGrowthStats] = useState<MonthlyStats[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  const {
    period,
    regionId,
    templateId,
    handlePeriodChange,
    handleCustomDateChange,
    setRegionId,
    setTemplateId,
    clearFilters,
    isFiltered,
  } = useStatsFilter();

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [overall, monthly, regions, templates, userGrowth, notifs] = await Promise.all([
          getOverallStats(),
          getMonthlyStats(6),
          getRegionStats(period),
          getTemplateStats(period),
          getUserGrowthStats(6),
          getNotifications(),
        ]);

        setOverallStats(overall);
        setMonthlyStats(monthly);
        setRegionStats(regions);
        setTemplateStats(templates);
        setUserGrowthStats(userGrowth);
        setNotifications(notifs);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [period, regionId, templateId]);

  const handleExportCSV = () => {
    if (!overallStats) return;

    const data = [
      { 항목: '전체 생성 건수', 값: overallStats.totalGenerations },
      { 항목: '전체 사용자 수', 값: overallStats.totalUsers },
      { 항목: '평균 생성 시간', 값: overallStats.averageGenerationTime },
      { 항목: '오늘 생성 건수', 값: overallStats.todayGenerations },
      { 항목: '오늘 사용자 수', 값: overallStats.todayUsers },
      { 항목: '주간 성장률', 값: `${overallStats.weeklyGrowth}%` },
      { 항목: '월간 성장률', 값: `${overallStats.monthlyGrowth}%` },
    ];

    exportToCSV(data, `통계_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    if (!overallStats) return;

    const data = [
      { 항목: '전체 생성 건수', 값: overallStats.totalGenerations },
      { 항목: '전체 사용자 수', 값: overallStats.totalUsers },
      { 항목: '평균 생성 시간', 값: overallStats.averageGenerationTime },
      { 항목: '오늘 생성 건수', 값: overallStats.todayGenerations },
      { 항목: '오늘 사용자 수', 값: overallStats.todayUsers },
      { 항목: '주간 성장률', 값: `${overallStats.weeklyGrowth}%` },
      { 항목: '월간 성장률', 값: `${overallStats.monthlyGrowth}%` },
    ];

    const content = convertStatsToPDFContent(data);
    exportToPDF('통계 리포트', content);
  };

  if (isLoading || !overallStats) {
    return (
      <main className="flex-1 p-8">
        <Loading />
      </main>
    );
  }

  return (
    <main className="flex-1 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">통계 대시보드</h1>
            <p className="text-gray-600">서비스 이용 현황과 통계를 확인합니다.</p>
          </div>

          {/* 내보내기 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV 내보내기
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              PDF 리포트
            </button>
          </div>
        </div>

        {/* 필터 */}
        <StatsFilter
          period={period}
          regionId={regionId}
          templateId={templateId}
          onPeriodChange={handlePeriodChange}
          onCustomDateChange={handleCustomDateChange}
          onRegionChange={setRegionId}
          onTemplateChange={setTemplateId}
          onClearFilters={clearFilters}
          isFiltered={isFiltered}
        />

        {/* 주요 지표 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="총 생성 건수"
            value={overallStats.totalGenerations.toLocaleString()}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="이용 교사"
            value={overallStats.totalUsers.toLocaleString()}
            icon={Users}
            color="green"
          />
          <StatsCard
            title="평균 생성 시간"
            value={overallStats.averageGenerationTime}
            icon={Clock}
            color="purple"
          />
          <StatsCard
            title="주간 성장률"
            value={`${overallStats.weeklyGrowth}%`}
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* 위젯 섹션 */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <TodayStatsWidget stats={overallStats} />
          <WeeklyCompareWidget stats={overallStats} />
          <RealtimeWidget activeUsers={12} generatingNow={3} />
        </div>

        {/* 차트 섹션 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <MonthlyChart data={monthlyStats} />
          <UserGrowthChart data={userGrowthStats} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <RegionPieChart data={regionStats} />
          <TemplateBarChart data={templateStats} />
        </div>

        {/* 알림 위젯 */}
        <div className="mb-8">
          <NotificationWidget notifications={notifications} />
        </div>
      </div>
    </main>
  );
}
