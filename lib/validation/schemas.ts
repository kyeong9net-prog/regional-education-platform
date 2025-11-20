import { z } from 'zod';

/**
 * 템플릿 폼 검증 스키마
 */
export const templateFormSchema = z.object({
  title: z.string()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자 이하로 입력해주세요'),
  description: z.string()
    .min(1, '설명을 입력해주세요')
    .max(500, '설명은 500자 이하로 입력해주세요'),
  category: z.string()
    .min(1, '카테고리를 선택해주세요'),
  slides: z.number()
    .min(1, '슬라이드 수는 1 이상이어야 합니다')
    .max(100, '슬라이드 수는 100 이하여야 합니다'),
  fileSize: z.number()
    .min(0, '파일 크기는 0 이상이어야 합니다')
    .optional(),
  tags: z.array(z.string()).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;

/**
 * 파일 업로드 검증 스키마
 */
export const fileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: '파일 크기는 50MB 이하여야 합니다',
    })
    .refine(
      (file) => {
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-powerpoint',
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message: 'PPTX 파일만 업로드 가능합니다',
      }
    ),
});

export type FileUploadData = z.infer<typeof fileUploadSchema>;

/**
 * 지역 검색 검증 스키마
 */
export const regionSearchSchema = z.object({
  query: z.string()
    .max(100, '검색어는 100자 이하로 입력해주세요')
    .optional(),
  province: z.string().optional(),
  district: z.string().optional(),
});

export type RegionSearchData = z.infer<typeof regionSearchSchema>;

/**
 * PPT 생성 옵션 검증 스키마
 */
export const generateOptionsSchema = z.object({
  regionId: z.string()
    .min(1, '지역을 선택해주세요'),
  templateId: z.string()
    .min(1, '템플릿을 선택해주세요'),
  schoolName: z.string()
    .max(100, '학교명은 100자 이하로 입력해주세요')
    .optional(), // 사용자 입력 불필요, 기본값: "수업자료"
  photoStyle: z.enum(['public', 'ai'])
    .optional(), // 자동 설정: 실사 우선 → 일러스트 폴백
  slideCount: z.number()
    .min(1, '슬라이드 수는 1 이상이어야 합니다')
    .max(100, '슬라이드 수는 100 이하여야 합니다')
    .optional(),
});

export type GenerateOptionsData = z.infer<typeof generateOptionsSchema>;

/**
 * 관리자 통계 필터 검증 스키마
 */
export const statsFilterSchema = z.object({
  period: z.enum(['7days', '30days', '90days', 'all']).optional(),
  regionId: z.string().optional(),
  templateId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type StatsFilterData = z.infer<typeof statsFilterSchema>;

/**
 * 파일 이름 변경 검증 스키마
 */
export const fileRenameSchema = z.object({
  fileId: z.string()
    .min(1, '파일 ID가 필요합니다'),
  newName: z.string()
    .min(1, '파일명을 입력해주세요')
    .max(100, '파일명은 100자 이하로 입력해주세요')
    .regex(/^[a-zA-Z0-9가-힣\s\-_]+$/, '파일명에 특수문자를 사용할 수 없습니다'),
});

export type FileRenameData = z.infer<typeof fileRenameSchema>;
