import { Calendar, FileText, Users, TrendingUp } from 'lucide-react';
import type { OverallStats } from '@/types';

interface TodayStatsWidgetProps {
  stats: OverallStats;
}

export default function TodayStatsWidget({ stats }: TodayStatsWidgetProps) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">오늘의 통계</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-900">생성 건수</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.todayGenerations}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-900">이용자 수</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.todayUsers}</p>
        </div>

        <div className="col-span-2 p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-900">평균 생성 시간</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.averageGenerationTime}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
