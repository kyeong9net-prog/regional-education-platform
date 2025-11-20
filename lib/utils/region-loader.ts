import type { Region } from '@/types';
import { dummyRegions } from '@/lib/dummy-data';

/**
 * 지역 데이터를 로드합니다.
 * 현재는 더미 데이터를 반환하지만, 추후 JSON 파일이나 API에서 로드할 수 있습니다.
 */
export const loadRegions = async (): Promise<Region[]> => {
  // 추후 public/data/regions.json에서 로드하도록 변경 가능
  // const response = await fetch('/data/regions.json');
  // return response.json();

  return Promise.resolve(dummyRegions);
};

/**
 * 특정 ID의 지역을 조회합니다.
 */
export const getRegionById = (id: string): Region | undefined => {
  return dummyRegions.find(region => region.id === id);
};

/**
 * 특정 시/도의 모든 지역을 조회합니다.
 */
export const getRegionsByProvince = (province: string): Region[] => {
  return dummyRegions.filter(region => region.province === province);
};

/**
 * 모든 시/도 목록을 반환합니다 (중복 제거).
 */
export const getAllProvinces = (): string[] => {
  const provinces = new Set(dummyRegions.map(region => region.province));
  return Array.from(provinces).sort();
};
