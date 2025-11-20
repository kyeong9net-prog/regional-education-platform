import type { GeneratedFile } from '@/types';

/**
 * 파일 관리 API 모킹
 * Phase 5: 파일 목록 조회, 삭제, 이름 변경, 재생성 API 시뮬레이션
 */

/**
 * 파일 목록 조회 API (모킹)
 */
export async function getFiles(): Promise<GeneratedFile[]> {
  // 실제 구현 시 API 호출
  // 현재는 더미 데이터 반환 (별도 import 필요 시)
  await delay(300);
  return [];
}

/**
 * 파일 삭제 API (모킹)
 */
export async function deleteFile(fileId: string): Promise<void> {
  await delay(500);
  console.log(`File deleted: ${fileId}`);
}

/**
 * 여러 파일 일괄 삭제 API (모킹)
 */
export async function deleteFiles(fileIds: string[]): Promise<void> {
  await delay(800);
  console.log(`Files deleted: ${fileIds.join(', ')}`);
}

/**
 * 파일 이름 변경 API (모킹)
 */
export async function renameFile(fileId: string, newName: string): Promise<void> {
  await delay(500);
  console.log(`File renamed: ${fileId} -> ${newName}`);
}

/**
 * 파일 재생성 API (모킹)
 */
export async function regenerateFile(fileId: string): Promise<{ jobId: string }> {
  await delay(500);
  const jobId = `regen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`File regeneration started: ${fileId} -> ${jobId}`);
  return { jobId };
}

/**
 * 파일 다운로드 시뮬레이션
 * 실제로는 브라우저 다운로드를 트리거해야 함
 */
export async function downloadFile(fileUrl: string, fileName: string): Promise<void> {
  // 다운로드 진행 시뮬레이션
  await simulateDownload(fileUrl, fileName);
}

/**
 * 다운로드 진행률 시뮬레이션
 */
async function simulateDownload(fileUrl: string, fileName: string): Promise<void> {
  // 실제 구현에서는 fetch + blob 사용
  // 현재는 시뮬레이션만
  const totalSize = 5 * 1024 * 1024; // 5MB 가정
  const chunkSize = 512 * 1024; // 512KB chunks
  let downloaded = 0;

  while (downloaded < totalSize) {
    await delay(200);
    downloaded += chunkSize;
    const progress = Math.min((downloaded / totalSize) * 100, 100);
    console.log(`Download progress: ${progress.toFixed(0)}%`);
  }

  console.log(`Download completed: ${fileName} from ${fileUrl}`);

  // 실제 구현 시:
  // const link = document.createElement('a');
  // link.href = fileUrl;
  // link.download = fileName;
  // link.click();
}

/**
 * 딜레이 유틸리티 함수
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
