/**
 * Dynamic Tourism API 테스트
 *
 * 주요 테스트 대상:
 * 1. fetchTourismDataByCategories() - 카테고리별 Tourism 데이터 가져오기
 * 2. isAppropriateForElementaryStudents() - 부적절한 장소 필터링 (간접 테스트)
 * 3. fetchTourismData() - Tourism API 호출 (간접 테스트)
 */

import { fetchTourismDataByCategories, type TourismDataByCategory } from '../dynamic-tourism-api';
import { type CategoryRequirement } from '../category-mapping';
import * as koreaAreaCodes from '../korea-area-codes';

// Mock 설정
global.fetch = jest.fn();

// Mock findAreaCode
jest.mock('../korea-area-codes', () => ({
  ...jest.requireActual('../korea-area-codes'),
  findAreaCode: jest.fn(),
}));

describe('dynamic-tourism-api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // console.log, console.warn, console.error mock
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchTourismDataByCategories()', () => {
    const mockApiKey = 'test-api-key';

    // Mock Tourism API 응답 생성 헬퍼
    const createMockTourismResponse = (items: any[]) => ({
      response: {
        body: {
          items: {
            item: items,
          },
        },
      },
    });

    // ✅ 성공 케이스 - API 정상 응답
    describe('API 정상 응답', () => {
      it('Tourism API가 정상 응답하면 데이터를 반환해야 함', async () => {
        // Given: 서울 지역 코드와 NATURAL_SITE 카테고리 요청
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
          sigunguCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '북한산국립공원',
            addr1: '서울특별시 강북구',
            firstimage: 'https://example.com/bukhansan.jpg',
            firstimage2: 'https://example.com/bukhansan_thumb.jpg',
            contenttypeid: '12',
            readcount: '50000',
          },
          {
            title: '국립중앙박물관',
            addr1: '서울특별시 용산구',
            firstimage: 'https://example.com/museum.jpg',
            firstimage2: '',
            contenttypeid: '14',
            readcount: '80000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 2,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        // When: Tourism 데이터 가져오기
        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // Then: 데이터가 올바르게 반환되어야 함
        expect(result).toHaveProperty('NATURAL_SITE');
        expect(result.NATURAL_SITE).toHaveLength(2);
        expect(result.NATURAL_SITE[0].name).toBe('국립중앙박물관'); // 조회수 높은 순
        expect(result.NATURAL_SITE[1].name).toBe('북한산국립공원');
      });

      it('조회수 기준으로 내림차순 정렬되어야 함', async () => {
        // Given
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '장소A',
            addr1: '서울시',
            firstimage: 'imageA.jpg',
            contenttypeid: '12',
            readcount: '6000', // 5000 이상으로 변경
          },
          {
            title: '장소B',
            addr1: '서울시',
            firstimage: 'imageB.jpg',
            contenttypeid: '12',
            readcount: '50000',
          },
          {
            title: '장소C',
            addr1: '서울시',
            firstimage: 'imageC.jpg',
            contenttypeid: '12',
            readcount: '20000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 3,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        // When
        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // Then: 조회수 높은 순으로 정렬
        expect(result.NATURAL_SITE[0].readcount).toBe(50000);
        expect(result.NATURAL_SITE[1].readcount).toBe(20000);
        expect(result.NATURAL_SITE[2].readcount).toBe(6000);
      });
    });

    // ✅ 이미지 필터링 테스트
    describe('이미지 필터링', () => {
      it('이미지가 없는 장소는 제외되어야 함', async () => {
        // Given: 5개 장소 중 2개는 이미지 없음
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '이미지있음1',
            addr1: '서울시',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '10000',
          },
          {
            title: '이미지없음1',
            addr1: '서울시',
            firstimage: '',
            contenttypeid: '12',
            readcount: '15000',
          },
          {
            title: '이미지있음2',
            addr1: '서울시',
            firstimage: 'image2.jpg',
            contenttypeid: '12',
            readcount: '12000',
          },
          {
            title: '이미지없음2',
            addr1: '서울시',
            firstimage: '   ', // 공백
            contenttypeid: '12',
            readcount: '20000',
          },
          {
            title: '이미지있음3',
            addr1: '서울시',
            firstimage: 'image3.jpg',
            contenttypeid: '12',
            readcount: '8000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 5,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        // When
        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // Then: 이미지가 있는 3개만 반환
        expect(result.NATURAL_SITE).toHaveLength(3);
        expect(result.NATURAL_SITE.every((spot) => spot.image.trim() !== '')).toBe(true);
      });
    });

    // ✅ 부적절한 콘텐츠 필터링 테스트
    describe('부적절한 콘텐츠 필터링', () => {
      it('주점 키워드가 포함된 장소는 필터링되어야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '홍대주점거리',
            addr1: '서울시 마포구',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '30000',
          },
          {
            title: '북한산국립공원',
            addr1: '서울시 강북구',
            firstimage: 'image2.jpg',
            contenttypeid: '12',
            readcount: '50000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 2,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // '주점'이 필터링되어 1개만 남아야 함
        expect(result.NATURAL_SITE).toHaveLength(1);
        expect(result.NATURAL_SITE[0].name).toBe('북한산국립공원');
      });

      it('상업시설 키워드가 포함된 장소는 필터링되어야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '롯데백화점본점',
            addr1: '서울시 중구',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '40000',
          },
          {
            title: '이마트서울점',
            addr1: '서울시',
            firstimage: 'image2.jpg',
            contenttypeid: '12',
            readcount: '35000',
          },
          {
            title: '남산서울타워',
            addr1: '서울시 용산구',
            firstimage: 'image3.jpg',
            contenttypeid: '12',
            readcount: '90000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 3,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // 백화점 필터링되어 2개만 남아야 함 (이마트는 '이마트24'만 필터링되므로 '이마트서울점'은 통과)
        expect(result.NATURAL_SITE).toHaveLength(2);
        expect(result.NATURAL_SITE.map((s) => s.name).sort()).toEqual(['남산서울타워', '이마트서울점'].sort());
      });

      it('회사명 괄호가 포함된 장소는 필터링되어야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '(주)회사명쇼핑몰',
            addr1: '서울시',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '25000',
          },
          {
            title: '㈜엔터프라이즈매장',
            addr1: '서울시',
            firstimage: 'image2.jpg',
            contenttypeid: '12',
            readcount: '28000',
          },
          {
            title: '경복궁',
            addr1: '서울시 종로구',
            firstimage: 'image3.jpg',
            contenttypeid: '12',
            readcount: '100000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'HISTORICAL_SITE',
            count: 3,
            mapping: {
              contentTypeId: '12',
              pageNo: 3,
              displayName: '역사유적',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // 회사명 괄호 필터링되어 1개만 남아야 함
        expect(result.HISTORICAL_SITE).toHaveLength(1);
        expect(result.HISTORICAL_SITE[0].name).toBe('경복궁');
      });

      it('조회수 5,000 미만인 장소는 필터링되어야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '작은공원',
            addr1: '서울시',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '4999',
          },
          {
            title: '인기공원',
            addr1: '서울시',
            firstimage: 'image2.jpg',
            contenttypeid: '12',
            readcount: '5000',
          },
          {
            title: '유명공원',
            addr1: '서울시',
            firstimage: 'image3.jpg',
            contenttypeid: '12',
            readcount: '50000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 3,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // 4999는 필터링, 5000과 50000만 남아야 함
        expect(result.NATURAL_SITE).toHaveLength(2);
        expect(result.NATURAL_SITE.every((spot) => (spot.readcount || 0) >= 5000)).toBe(true);
      });
    });

    // ✅ 지역 fallback 테스트
    describe('지역 fallback (sigunguCode → areaCode)', () => {
      it('필터링 후 부족하면 상위 지역에서 추가 데이터를 가져와야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
          sigunguCode: '1',
        });

        // 1차 API 호출 (sigunguCode 포함): 1개만 반환
        const firstResponse = createMockTourismResponse([
          {
            title: '강남공원',
            addr1: '서울시 강남구',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '30000',
          },
        ]);

        // 2차 API 호출 (areaCode만): 추가 2개 반환
        const secondResponse = createMockTourismResponse([
          {
            title: '강남공원',
            addr1: '서울시 강남구',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '30000',
          },
          {
            title: '북한산',
            addr1: '서울시 강북구',
            firstimage: 'image2.jpg',
            contenttypeid: '12',
            readcount: '50000',
          },
          {
            title: '한강공원',
            addr1: '서울시',
            firstimage: 'image3.jpg',
            contenttypeid: '12',
            readcount: '40000',
          },
        ]);

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => firstResponse,
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => secondResponse,
          });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 3,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울특별시 강남구', categoryRequirements, mockApiKey);

        // 1차 1개 + 2차 2개(중복 제거) = 3개
        expect(result.NATURAL_SITE).toHaveLength(3);
        expect(result.NATURAL_SITE.map((s) => s.name)).toContain('강남공원');
        expect(result.NATURAL_SITE.map((s) => s.name)).toContain('북한산');
        expect(result.NATURAL_SITE.map((s) => s.name)).toContain('한강공원');

        // fetch가 2번 호출되었는지 확인
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });

      it('중복된 장소는 제거되어야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
          sigunguCode: '1',
        });

        const firstResponse = createMockTourismResponse([
          {
            title: '공통장소',
            addr1: '서울시',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '30000',
          },
        ]);

        const secondResponse = createMockTourismResponse([
          {
            title: '공통장소',
            addr1: '서울시',
            firstimage: 'image1.jpg',
            contenttypeid: '12',
            readcount: '30000',
          },
          {
            title: '다른장소',
            addr1: '서울시',
            firstimage: 'image2.jpg',
            contenttypeid: '12',
            readcount: '25000',
          },
        ]);

        (global.fetch as jest.Mock)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => firstResponse,
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => secondResponse,
          });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 2,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // 중복 제거되어 2개만
        expect(result.NATURAL_SITE).toHaveLength(2);
        const names = result.NATURAL_SITE.map((s) => s.name);
        expect(names).toContain('공통장소');
        expect(names).toContain('다른장소');
      });
    });

    // ❌ 실패 케이스 - 지역 코드 없음
    describe('지역 코드 없음', () => {
      it('지역 코드를 찾을 수 없으면 빈 배열을 반환해야 함', async () => {
        // Given: findAreaCode가 null 반환
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue(null);

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 2,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        // When
        const result = await fetchTourismDataByCategories('알수없는지역', categoryRequirements, mockApiKey);

        // Then: 빈 배열 반환
        expect(result.NATURAL_SITE).toEqual([]);

        // console.warn 호출 확인
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('지역 코드를 찾을 수 없음: 알수없는지역')
        );
      });
    });

    // ❌ 실패 케이스 - API 에러
    describe('API 에러', () => {
      it('API 호출 실패 시 빈 배열을 반환해야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        // fetch reject (네트워크 에러)
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 2,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // 빈 배열 반환
        expect(result.NATURAL_SITE).toEqual([]);

        // console.error 호출 확인
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('NATURAL_SITE 데이터 가져오기 실패'),
          expect.any(Error)
        );
      });

      it('API 응답에 items가 없으면 빈 배열을 반환해야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const emptyResponse = {
          response: {
            body: {
              items: null,
            },
          },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => emptyResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 2,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // Fallback도 실패하면 빈 배열
        expect(result.NATURAL_SITE).toEqual([]);
      });
    });

    // ✅ 단일 객체 vs 배열 처리
    describe('단일 객체 vs 배열 처리', () => {
      it('API가 단일 객체를 반환하면 배열로 변환해야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        // item이 배열이 아닌 단일 객체
        const singleItemResponse = {
          response: {
            body: {
              items: {
                item: {
                  title: '단일장소',
                  addr1: '서울시',
                  firstimage: 'image1.jpg',
                  contenttypeid: '12',
                  readcount: '30000',
                },
              },
            },
          },
        };

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => singleItemResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 1,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // 단일 객체도 배열로 처리되어야 함
        expect(result.NATURAL_SITE).toHaveLength(1);
        expect(result.NATURAL_SITE[0].name).toBe('단일장소');
      });
    });

    // ✅ firstimage vs firstimage2 fallback
    describe('firstimage vs firstimage2 fallback', () => {
      it('firstimage가 없으면 firstimage2를 사용해야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '장소1',
            addr1: '서울시',
            firstimage: '',
            firstimage2: 'image2.jpg',
            contenttypeid: '12',
            readcount: '30000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 1,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // firstimage2가 사용되었는지 확인
        expect(result.NATURAL_SITE).toHaveLength(1);
        expect(result.NATURAL_SITE[0].image).toBe('image2.jpg');
      });

      it('firstimage와 firstimage2 둘 다 없으면 필터링되어야 함', async () => {
        (koreaAreaCodes.findAreaCode as jest.Mock).mockReturnValue({
          areaCode: '1',
        });

        const mockResponse = createMockTourismResponse([
          {
            title: '이미지없음',
            addr1: '서울시',
            firstimage: '',
            firstimage2: '',
            contenttypeid: '12',
            readcount: '30000',
          },
          {
            title: '이미지있음',
            addr1: '서울시',
            firstimage: 'image.jpg',
            firstimage2: '',
            contenttypeid: '12',
            readcount: '25000',
          },
        ]);

        (global.fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        });

        const categoryRequirements: CategoryRequirement[] = [
          {
            category: 'NATURAL_SITE',
            count: 2,
            mapping: {
              contentTypeId: '12',
              pageNo: 1,
              displayName: '자연명소',
            },
          },
        ];

        const result = await fetchTourismDataByCategories('서울', categoryRequirements, mockApiKey);

        // 이미지가 없는 장소는 필터링
        expect(result.NATURAL_SITE).toHaveLength(1);
        expect(result.NATURAL_SITE[0].name).toBe('이미지있음');
      });
    });
  });
});
