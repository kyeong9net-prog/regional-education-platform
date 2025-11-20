import type { GenerationOptions, GenerationProgress } from '@/types';

/**
 * PPT 생성 API
 * 실제 서버 API를 호출하여 PPT를 생성합니다.
 */

/**
 * PPT 생성 요청 API
 */
export async function generatePPT(
  regionName: string,
  templateId: string,
  options: GenerationOptions
): Promise<{ jobId: string; fileUrl?: string; fileName?: string }> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      regionName,
      templateId,
      options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'PPT 생성에 실패했습니다.');
  }

  const data = await response.json();
  return {
    jobId: data.jobId,
    fileUrl: data.fileUrl,
    fileName: data.fileName
  };
}

/**
 * 생성 상태 조회 API
 */
export async function getGenerationStatus(jobId: string): Promise<GenerationProgress> {
  const response = await fetch(`/api/generate?jobId=${jobId}`);

  if (!response.ok) {
    throw new Error('생성 상태 조회에 실패했습니다.');
  }

  const progress = await response.json();
  return progress;
}

/**
 * 생성 작업 취소
 */
export async function cancelGeneration(jobId: string): Promise<void> {
  // 취소 기능은 추후 구현
  throw new Error('취소 기능은 현재 지원되지 않습니다.');
}

/**
 * 생성된 파일 다운로드 URL 가져오기
 */
export async function getDownloadUrl(jobId: string): Promise<string> {
  return `/api/download?jobId=${jobId}`;
}
