import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import type { OverallStats } from '@/types';

interface WeeklyCompareWidgetProps {
  stats: OverallStats;
}

export default function WeeklyCompareWidget({ stats }: WeeklyCompareWidgetProps) {
  const isGrowthPositive = stats.weeklyGrowth > 0;

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">주간 비교</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">주간 성장률</p>
            <div className="flex items-center gap-2">
              {isGrowthPositive ? (
                <TrendingUp className="w-5 h-5 text-green-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-2xl font-bold ${isGrowthPositive ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(stats.weeklyGrowth)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">전주 대비</p>
            <p className="text-sm font-medium text-gray-900">
              {isGrowthPositive ? '증가' : '감소'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">월간 성장률</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {stats.monthlyGrowth}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">전월 대비</p>
            <p className="text-sm font-medium text-gray-900">증가</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            지속적인 성장세를 보이고 있습니다 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
