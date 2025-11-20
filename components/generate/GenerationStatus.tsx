'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

interface GenerationStatusProps {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  regionName?: string;
}

export default function GenerationStatus({ status, regionName }: GenerationStatusProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div className="mt-6 p-6 rounded-lg border">
      {status === 'processing' && (
        <div className="flex items-center gap-4 text-blue-600">
          <Loader2 className="w-8 h-8 animate-spin" />
          <div>
            <p className="font-semibold">생성 중입니다...</p>
            <p className="text-sm text-gray-600">
              {regionName} 지역 정보를 수집하고 템플릿에 적용하고 있습니다.
            </p>
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-4 text-green-600">
          <CheckCircle2 className="w-8 h-8" />
          <div>
            <p className="font-semibold">생성 완료!</p>
            <p className="text-sm text-gray-600">
              수업자료가 성공적으로 생성되었습니다. 다운로드 페이지로 이동하세요.
            </p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex items-center gap-4 text-red-600">
          <XCircle className="w-8 h-8" />
          <div>
            <p className="font-semibold">생성 실패</p>
            <p className="text-sm text-gray-600">
              오류가 발생했습니다. 다시 시도해주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
