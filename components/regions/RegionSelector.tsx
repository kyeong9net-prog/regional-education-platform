'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Region } from '@/lib/dummy-data';

interface RegionSelectorProps {
  regions: Region[];
  onSelect: (region: Region) => void;
}

export default function RegionSelector({ regions, onSelect }: RegionSelectorProps) {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // 시/도 목록 추출 (중복 제거)
  const provinces = Array.from(new Set(regions.map((r) => r.province))).sort();

  // 선택된 시/도의 시/군/구 목록
  const districts = selectedProvince
    ? regions.filter((r) => r.province === selectedProvince)
    : [];

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
  };

  const handleDistrictSelect = (region: Region) => {
    onSelect(region);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* 1단계: 시/도 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          1단계: 시/도 선택
        </h3>
        <div className="space-y-2">
          {provinces.map((province) => (
            <button
              key={province}
              onClick={() => handleProvinceSelect(province)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                selectedProvince === province
                  ? 'border-primary bg-blue-50 text-primary'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{province}</span>
              {selectedProvince === province && (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2단계: 시/군/구 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          2단계: 시/군/구 선택
        </h3>
        {!selectedProvince ? (
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-center">
              먼저 시/도를 선택해주세요
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {districts.map((region) => (
              <button
                key={region.id}
                onClick={() => handleDistrictSelect(region)}
                className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-blue-50 hover:text-primary transition-all text-left group"
              >
                <span className="font-medium">{region.district}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
