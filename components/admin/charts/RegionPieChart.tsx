'use client';

import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { RegionStats } from '@/types';

interface RegionPieChartProps {
  data: RegionStats[];
  title?: string;
}

const COLORS = ['#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669'];

const RegionPieChart = memo(function RegionPieChart({ data, title = '지역별 생성 비율' }: RegionPieChartProps) {
  // 상위 8개만 표시, 나머지는 "기타"로 합산
  const topData = data.slice(0, 8);
  const chartData = topData.map(item => ({
    name: item.regionName,
    value: item.count,
  }));

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => `${((props.percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

export default RegionPieChart;
