/**
 * Zod 검증 스키마 테스트
 */

import {
  templateFormSchema,
  fileUploadSchema,
  regionSearchSchema,
  generateOptionsSchema,
  statsFilterSchema,
  fileRenameSchema,
} from '../schemas';

describe('validation schemas', () => {
  describe('templateFormSchema', () => {
    // ✅ 성공 케이스
    describe('올바른 데이터', () => {
      it('모든 필수 필드가 올바르면 통과해야 함', () => {
        const validData = {
          title: '템플릿 제목',
          description: '템플릿 설명',
          category: '역사',
          slides: 10,
        };

        const result = templateFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('선택 필드를 포함해도 통과해야 함', () => {
        const validData = {
          title: '템플릿 제목',
          description: '템플릿 설명',
          category: '역사',
          slides: 10,
          fileSize: 5000000,
          tags: ['태그1', '태그2'],
          variables: ['변수1', '변수2'],
          isActive: true,
        };

        const result = templateFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    // ❌ 실패 케이스
    describe('필수 필드 누락', () => {
      it('제목이 비어있으면 실패해야 함', () => {
        const invalidData = {
          title: '',
          description: '설명',
          category: '역사',
          slides: 10,
        };

        const result = templateFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('제목을 입력해주세요');
        }
      });

      it('설명이 비어있으면 실패해야 함', () => {
        const invalidData = {
          title: '제목',
          description: '',
          category: '역사',
          slides: 10,
        };

        const result = templateFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('설명을 입력해주세요');
        }
      });
    });

    describe('길이 제한', () => {
      it('제목이 100자를 초과하면 실패해야 함', () => {
        const invalidData = {
          title: 'a'.repeat(101),
          description: '설명',
          category: '역사',
          slides: 10,
        };

        const result = templateFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('제목은 100자 이하로 입력해주세요');
        }
      });

      it('설명이 500자를 초과하면 실패해야 함', () => {
        const invalidData = {
          title: '제목',
          description: 'a'.repeat(501),
          category: '역사',
          slides: 10,
        };

        const result = templateFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('설명은 500자 이하로 입력해주세요');
        }
      });
    });

    describe('슬라이드 수 범위', () => {
      it('슬라이드 수가 0 이하면 실패해야 함', () => {
        const invalidData = {
          title: '제목',
          description: '설명',
          category: '역사',
          slides: 0,
        };

        const result = templateFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('슬라이드 수는 1 이상이어야 합니다');
        }
      });

      it('슬라이드 수가 100을 초과하면 실패해야 함', () => {
        const invalidData = {
          title: '제목',
          description: '설명',
          category: '역사',
          slides: 101,
        };

        const result = templateFormSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('슬라이드 수는 100 이하여야 합니다');
        }
      });

      it('슬라이드 수가 1이면 통과해야 함 (경계값)', () => {
        const validData = {
          title: '제목',
          description: '설명',
          category: '역사',
          slides: 1,
        };

        const result = templateFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('슬라이드 수가 100이면 통과해야 함 (경계값)', () => {
        const validData = {
          title: '제목',
          description: '설명',
          category: '역사',
          slides: 100,
        };

        const result = templateFormSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('fileUploadSchema', () => {
    // ✅ 성공 케이스
    describe('올바른 PPTX 파일', () => {
      it('올바른 PPTX 파일이면 통과해야 함', () => {
        const validFile = new File(['content'], 'test.pptx', {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        });

        const result = fileUploadSchema.safeParse({ file: validFile });
        expect(result.success).toBe(true);
      });

      it('구형 PPT 형식도 허용해야 함', () => {
        const validFile = new File(['content'], 'test.ppt', {
          type: 'application/vnd.ms-powerpoint',
        });

        const result = fileUploadSchema.safeParse({ file: validFile });
        expect(result.success).toBe(true);
      });
    });

    // ❌ 실패 케이스
    describe('파일 크기 초과', () => {
      it('50MB를 초과하면 실패해야 함', () => {
        // 51MB 파일 생성
        const largeFile = new File([new ArrayBuffer(51 * 1024 * 1024)], 'large.pptx', {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        });

        const result = fileUploadSchema.safeParse({ file: largeFile });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('파일 크기는 50MB 이하여야 합니다');
        }
      });
    });

    describe('잘못된 파일 타입', () => {
      it('PDF 파일은 실패해야 함', () => {
        const pdfFile = new File(['content'], 'test.pdf', {
          type: 'application/pdf',
        });

        const result = fileUploadSchema.safeParse({ file: pdfFile });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('PPTX 파일만 업로드 가능합니다');
        }
      });

      it('이미지 파일은 실패해야 함', () => {
        const imageFile = new File(['content'], 'test.jpg', {
          type: 'image/jpeg',
        });

        const result = fileUploadSchema.safeParse({ file: imageFile });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('PPTX 파일만 업로드 가능합니다');
        }
      });
    });
  });

  describe('regionSearchSchema', () => {
    it('모든 필드가 선택사항이므로 빈 객체도 통과해야 함', () => {
      const result = regionSearchSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('query가 100자를 초과하면 실패해야 함', () => {
      const result = regionSearchSchema.safeParse({
        query: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('검색어는 100자 이하로 입력해주세요');
      }
    });

    it('올바른 검색 데이터는 통과해야 함', () => {
      const result = regionSearchSchema.safeParse({
        query: '서울',
        province: '서울특별시',
        district: '강남구',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('generateOptionsSchema', () => {
    // ✅ 성공 케이스
    it('필수 필드만 있어도 통과해야 함', () => {
      const result = generateOptionsSchema.safeParse({
        regionId: 'region123',
        templateId: 'template456',
      });
      expect(result.success).toBe(true);
    });

    it('모든 필드가 올바르면 통과해야 함', () => {
      const result = generateOptionsSchema.safeParse({
        regionId: 'region123',
        templateId: 'template456',
        schoolName: '테스트초등학교',
        photoStyle: 'public',
        slideCount: 15,
      });
      expect(result.success).toBe(true);
    });

    // ❌ 실패 케이스
    it('regionId가 비어있으면 실패해야 함', () => {
      const result = generateOptionsSchema.safeParse({
        regionId: '',
        templateId: 'template456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('지역을 선택해주세요');
      }
    });

    it('templateId가 비어있으면 실패해야 함', () => {
      const result = generateOptionsSchema.safeParse({
        regionId: 'region123',
        templateId: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('템플릿을 선택해주세요');
      }
    });

    it('photoStyle이 잘못된 값이면 실패해야 함', () => {
      const result = generateOptionsSchema.safeParse({
        regionId: 'region123',
        templateId: 'template456',
        photoStyle: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('slideCount가 범위를 벗어나면 실패해야 함', () => {
      const result = generateOptionsSchema.safeParse({
        regionId: 'region123',
        templateId: 'template456',
        slideCount: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('statsFilterSchema', () => {
    it('모든 필드가 선택사항이므로 빈 객체도 통과해야 함', () => {
      const result = statsFilterSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('period가 enum 값이면 통과해야 함', () => {
      const result = statsFilterSchema.safeParse({
        period: '7days',
      });
      expect(result.success).toBe(true);
    });

    it('period가 잘못된 값이면 실패해야 함', () => {
      const result = statsFilterSchema.safeParse({
        period: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('올바른 필터 데이터는 통과해야 함', () => {
      const result = statsFilterSchema.safeParse({
        period: '30days',
        regionId: 'region123',
        templateId: 'template456',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('fileRenameSchema', () => {
    // ✅ 성공 케이스
    it('올바른 파일명은 통과해야 함', () => {
      const result = fileRenameSchema.safeParse({
        fileId: 'file123',
        newName: '새파일명',
      });
      expect(result.success).toBe(true);
    });

    it('한글, 영문, 숫자, 하이픈, 언더스코어는 허용해야 함', () => {
      const result = fileRenameSchema.safeParse({
        fileId: 'file123',
        newName: '파일명-File_Name-123',
      });
      expect(result.success).toBe(true);
    });

    // ❌ 실패 케이스
    it('fileId가 비어있으면 실패해야 함', () => {
      const result = fileRenameSchema.safeParse({
        fileId: '',
        newName: '파일명',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('파일 ID가 필요합니다');
      }
    });

    it('newName이 비어있으면 실패해야 함', () => {
      const result = fileRenameSchema.safeParse({
        fileId: 'file123',
        newName: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('파일명을 입력해주세요');
      }
    });

    it('특수문자가 포함되면 실패해야 함', () => {
      const result = fileRenameSchema.safeParse({
        fileId: 'file123',
        newName: '파일*명',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('파일명에 특수문자를 사용할 수 없습니다');
      }
    });

    it('100자를 초과하면 실패해야 함', () => {
      const result = fileRenameSchema.safeParse({
        fileId: 'file123',
        newName: 'a'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('파일명은 100자 이하로 입력해주세요');
      }
    });
  });
});
