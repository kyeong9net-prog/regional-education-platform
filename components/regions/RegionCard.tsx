'use client';

import { MapPin } from 'lucide-react';
import type { Region } from '@/lib/supabase/types';

interface RegionCardProps {
  region: Region;
  onSelect: (region: Region) => void;
}

export default function RegionCard({ region, onSelect }: RegionCardProps) {
  return (
    <button
      onClick={() => onSelect(region)}
      className="w-full p-6 bg-white border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all text-left group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {region.name}
          </h3>
          <p className="text-sm text-gray-600">
            {region.province} {region.district}
          </p>
        </div>
      </div>
    </button>
  );
}
