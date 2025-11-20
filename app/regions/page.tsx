'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import RegionSearch from '@/components/regions/RegionSearch';
import RegionCard from '@/components/regions/RegionCard';
import { supabase } from '@/lib/supabase/client';
import type { Region } from '@/lib/supabase/types';

export default function RegionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase에서 지역 데이터 가져오기
  useEffect(() => {
    async function fetchRegions() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('regions')
          .select('*')
          .order('province', { ascending: true })
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        // 데이터 변환
        const transformedRegions: Region[] = (data || []).map((row: any) => {
          const district = row.name.replace(row.province, '').trim();
          return {
            id: row.id,
            name: row.name,
            code: row.code,
            province: row.province,
            district: district,
            description: row.description || undefined,
            imageUrl: row.image_url || undefined,
          };
        });

        setRegions(transformedRegions);
      } catch (err) {
        console.error('Error fetching regions:', err);
        setError('지역 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchRegions();
  }, []);

  const filteredRegions = regions.filter(
    (region) =>
      region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);
    // 실제 구현 시: localStorage 또는 상태관리로 저장
    localStorage.setItem('selectedRegion', JSON.stringify(region));
    // 다음 단계로 이동
    router.push('/generate');
  };

  return (
    <div className="flex">
      <Navigation />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              지역 선택
            </h1>
            <p className="text-gray-600">
              수업자료를 생성할 지역을 선택해주세요.
            </p>
          </div>

          <div className="mb-8">
            <RegionSearch onSearch={setSearchQuery} />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {selectedRegion && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>{selectedRegion.name}</strong>을(를) 선택했습니다.
                PPT 생성 페이지로 이동합니다.
              </p>
            </div>
          )}

          {/* 로딩 상태 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">지역 데이터를 불러오는 중...</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                {filteredRegions.length > 0 ? (
                  filteredRegions.map((region) => (
                    <RegionCard
                      key={region.id}
                      region={region}
                      onSelect={handleSelectRegion}
                    />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12 text-gray-500">
                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 지역이 없습니다.'}
                  </div>
                )}
              </div>

              {filteredRegions.length > 0 && (
                <div className="mt-6 text-sm text-gray-500 text-center">
                  총 {filteredRegions.length}개 지역
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
