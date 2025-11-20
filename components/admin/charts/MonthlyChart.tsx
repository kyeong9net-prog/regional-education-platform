'use client';

import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyStats } from '@/types';

interface MonthlyChartProps {
  data: MonthlyStats[];
  title?: string;
}

const MonthlyChart = memo(function MonthlyChart({ data, title = '월별 생성 건수' }: MonthlyChartProps) {
  // 월 형식을 "1월", "2월"로 변환
  const chartData = data.map(item => ({
    ...item,
    monthLabel: `${parseInt(item.month.split('-')[1])}월`,
  }));

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#4F46E5" name="생성 건수" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default MonthlyChart;
