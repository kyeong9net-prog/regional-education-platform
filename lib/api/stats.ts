/**
 * Phase 6: 통계 데이터 API 모킹
 * 실제 백엔드 API 연동 전까지 더미 데이터를 반환합니다.
 */

import type {
  OverallStats,
  MonthlyStats,
  RegionStats,
  TemplateStats,
  PeriodFilter,
  DashboardNotification,
} from '@/types';

// 딜레이 시뮬레이션
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 전체 통계 조회
 */
export async function getOverallStats(): Promise<OverallStats> {
  await delay(300);

  return {
    totalGenerations: 3245,
    totalUsers: 542,
    averageGenerationTime: '1분 45초',
    todayGenerations: 87,
    todayUsers: 23,
    weeklyGrowth: 12.5,
    monthlyGrowth: 24.8,
  };
}

/**
 * 월별 생성 건수 조회
 */
export async function getMonthlyStats(months: number = 6): Promise<MonthlyStats[]> {
  await delay(300);

  const now = new Date();
  const stats: MonthlyStats[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    stats.push({
      month,
      count: Math.floor(Math.random() * 200) + 300, // 300-500 사이
      users: Math.floor(Math.random() * 50) + 70, // 70-120 사이
    });
  }

  return stats;
}

/**
 * 지역별 통계 조회
 */
export async function getRegionStats(filter?: PeriodFilter): Promise<RegionStats[]> {
  await delay(300);

  const regions = [
    { regionId: '1', regionName: '서울시 강남구', count: 523 },
    { regionId: '2', regionName: '서울시 서초구', count: 412 },
    { regionId: '3', regionName: '서울시 송파구', count: 387 },
    { regionId: '4', regionName: '경기도 성남시', count: 345 },
    { regionId: '5', regionName: '서울시 강동구', count: 298 },
    { regionId: '6', regionName: '경기도 수원시', count: 276 },
    { regionId: '7', regionName: '서울시 마포구', count: 234 },
    { regionId: '8', regionName: '인천시 남동구', count: 198 },
  ];

  const total = regions.reduce((sum, r) => sum + r.count, 0);

  return regions.map(region => ({
    ...region,
    percentage: Math.round((region.count / total) * 100 * 10) / 10,
  }));
}

/**
 * 템플릿별 사용 빈도 조회
 */
export async function getTemplateStats(filter?: PeriodFilter): Promise<TemplateStats[]> {
  await delay(300);

  const templates = [
    { templateId: '1', templateName: '우리 지역 소개', count: 1234 },
    { templateId: '2', templateName: '지역 특산물', count: 987 },
    { templateId: '3', templateName: '지역 문화재', count: 765 },
    { templateId: '4', templateName: '지역 축제', count: 543 },
    { templateId: '5', templateName: '지역 인물', count: 421 },
  ];

  const total = templates.reduce((sum, t) => sum + t.count, 0);

  return templates.map(template => ({
    ...template,
    percentage: Math.round((template.count / total) * 100 * 10) / 10,
  }));
}

/**
 * 사용자 증가 추이 조회 (월별)
 */
export async function getUserGrowthStats(months: number = 6): Promise<MonthlyStats[]> {
  await delay(300);

  const now = new Date();
  const stats: MonthlyStats[] = [];
  let cumulativeUsers = 300;

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const newUsers = Math.floor(Math.random() * 30) + 40; // 40-70 사이
    cumulativeUsers += newUsers;

    stats.push({
      month,
      count: 0, // 이 필드는 사용하지 않음
      users: cumulativeUsers,
    });
  }

  return stats;
}

/**
 * 대시보드 알림/공지사항 조회
 */
export async function getNotifications(): Promise<DashboardNotification[]> {
  await delay(200);

  return [
    {
      id: '1',
      type: 'success',
      title: '시스템 업데이트 완료',
      message: '새로운 템플릿 3종이 추가되었습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
      isRead: false,
    },
    {
      id: '2',
      type: 'info',
      title: '월간 목표 달성',
      message: '이번 달 생성 건수가 목표치를 초과했습니다!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
      isRead: false,
    },
    {
      id: '3',
      type: 'warning',
      title: '서버 점검 예정',
      message: '내일 오전 2시 ~ 4시 서버 점검이 예정되어 있습니다.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
      isRead: true,
    },
  ];
}
