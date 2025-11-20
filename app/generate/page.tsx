'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/layout/Navigation';
import GenerateButton from '@/components/generate/GenerateButton';
import GenerationStatus from '@/components/generate/GenerationStatus';
import { MapPin, FileText } from 'lucide-react';
import type { Region } from '@/lib/dummy-data';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  slides_count: number;
  file_path: string;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  // 지역 정보 로드
  useEffect(() => {
    const stored = localStorage.getItem('selectedRegion');
    if (stored) {
      setSelectedRegion(JSON.parse(stored));
    } else {
      router.push('/regions');
    }
  }, [router]);

  // 템플릿 목록 로드
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/templates?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates);
          // 첫 번째 템플릿을 자동 선택
          if (data.templates.length > 0) {
            setSelectedTemplate(data.templates[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleGenerate = () => {
    setStatus('processing');

    // 더미: 3초 후 완료
    setTimeout(() => {
      setStatus('completed');

      // 5초 후 다운로드 페이지로 이동
      setTimeout(() => {
        router.push('/downloads');
      }, 2000);
    }, 3000);
  };

  if (!selectedRegion) {
    return (
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-8">
          <div className="text-center py-12">
            <p className="text-gray-500">지역을 선택해주세요...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Navigation />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              PPT 자료 생성
            </h1>
            <p className="text-gray-600">
              선택한 지역의 수업자료를 생성합니다.
            </p>
          </div>

          {/* 선택된 지역 정보 */}
          <div className="mb-8 p-6 bg-white border rounded-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedRegion.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedRegion.province} {selectedRegion.district}
                </p>
              </div>
            </div>
          </div>

          {/* 템플릿 선택 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">템플릿 선택</h3>
            {loading ? (
              <div className="p-6 bg-white border rounded-lg text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">템플릿 목록을 불러오는 중...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="p-6 bg-white border rounded-lg text-center">
                <p className="text-gray-500">사용 가능한 템플릿이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-2">관리자에게 문의하세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-6 bg-white border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary ring-2 ring-primary ring-opacity-50'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {template.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {template.description}
                        </p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <span>카테고리: {template.category}</span>
                          <span>슬라이드: {template.slides_count}장</span>
                        </div>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <div className="text-primary font-semibold">선택됨</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 생성 버튼 */}
          {selectedTemplate && !loading && (
            <>
              <GenerateButton
                regionName={selectedRegion.name}
                onGenerate={handleGenerate}
              />

              {/* 생성 상태 */}
              <GenerationStatus status={status} regionName={selectedRegion.name} />
            </>
          )}

          {/* 안내 메시지 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">
              생성되는 내용
            </h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>지역명 자동 반영 (텍스트 내 지명·학교명 치환)</li>
              <li>지역 사진 자동 삽입 (공공데이터 기반)</li>
              <li>AI 기반 지역 특화 설명문 생성</li>
              <li>지도 및 좌표 자동 매핑</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
