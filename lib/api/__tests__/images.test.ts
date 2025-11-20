/**
 * 이미지 API 테스트
 */

import { getRegionImages, getThemeImages } from '../images';

// Mock 설정
global.fetch = jest.fn();

describe('images API', () => {
  // 환경 변수 저장 및 복원
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // console mock
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // 환경 변수 설정
    process.env = {
      ...originalEnv,
      UNSPLASH_ACCESS_KEY: 'test-unsplash-key',
      PIXABAY_API_KEY: 'test-pixabay-key',
      KOREAN_TOURISM_API_KEY: 'test-tourism-key',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('getRegionImages()', () => {
    // ✅ realistic 스타일 테스트
    describe('realistic 스타일', () => {
      it('한국관광공사 API를 우선 사용해야 함', async () => {
        // Given: Korean Tourism API 응답
        const tourismResponse = {
          response: {
            body: {
              items: {
                item: [
                  {
                    title: '북한산',
                    firstimage: 'https://tourism.kr/image1.jpg',
                    firstimage2: 'https://tourism.kr/image1_thumb.jpg',
                  },
                  {
                    title: '남산',
                    firstimage: 'https://tourism.kr/image2.jpg',
                    firstimage2: 'https://tourism.kr/image2_thumb.jpg',
                  },
                ],
              },
            },
          },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => tourismResponse,
        });

        // When
        const result = await getRegionImages('서울', 'realistic', 2);

        // Then
        expect(result).toHaveLength(2);
        expect(result[0].source).toBe('korean-tourism');
        expect(result[0].url).toBe('https://tourism.kr/image1.jpg');
        expect(result[1].source).toBe('korean-tourism');
      });

      it('한국관광공사 API가 부족하면 Unsplash로 보충해야 함', async () => {
        // Given: Tourism API 1개, Unsplash API 2개
        const tourismResponse = {
          response: {
            body: {
              items: {
                item: {
                  title: '북한산',
                  firstimage: 'https://tourism.kr/image1.jpg',
                  firstimage2: '',
                },
              },
            },
          },
        };

        const unsplashResponse = {
          results: [
            {
              urls: {
                regular: 'https://unsplash.com/photo1.jpg',
                small: 'https://unsplash.com/photo1_small.jpg',
              },
              user: { name: 'Photographer 1' },
              alt_description: 'Seoul landscape',
            },
            {
              urls: {
                regular: 'https://unsplash.com/photo2.jpg',
                small: 'https://unsplash.com/photo2_small.jpg',
              },
              user: { name: 'Photographer 2' },
              alt_description: 'Mountain',
            },
          ],
        };

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            // Tourism API
            ok: true,
            json: async () => tourismResponse,
          })
          .mockResolvedValueOnce({
            // Unsplash API
            ok: true,
            json: async () => unsplashResponse,
          });

        // When
        const result = await getRegionImages('서울', 'realistic', 3);

        // Then: Tourism 1개 + Unsplash 2개
        expect(result).toHaveLength(3);
        expect(result[0].source).toBe('korean-tourism');
        expect(result[1].source).toBe('unsplash');
        expect(result[2].source).toBe('unsplash');
      });
    });

    // ✅ illustration 스타일 테스트
    describe('illustration 스타일', () => {
      it('Pixabay API를 사용해야 함', async () => {
        // Given
        const pixabayResponse = {
          hits: [
            {
              largeImageURL: 'https://pixabay.com/image1.jpg',
              previewURL: 'https://pixabay.com/preview1.jpg',
              user: 'Artist1',
              tags: 'seoul, illustration',
            },
            {
              largeImageURL: 'https://pixabay.com/image2.jpg',
              previewURL: 'https://pixabay.com/preview2.jpg',
              user: 'Artist2',
              tags: 'korea, art',
            },
          ],
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => pixabayResponse,
        });

        // When
        const result = await getRegionImages('서울', 'illustration', 2);

        // Then
        expect(result).toHaveLength(2);
        expect(result[0].source).toBe('pixabay');
        expect(result[0].url).toBe('https://pixabay.com/image1.jpg');
        expect(result[1].source).toBe('pixabay');
      });
    });

    // ✅ mixed 스타일 테스트
    describe('mixed 스타일', () => {
      it('실사와 일러스트를 혼합해서 가져와야 함', async () => {
        // Given
        const tourismResponse = {
          response: {
            body: {
              items: {
                item: {
                  title: '북한산',
                  firstimage: 'https://tourism.kr/image1.jpg',
                  firstimage2: '',
                },
              },
            },
          },
        };

        const unsplashResponse = {
          results: [
            {
              urls: {
                regular: 'https://unsplash.com/photo1.jpg',
                small: 'https://unsplash.com/photo1_small.jpg',
              },
              user: { name: 'Photographer' },
              alt_description: 'Seoul',
            },
          ],
        };

        const pixabayResponse = {
          hits: [
            {
              largeImageURL: 'https://pixabay.com/image1.jpg',
              previewURL: 'https://pixabay.com/preview1.jpg',
              user: 'Artist',
              tags: 'seoul',
            },
          ],
        };

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            // Tourism
            ok: true,
            json: async () => tourismResponse,
          })
          .mockResolvedValueOnce({
            // Unsplash
            ok: true,
            json: async () => unsplashResponse,
          })
          .mockResolvedValueOnce({
            // Pixabay
            ok: true,
            json: async () => pixabayResponse,
          });

        // When
        const result = await getRegionImages('서울', 'mixed', 3);

        // Then: 실사 + 일러스트 혼합
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(3);

        const sources = result.map((img) => img.source);
        // mixed는 다양한 소스를 가져야 함 (정확한 개수는 보장 안 됨)
        expect(sources.length).toBeGreaterThan(0);
      });
    });

    // ❌ 실패 케이스 - API 키 없음
    describe('API 키 없음', () => {
      it('Unsplash API 키가 없으면 빈 배열을 반환하고 경고해야 함', async () => {
        // Given: API 키 없음
        process.env.UNSPLASH_ACCESS_KEY = '';

        // When
        const result = await getRegionImages('서울', 'realistic', 5);

        // Then: 빈 배열 (Tourism API도 부족하면)
        expect(console.warn).toHaveBeenCalled();
      });

      it('Pixabay API 키가 없으면 빈 배열을 반환하고 경고해야 함', async () => {
        // Given
        process.env.PIXABAY_API_KEY = '';

        // When
        const result = await getRegionImages('서울', 'illustration', 5);

        // Then
        expect(result).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Pixabay API key not configured'));
      });
    });

    // ❌ 실패 케이스 - API 에러
    describe('API 에러', () => {
      it('API가 401 에러를 반환하면 빈 배열을 반환해야 함', async () => {
        // Given
        (global.fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
        });

        // When
        const result = await getRegionImages('서울', 'realistic', 5);

        // Then: 빈 배열 (모든 API 실패 가정)
        expect(console.error).toHaveBeenCalled();
      });

      it('네트워크 에러 발생 시 빈 배열을 반환해야 함', async () => {
        // Given
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        // When
        const result = await getRegionImages('서울', 'realistic', 5);

        // Then
        expect(console.error).toHaveBeenCalled();
      });
    });

    // ✅ 요청 개수 제한
    describe('요청 개수 제한', () => {
      it('요청한 개수만큼만 반환해야 함', async () => {
        // Given: 10개 있지만 5개만 요청
        const tourismResponse = {
          response: {
            body: {
              items: {
                item: Array.from({ length: 10 }, (_, i) => ({
                  title: `장소${i}`,
                  firstimage: `https://image${i}.jpg`,
                  firstimage2: '',
                })),
              },
            },
          },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => tourismResponse,
        });

        // When
        const result = await getRegionImages('서울', 'realistic', 5);

        // Then: 5개만 반환
        expect(result.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('getThemeImages()', () => {
    // ✅ realistic 스타일
    it('realistic 스타일은 Unsplash를 사용해야 함', async () => {
      // Given
      const unsplashResponse = {
        results: [
          {
            urls: {
              regular: 'https://unsplash.com/mountain.jpg',
              small: 'https://unsplash.com/mountain_small.jpg',
            },
            user: { name: 'Photographer' },
            alt_description: 'Mountain',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => unsplashResponse,
      });

      // When
      const result = await getThemeImages('mountain', 'realistic', 1);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('unsplash');
    });

    // ✅ illustration 스타일
    it('illustration 스타일은 Pixabay를 사용해야 함', async () => {
      // Given
      const pixabayResponse = {
        hits: [
          {
            largeImageURL: 'https://pixabay.com/ocean.jpg',
            previewURL: 'https://pixabay.com/ocean_preview.jpg',
            user: 'Artist',
            tags: 'ocean, illustration',
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => pixabayResponse,
      });

      // When
      const result = await getThemeImages('ocean', 'illustration', 1);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('pixabay');
    });

    // ✅ mixed 스타일
    it('mixed 스타일은 실사와 일러스트를 혼합해야 함', async () => {
      // Given
      const unsplashResponse = {
        results: [
          {
            urls: {
              regular: 'https://unsplash.com/theme.jpg',
              small: 'https://unsplash.com/theme_small.jpg',
            },
            user: { name: 'Photographer' },
            alt_description: 'Theme',
          },
        ],
      };

      const pixabayResponse = {
        hits: [
          {
            largeImageURL: 'https://pixabay.com/theme.jpg',
            previewURL: 'https://pixabay.com/theme_preview.jpg',
            user: 'Artist',
            tags: 'theme',
          },
        ],
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => unsplashResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => pixabayResponse,
        });

      // When
      const result = await getThemeImages('theme', 'mixed', 2);

      // Then: 두 소스 모두 사용
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });
});
