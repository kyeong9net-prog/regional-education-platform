// 도메인 타입 정의

export interface Region {
  id: string;
  name: string;
  province: string;
  district: string;
  // Phase 2: 확장된 필드
  latitude?: number;
  longitude?: number;
  description?: string;
  imageUrl?: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  description?: string;
}

export interface VersionHistoryEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface Template {
  id: string;
  title: string;
  description: string;
  version: string;
  thumbnailUrl: string;
  createdAt: string;
  // Phase 3: 확장된 필드
  variables?: TemplateVariable[];
  slideCount?: number;
  fileSize?: string;
  category?: string;
  tags?: string[];
  isActive?: boolean;
  previewImageUrl?: string;
  usageGuide?: string;
  versionHistory?: VersionHistoryEntry[];
}

export interface GeneratedFile {
  id: string;
  regionName: string;
  templateTitle: string;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
}

export interface Stats {
  totalGenerations: number;
  totalUsers: number;
  averageGenerationTime: string;
  popularRegions: { name: string; count: number }[];
}

// Phase 4: PPT 생성 관련 타입
export interface GenerationOptions {
  // schoolName은 제거됨 - 항상 "수업자료"로 하드코딩
  photoStyle: 'realistic' | 'illustration' | 'mixed'; // 자동: 실사 우선 → 일러스트 폴백
  slideCount: number;
}

export type GenerationStatus = 'idle' | 'preparing' | 'generating' | 'completed' | 'failed';

export interface GenerationProgress {
  status: GenerationStatus;
  progress: number; // 0-100
  currentStep?: string;
  estimatedTimeRemaining?: number; // seconds
}

// Phase 5: 파일 관리 관련 타입
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export type FileStatus = 'completed' | 'processing' | 'failed';

export type FileSortOption = 'latest' | 'name' | 'region' | 'status';

export interface FileFilter {
  status?: FileStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface DownloadProgress {
  fileId: string;
  progress: number; // 0-100
  status: 'downloading' | 'completed' | 'failed';
}

// Phase 6: 통계 및 대시보드 관련 타입
export interface MonthlyStats {
  month: string; // "2025-01" 형식
  count: number;
  users: number;
}

export interface RegionStats {
  regionId: string;
  regionName: string;
  count: number;
  percentage: number;
}

export interface TemplateStats {
  templateId: string;
  templateName: string;
  count: number;
  percentage: number;
}

export interface OverallStats {
  totalGenerations: number;
  totalUsers: number;
  averageGenerationTime: string; // "1분 45초" 형식
  todayGenerations: number;
  todayUsers: number;
  weeklyGrowth: number; // 주간 성장률 (%)
  monthlyGrowth: number; // 월간 성장률 (%)
}

export interface PeriodFilter {
  period: '7days' | '30days' | '90days' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface StatsFilter {
  period: PeriodFilter;
  regionId?: string | null;
  templateId?: string | null;
}

export interface DashboardNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}
