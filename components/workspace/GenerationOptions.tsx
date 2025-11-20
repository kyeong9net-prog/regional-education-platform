import { useState } from 'react';
import { Info } from 'lucide-react';
import type { GenerationOptions } from '@/types';

interface GenerationOptionsProps {
  onSubmit: (options: GenerationOptions) => void;
  onCancel: () => void;
  templateSlidesCount?: number;
}

export default function GenerationOptionsForm({
  onSubmit,
  onCancel,
  templateSlidesCount,
}: GenerationOptionsProps) {
  // 사진 스타일은 자동으로 실사 우선 (실패 시 일러스트)
  const [options, setOptions] = useState<GenerationOptions>({
    photoStyle: 'realistic', // 실사를 기본값으로 (서버에서 실패 시 일러스트로 폴백)
    slideCount: templateSlidesCount || 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(options);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white border-2 border-gray-200 rounded-lg space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">생성 옵션 설정</h3>

      {/* 자동 설정 안내 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 space-y-2">
            <p className="font-semibold">자동 설정됩니다</p>
            <ul className="space-y-1 text-blue-800">
              <li>• <strong>이미지 스타일:</strong> 실사 사진 우선 (한국관광공사 + Unsplash)</li>
              <li>• <strong>찾을 수 없는 경우:</strong> 실사 이미지를 찾을 수 없는 경우 자동으로 일러스트 사용 (Pixabay)</li>
              <li>• <strong>슬라이드 수:</strong> {options.slideCount}장 (템플릿 기본값)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 생성 안내 */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="text-sm font-semibold text-green-900 mb-2">생성 프로세스</h4>
        <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
          <li>선택한 지역의 데이터를 수집합니다</li>
          <li>실사 이미지를 우선 검색합니다 (관광공사 API, Unsplash)</li>
          <li>실사 이미지가 없으면 일러스트를 사용합니다 (Pixabay)</li>
          <li>템플릿에 데이터를 삽입하여 PPT를 생성합니다</li>
        </ol>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          이전 단계로
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          PPT 생성하기
        </button>
      </div>
    </form>
  );
}
