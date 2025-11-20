import { CheckCircle, Loader2, XCircle, Clock } from 'lucide-react';
import type { GenerationProgress as GenerationProgressType } from '@/types';

interface GenerationProgressProps {
  progress: GenerationProgressType;
  onRetry?: () => void;
  onCancel?: () => void;
}

export default function GenerationProgress({
  progress,
  onRetry,
  onCancel,
}: GenerationProgressProps) {
  const { status, progress: percentage, currentStep, estimatedTimeRemaining } = progress;

  // 상태별 색상 및 아이콘
  const getStatusConfig = () => {
    switch (status) {
      case 'preparing':
      case 'generating':
        return {
          color: 'blue',
          icon: <Loader2 className="w-6 h-6 animate-spin" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          progressColor: 'bg-blue-600',
        };
      case 'completed':
        return {
          color: 'green',
          icon: <CheckCircle className="w-6 h-6" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          progressColor: 'bg-green-600',
        };
      case 'failed':
        return {
          color: 'red',
          icon: <XCircle className="w-6 h-6" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          progressColor: 'bg-red-600',
        };
      default:
        return {
          color: 'gray',
          icon: <Clock className="w-6 h-6" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          progressColor: 'bg-gray-600',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`p-6 border-2 ${config.borderColor} ${config.bgColor} rounded-lg`}>
      <div className="flex items-start gap-4">
        {/* 상태 아이콘 */}
        <div className={config.textColor}>{config.icon}</div>

        <div className="flex-1">
          {/* 현재 단계 */}
          <h3 className={`text-lg font-semibold ${config.textColor} mb-2`}>
            {currentStep || '대기 중...'}
          </h3>

          {/* 진행률 바 */}
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${config.progressColor} transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-sm font-medium ${config.textColor}`}>
                {percentage}%
              </span>
              {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
                <span className="text-sm text-gray-600">
                  약 {estimatedTimeRemaining}초 남음
                </span>
              )}
            </div>
          </div>

          {/* 상태별 메시지 */}
          {status === 'completed' && (
            <p className="text-sm text-green-700">
              PPT 생성이 완료되었습니다. 다운로드 버튼을 클릭하여 파일을 저장하세요.
            </p>
          )}

          {status === 'failed' && (
            <div className="space-y-2">
              <p className="text-sm text-red-700">
                PPT 생성에 실패했습니다. 다시 시도해주세요.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  다시 시도
                </button>
              )}
            </div>
          )}

          {(status === 'preparing' || status === 'generating') && onCancel && (
            <button
              onClick={onCancel}
              className="mt-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
