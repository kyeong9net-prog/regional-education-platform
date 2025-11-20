'use client';

import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TemplateStats } from '@/types';

interface TemplateBarChartProps {
  data: TemplateStats[];
  title?: string;
}

const TemplateBarChart = memo(function TemplateBarChart({ data, title = '템플릿별 사용 빈도' }: TemplateBarChartProps) {
  const chartData = data.map(item => ({
    name: item.templateName,
    count: item.count,
  }));

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={120} />
          <Tooltip />
          <Bar dataKey="count" fill="#7C3AED" name="사용 횟수" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default TemplateBarChart;
