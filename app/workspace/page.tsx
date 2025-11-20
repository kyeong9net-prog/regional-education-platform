'use client';

import { useState, useEffect } from 'react';
import { type Region, type GeneratedFile } from '@/lib/dummy-data';
import type { Template } from '@/lib/supabase/types';
import EnhancedRegionSelector from '@/components/regions/EnhancedRegionSelector';
import TemplateSelector from '@/components/templates/TemplateSelector';
import GenerationOptionsForm from '@/components/workspace/GenerationOptions';
import GenerationProgress from '@/components/workspace/GenerationProgress';
import { FileText, MapPin, Download, CheckCircle2, Loader2, XCircle, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { loadRegions } from '@/lib/utils/region-loader';
import Loading from '@/components/common/Loading';
import { generatePPT, getGenerationStatus, cancelGeneration, getDownloadUrl } from '@/lib/api/generate';
import type { GenerationOptions, GenerationProgress as GenerationProgressType } from '@/types';

type Step = 'region' | 'template' | 'options' | 'generating' | 'download';

export default function WorkspacePage() {
  const [currentStep, setCurrentStep] = useState<Step>('region');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgressType | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingRegions, setIsLoadingRegions] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // 상태 저장 키
  const STORAGE_KEY = 'workspace_state';

  // 지역 데이터 로드
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const data = await loadRegions();
        setRegions(data);
      } catch (error) {
        console.error('Failed to load regions:', error);
      } finally {
        setIsLoadingRegions(false);
      }
    };

    fetchRegions();
  }, []);

  // 템플릿 데이터 로드 - 템플릿 단계일 때만 실행
  useEffect(() => {
    // 초기 로드 또는 템플릿 단계로 돌아올 때만 fetch
    if (currentStep === 'region' || currentStep === 'template') {
      const fetchTemplates = async () => {
        try {
          setIsLoadingTemplates(true);
          // 캐시 버스팅: 항상 최신 템플릿 불러오기 (관리자가 업로드했을 수 있음)
          const timestamp = `?t=${Date.now()}`;
          const response = await fetch(`/api/templates${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('[Client] Fetched templates:', data.templates.length, data.templates);
            setTemplates(data.templates);

            // LocalStorage에서 복원된 템플릿이 현재 목록에 있는지 검증
            if (selectedTemplate && !data.templates.find((t: Template) => t.id === selectedTemplate.id)) {
              console.warn('Selected template no longer exists, clearing selection');
              setSelectedTemplate(null);
            }
          }
        } catch (error) {
          console.error('Failed to load templates:', error);
        } finally {
          setIsLoadingTemplates(false);
        }
      };

      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // 상태 복원 (LocalStorage)
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.selectedRegion) setSelectedRegion(state.selectedRegion);
        if (state.selectedTemplate) setSelectedTemplate(state.selectedTemplate);
        if (state.currentStep) setCurrentStep(state.currentStep);
      } catch (error) {
        console.error('Failed to restore state:', error);
      }
    }
  }, []);

  // 상태 저장 (LocalStorage)
  useEffect(() => {
    const state = {
      selectedRegion,
      selectedTemplate,
      currentStep,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [selectedRegion, selectedTemplate, currentStep]);

  // 최근 생성 목록 조회 (download 단계에서)
  useEffect(() => {
    const fetchRecentGenerations = async () => {
      if (currentStep !== 'download') return;

      try {
        const response = await fetch('/api/recent-generations?limit=10');
        if (response.ok) {
          const data = await response.json();
          setGeneratedFiles(data);
        }
      } catch (error) {
        console.error('Failed to load recent generations:', error);
      }
    };

    fetchRecentGenerations();
  }, [currentStep]);

  // 페이지 포커스 시 템플릿 목록 자동 새로고침
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // 페이지가 다시 활성화되고, 템플릿 관련 단계일 때만
      if (!document.hidden && (currentStep === 'region' || currentStep === 'template')) {
        console.log('[Client] Page became visible, refreshing templates...');
        try {
          const timestamp = `?t=${Date.now()}`;
          const response = await fetch(`/api/templates${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('[Client] Auto-refreshed templates:', data.templates.length);
            setTemplates(data.templates);
          }
        } catch (error) {
          console.error('Failed to refresh templates:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentStep]);

  // 생성 진행률 폴링
  useEffect(() => {
    if (!currentJobId || !generationProgress) return;

    if (generationProgress.status === 'completed' || generationProgress.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const progress = await getGenerationStatus(currentJobId);
        setGenerationProgress(progress);

        if (progress.status === 'completed') {
          const url = await getDownloadUrl(currentJobId);
          setDownloadUrl(url);
          setCurrentStep('download');
        }
      } catch (error) {
        console.error('Failed to fetch generation status:', error);
        setGenerationProgress({
          status: 'failed',
          progress: 0,
          currentStep: '상태 조회 실패',
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentJobId, generationProgress]);

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);
    setCurrentStep('template');
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleConfirmTemplate = () => {
    if (selectedTemplate) {
      setCurrentStep('options');
    }
  };

  const handleSubmitOptions = async (options: GenerationOptions) => {
    if (!selectedRegion || !selectedTemplate) return;

    setGenerationOptions(options);
    setCurrentStep('generating');

    // 진행률 시뮬레이션 단계 정의
    const progressSteps = [
      { progress: 5, step: '템플릿 분석 중...', delay: 500 },
      { progress: 15, step: '관광 데이터 수집 중...', delay: 1500 },
      { progress: 30, step: '이미지 검색 중...', delay: 2000 },
      { progress: 50, step: '이미지 다운로드 중...', delay: 3000 },
      { progress: 70, step: 'PPTX 파일 생성 중...', delay: 2000 },
      { progress: 85, step: '이미지 삽입 중...', delay: 2000 },
      { progress: 95, step: '파일 업로드 중...', delay: 1000 },
    ];

    // 초기 상태 설정
    setGenerationProgress({
      status: 'generating',
      progress: 0,
      currentStep: '생성 준비 중...',
      estimatedTimeRemaining: 15,
    });

    // 진행률 시뮬레이션
    let isCompleted = false;
    const runProgressSimulation = async () => {
      for (let i = 0; i < progressSteps.length; i++) {
        if (isCompleted) break;
        await new Promise(resolve => setTimeout(resolve, progressSteps[i].delay));
        if (isCompleted) break;
        setGenerationProgress({
          status: 'generating',
          progress: progressSteps[i].progress,
          currentStep: progressSteps[i].step,
          estimatedTimeRemaining: Math.max(0, Math.ceil((progressSteps.length - i) * 2)),
        });
      }
    };

    // 시뮬레이션 시작
    runProgressSimulation();

    try {
      const { jobId, fileUrl, fileName } = await generatePPT(
        selectedRegion.name,
        selectedTemplate.id,
        options
      );
      setCurrentJobId(jobId);
      isCompleted = true;

      // 즉시 완료된 경우 (fileUrl이 있으면)
      if (fileUrl) {
        console.log('[Client] Generation completed immediately:', fileName);
        setDownloadUrl(fileUrl);
        setGenerationProgress({
          status: 'completed',
          progress: 100,
          currentStep: '생성 완료!',
          estimatedTimeRemaining: 0,
        });
        // 완료 페이지로 이동
        setTimeout(() => {
          setCurrentStep('download');
        }, 1500);
      } else {
        // 비동기 작업인 경우 (폴링 시작)
        setGenerationProgress({
          status: 'preparing',
          progress: 0,
          currentStep: '생성 준비 중...',
          estimatedTimeRemaining: 5,
        });
      }
    } catch (error) {
      console.error('Failed to start generation:', error);
      isCompleted = true;
      setGenerationProgress({
        status: 'failed',
        progress: 0,
        currentStep: '생성 시작 실패',
      });
    }
  };

  const handleRetry = async () => {
    if (!selectedRegion || !selectedTemplate || !generationOptions) return;
    await handleSubmitOptions(generationOptions);
  };

  const handleCancel = async () => {
    if (!currentJobId) return;

    try {
      await cancelGeneration(currentJobId);
      setGenerationProgress({
        status: 'failed',
        progress: 0,
        currentStep: '사용자에 의해 취소됨',
      });
    } catch (error) {
      console.error('Failed to cancel generation:', error);
    }
  };

  const handleDownload = async (fileUrl: string) => {
    try {
      // 새 창에서 다운로드 URL 열기
      window.open(fileUrl, '_blank');
      toast.success('다운로드를 시작합니다.');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('다운로드에 실패했습니다.');
    }
  };

  const handleBack = () => {
    if (currentStep === 'template') {
      setCurrentStep('region');
    } else if (currentStep === 'options') {
      setCurrentStep('template');
    } else if (currentStep === 'generating') {
      setCurrentStep('options');
    }
  };

  const handleRestart = () => {
    setCurrentStep('region');
    setSelectedRegion(null);
    setSelectedTemplate(null);
    setGenerationOptions(null);
    setGenerationProgress(null);
    setCurrentJobId(null);
    setDownloadUrl(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      {/* 상단 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">수업자료 생성</h1>
            <button
              onClick={handleRestart}
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              처음으로 돌아가기
            </button>
          </div>
        </div>
      </header>

      {/* 진행 단계 표시 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {currentStep !== 'region' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">이전</span>
              </button>
            )}
            <div className="flex items-center justify-center gap-4 flex-1">
              <div className={`flex items-center gap-2 ${currentStep === 'region' ? 'text-primary' : 'text-green-600'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'region' ? 'bg-primary text-white' : 'bg-green-600 text-white'}`}>
                  {currentStep === 'region' ? '1' : '✓'}
                </div>
                <span className="font-medium hidden sm:inline">지역</span>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-400" />

              <div className={`flex items-center gap-2 ${currentStep === 'template' ? 'text-primary' : (currentStep === 'options' || currentStep === 'generating' || currentStep === 'download') ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'template' ? 'bg-primary text-white' : (currentStep === 'options' || currentStep === 'generating' || currentStep === 'download') ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep === 'template' ? '2' : (currentStep === 'options' || currentStep === 'generating' || currentStep === 'download') ? '✓' : '2'}
                </div>
                <span className="font-medium hidden sm:inline">템플릿</span>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-400" />

              <div className={`flex items-center gap-2 ${currentStep === 'options' ? 'text-primary' : (currentStep === 'generating' || currentStep === 'download') ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'options' ? 'bg-primary text-white' : (currentStep === 'generating' || currentStep === 'download') ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep === 'options' ? '3' : (currentStep === 'generating' || currentStep === 'download') ? '✓' : '3'}
                </div>
                <span className="font-medium hidden sm:inline">옵션</span>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-400" />

              <div className={`flex items-center gap-2 ${currentStep === 'generating' ? 'text-primary' : currentStep === 'download' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'generating' ? 'bg-primary text-white' : currentStep === 'download' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep === 'generating' ? '4' : currentStep === 'download' ? '✓' : '4'}
                </div>
                <span className="font-medium hidden sm:inline">생성</span>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-400" />

              <div className={`flex items-center gap-2 ${currentStep === 'download' ? 'text-primary' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep === 'download' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                  5
                </div>
                <span className="font-medium hidden sm:inline">완료</span>
              </div>
            </div>
            {currentStep !== 'region' && <div className="w-16" />}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-6 py-8">
        {/* 1단계: 지역 선택 */}
        {currentStep === 'region' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                지역을 선택해주세요
              </h2>
              <p className="text-gray-600">
                검색하거나 필터를 사용하여 지역을 선택하세요.
              </p>
            </div>

            {isLoadingRegions ? (
              <Loading size="lg" className="py-12" />
            ) : (
              <EnhancedRegionSelector
                regions={regions}
                onSelect={handleSelectRegion}
              />
            )}
          </div>
        )}

        {/* 2단계: 템플릿 선택 */}
        {currentStep === 'template' && selectedRegion && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                템플릿 선택
              </h2>
              <p className="text-gray-600">
                사용할 PPT 템플릿을 선택하세요.
              </p>
            </div>

            {/* 선택된 지역 정보 */}
            <div className="mb-8 p-6 bg-white border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedRegion.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedRegion.province} {selectedRegion.district}
                  </p>
                </div>
              </div>
            </div>

            {/* 템플릿 선택 */}
            <div className="mb-8 p-6 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">템플릿 선택</h3>
              {isLoadingTemplates ? (
                <Loading size="md" className="py-8" />
              ) : templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>사용 가능한 템플릿이 없습니다.</p>
                  <p className="text-sm mt-2">관리자에게 문의하세요.</p>
                </div>
              ) : (
                <TemplateSelector
                  templates={templates}
                  selectedTemplateId={selectedTemplate?.id || null}
                  onSelect={handleSelectTemplate}
                />
              )}
            </div>

            {/* 버튼 영역 */}
            {selectedTemplate && !isLoadingTemplates && (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setCurrentStep('region')}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전 단계로
                </button>
                <button
                  onClick={handleConfirmTemplate}
                  className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold flex items-center gap-2"
                >
                  다음 단계로
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3단계: 생성 옵션 */}
        {currentStep === 'options' && selectedRegion && selectedTemplate && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                생성 옵션 설정
              </h2>
              <p className="text-gray-600">
                PPT 생성에 필요한 옵션을 입력하세요.
              </p>
            </div>

            {/* 선택 요약 */}
            <div className="mb-8 p-6 bg-white border rounded-lg space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedRegion.name}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedRegion.province} {selectedRegion.district}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.title}</h3>
                  <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                </div>
              </div>
            </div>

            {/* 생성 옵션 폼 */}
            <GenerationOptionsForm
              onSubmit={handleSubmitOptions}
              onCancel={() => setCurrentStep('template')}
              templateSlidesCount={selectedTemplate.slides_count}
            />
          </div>
        )}

        {/* 4단계: PPT 생성 중 */}
        {currentStep === 'generating' && generationProgress && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                PPT 자료 생성 중
              </h2>
              <p className="text-gray-600">
                잠시만 기다려주세요. 생성이 완료되면 자동으로 다운로드 페이지로 이동합니다.
              </p>
            </div>

            {/* 생성 진행 상태 */}
            <div className="mb-8">
              <GenerationProgress
                progress={generationProgress}
                onRetry={handleRetry}
                onCancel={handleCancel}
              />
            </div>

            {/* 생성 정보 */}
            {selectedRegion && selectedTemplate && generationOptions && (
              <div className="p-6 bg-white border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-900">생성 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">지역:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedRegion.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">템플릿:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedTemplate.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">이미지 스타일:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      실사 우선 (폴백: 일러스트)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">슬라이드 수:</span>
                    <span className="ml-2 font-medium text-gray-900">{generationOptions.slideCount}장</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5단계: 다운로드 */}
        {currentStep === 'download' && (
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                생성 완료!
              </h2>
              <p className="text-gray-600">
                생성된 PPT 수업자료를 다운로드하거나 최근 생성 목록을 확인하세요.
              </p>
            </div>

            {/* 방금 생성된 파일 (강조) */}
            {selectedRegion && selectedTemplate && (
              <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>

                    <div className="flex-1">
                      <div className="inline-block px-2 py-1 bg-green-200 text-green-800 text-xs font-semibold rounded mb-2">
                        방금 생성됨
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {selectedRegion.name} - {selectedTemplate.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date().toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadUrl && handleDownload(downloadUrl)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    <span>다운로드</span>
                  </button>
                </div>
              </div>
            )}

            {/* 최근 생성 목록 */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                최근 생성 목록
              </h3>
            </div>

            <div className="space-y-4">
              {generatedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-6 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {file.regionName} - {file.templateTitle}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{file.generatedAt}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {file.status === 'completed' && (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-green-600">생성 완료</span>
                              </>
                            )}
                            {file.status === 'processing' && (
                              <>
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                <span className="text-blue-600">생성 중</span>
                              </>
                            )}
                            {file.status === 'failed' && (
                              <>
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">생성 실패</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {file.status === 'completed' && file.downloadUrl && (
                      <button
                        onClick={() => handleDownload(file.downloadUrl!)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>다운로드</span>
                      </button>
                    )}

                    {file.status === 'processing' && (
                      <button
                        disabled
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>처리 중</span>
                      </button>
                    )}

                    {file.status === 'failed' && (
                      <button
                        onClick={() => alert('재생성 기능 (준비 중)')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        재시도
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 새로 생성하기 버튼 */}
            <div className="mt-8 text-center">
              <button
                onClick={handleRestart}
                className="px-8 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold"
              >
                새 자료 생성하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
