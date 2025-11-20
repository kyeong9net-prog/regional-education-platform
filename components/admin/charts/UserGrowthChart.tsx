'use client';

import { memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyStats } from '@/types';

interface UserGrowthChartProps {
  data: MonthlyStats[];
  title?: string;
}

const UserGrowthChart = memo(function UserGrowthChart({ data, title = '사용자 증가 추이' }: UserGrowthChartProps) {
  const chartData = data.map(item => ({
    ...item,
    monthLabel: `${parseInt(item.month.split('-')[1])}월`,
  }));

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="monthLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="users" stroke="#059669" strokeWidth={2} name="누적 사용자" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default UserGrowthChart;
