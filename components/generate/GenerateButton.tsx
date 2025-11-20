'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  regionName: string;
  onGenerate: () => void;
}

export default function GenerateButton({ regionName, onGenerate }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleClick = async () => {
    setIsGenerating(true);
    // 실제 구현 시: API 호출
    onGenerate();

    // 더미: 2초 후 완료
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isGenerating}
      className="w-full flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{regionName} 수업자료 생성 중...</span>
        </>
      ) : (
        <>
          <FileText className="w-6 h-6" />
          <span>PPT 자료 생성하기</span>
        </>
      )}
    </button>
  );
}
