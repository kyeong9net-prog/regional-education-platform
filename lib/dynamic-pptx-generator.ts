/**
 * 동적 PPTX 생성 엔진
 * 템플릿 메타데이터를 기반으로 자동으로 placeholder를 교체합니다.
 */

import PizZip from 'pizzip';
import { analyzeCategoryRequirements, TemplatePlaceholder } from './category-mapping';
import { fetchTourismDataByCategories, TourismDataByCategory } from './dynamic-tourism-api';

export interface TemplateMetadata {
  templateId: string;
  templateTitle: string;
  templateFilePath: string;
  placeholders: TemplatePlaceholder[];
}

export interface GenerationContext {
  region: string;
  tourismData: TourismDataByCategory;
  imageUrls: { [placeholder: string]: string }; // placeholder → 다운로드된 이미지 URL
}

/**
 * 템플릿 메타데이터를 로드하거나 생성
 */
export async function loadOrGenerateTemplateMetadata(
  templateBuffer: Buffer,
  templateId: string,
  templateTitle: string,
  templateFilePath: string
): Promise<TemplateMetadata> {
  // 템플릿에서 placeholder 추출
  const zip = new PizZip(templateBuffer);
  const placeholders: TemplatePlaceholder[] = [];

  // 모든 슬라이드 파일 찾기
  const slideFiles = Object.keys(zip.files).filter(
    (fileName) => fileName.match(/^ppt\/slides\/slide\d+\.xml$/)
  );

  for (const slideFile of slideFiles) {
    const slideNumber = parseInt(slideFile.match(/slide(\d+)\.xml$/)![1]);
    const slideContent = zip.file(slideFile)?.asText();

    if (!slideContent) continue;

    // 1. 모든 <p:pic> 태그에서 descr 속성 찾기 (이미지 placeholder)
    const picRegex = /<p:pic>[\s\S]*?<\/p:pic>/g;
    const pics = slideContent.match(picRegex) || [];

    let imageIndex = 0;

    for (const pic of pics) {
      imageIndex++;

      const cNvPrMatch = pic.match(/<p:cNvPr ([^>]*)\/>/);
      if (!cNvPrMatch) continue;

      const attributes = cNvPrMatch[1];
      const descrMatch = attributes.match(/descr="([^"]*)"/);

      if (!descrMatch || !descrMatch[1].trim()) continue;

      // descr 값 정리: &#xA; (줄바꿈) 제거, 중복 제거, 첫 번째 placeholder만 사용
      let placeholder = descrMatch[1]
        .replace(/&#xA;/g, ' ')  // 줄바꿈 문자 제거
        .replace(/&#x[0-9A-F]+;/gi, ' ')  // 기타 특수문자 제거
        .trim();

      // 여러 개의 placeholder가 있으면 첫 번째만 사용
      const placeholderMatch = placeholder.match(/\{\{[A-Z_0-9]+\}\}/);
      if (placeholderMatch) {
        placeholder = placeholderMatch[0];
      }
      const idMatch = attributes.match(/id="(\d+)"/);

      // Placeholder 분석
      const placeholderInfo = analyzePlaceholder(placeholder);

      const placeholderData = {
        placeholder,
        ...placeholderInfo,
        slideNumber,
        imageId: idMatch ? idMatch[1] : undefined,
      };

      console.log(`[Template Metadata] 슬라이드 ${slideNumber}, 이미지 ${imageIndex}: placeholder="${placeholder}", type="${placeholderInfo.type}", category="${placeholderInfo.category}", index=${placeholderInfo.index}`);

      placeholders.push(placeholderData);
    }

    // 2. 텍스트에서 {{...}} placeholder 찾기
    const textPlaceholderRegex = /\{\{([A-Z_0-9]+)\}\}/g;
    let textMatch;
    while ((textMatch = textPlaceholderRegex.exec(slideContent)) !== null) {
      const placeholder = textMatch[0]; // {{...}} 형태 전체
      const placeholderInfo = analyzePlaceholder(placeholder);

      // 이미 추가된 placeholder인지 확인 (이미지 descr에서 이미 추가된 경우)
      const alreadyAdded = placeholders.some(p => p.placeholder === placeholder);
      if (alreadyAdded) continue;

      placeholders.push({
        placeholder,
        ...placeholderInfo,
        slideNumber,
        imageId: undefined,
      });
    }
  }

  return {
    templateId,
    templateTitle,
    templateFilePath,
    placeholders,
  };
}

/**
 * Placeholder 문자열 분석
 */
function analyzePlaceholder(placeholder: string): {
  type: string;
  category: string | null;
  index: number | null;
} {
  const cleaned = placeholder.replace(/^\{\{|\}\}$/g, '');

  if (!cleaned.includes('_')) {
    return {
      type: cleaned,
      category: null,
      index: null,
    };
  }

  const parts = cleaned.split('_');
  const lastPart = parts[parts.length - 1];
  const index = /^\d+$/.test(lastPart) ? parseInt(lastPart) : null;

  let type = null;
  let category = null;

  if (cleaned.includes('_IMAGE_')) {
    type = 'IMAGE';
    category = cleaned.split('_IMAGE_')[0];
  } else if (cleaned.includes('_DESC_')) {
    type = 'DESC';
    category = cleaned.split('_DESC_')[0];
  } else if (cleaned.includes('_SITE_')) {
    type = 'SITE';
    category = cleaned.split('_SITE_')[0] + '_SITE';
  } else if (cleaned.includes('_NAME_')) {
    type = 'NAME';
    category = cleaned.split('_NAME_')[0] + '_NAME';
  } else if (index !== null && parts.length >= 2) {
    // {{TRANSIT_HUB_1}}, {{MARKETPLACE_2}} 등의 패턴
    // 마지막이 숫자이고, 나머지가 카테고리명인 경우
    const categoryPart = parts.slice(0, -1).join('_');
    type = 'NAME'; // 기본적으로 장소 이름으로 처리
    category = categoryPart;
  } else {
    type = cleaned;
  }

  return {
    type,
    category,
    index,
  };
}

/**
 * Tourism 데이터 가져오기
 */
export async function fetchTourismDataForTemplate(
  region: string,
  metadata: TemplateMetadata,
  apiKey: string
): Promise<TourismDataByCategory> {
  // 카테고리 요구사항 분석
  const categoryRequirements = analyzeCategoryRequirements(metadata.placeholders);

  console.log(`[Dynamic Generator] 템플릿에 필요한 카테고리:`, categoryRequirements);

  // Tourism 데이터 가져오기
  const tourismData = await fetchTourismDataByCategories(
    region,
    categoryRequirements,
    apiKey
  );

  return tourismData;
}

/**
 * Placeholder별 이미지 다운로드 및 매핑
 */
export async function downloadImagesForPlaceholders(
  metadata: TemplateMetadata,
  tourismData: TourismDataByCategory,
  region: string,
  photoStyle: 'realistic' | 'illustration' | 'mixed'
): Promise<{ [placeholder: string]: string }> {
  const imageUrls: { [placeholder: string]: string } = {};
  const usedImageUrls = new Set<string>(); // 이미 사용한 이미지 URL 추적

  // IMAGE 타입 placeholder만 처리
  const imagePlaceholders = metadata.placeholders.filter(p => p.type === 'IMAGE');

  for (const placeholder of imagePlaceholders) {
    if (!placeholder.category || placeholder.index === null) {
      console.warn(`[Image Download] Placeholder 정보 불완전: ${placeholder.placeholder}`);
      continue;
    }

    // 해당 카테고리의 Tourism 데이터 가져오기
    const spots = tourismData[placeholder.category] || [];
    const spotIndex = placeholder.index - 1;
    const spot = spots[spotIndex];

    let imageUrl = '';
    let searchTerm = '';
    let attemptCount = 0; // 재시도 횟수

    // 카테고리별 검색 키워드 맵핑
    const categoryKeywordMap: { [key: string]: string } = {
      'NATURAL_SITE': 'nature landscape mountain forest',
      'EDU_SITE': 'museum education learning',
      'CULTURE_SITE': 'culture art gallery',
      'HISTORICAL_SITE': 'historical heritage temple',
      'HISTOIRCAL_SITE': 'historical heritage temple',
      'FESTIVAL_SITE': 'festival celebration event',
      'TRANSIT_HUB': 'train station bus terminal transport',
      'TRANSITHUB_SITE': 'train station bus terminal transport',
      'MARKETPLACE': 'traditional market bazaar street vendor',
      'RECREATIONAREA': 'park recreation leisure resort',
      'SPORTS_SITE': 'sports stadium',
      'SHOPPING_SITE': 'shopping market',
      'FOOD_SITE': 'food restaurant cuisine',
      'HOTEL_SITE': 'hotel accommodation',
      'TOUR_COURSE': 'travel route tour path journey',
    };
    const categoryKeyword = categoryKeywordMap[placeholder.category] || 'landmark';

    // Tourism 데이터가 있는 경우
    if (spot) {
      console.log(`[Image Download] ${placeholder.placeholder} → ${spot.name}`);
      searchTerm = spot.name;

      // 1. Tourism API 이미지 우선 (중복 체크 포함)
      if (spot.image && spot.image.trim() !== '') {
        // Tourism API 이미지 중복 체크
        if (!usedImageUrls.has(spot.image)) {
          imageUrl = spot.image;
          usedImageUrls.add(imageUrl);
          console.log(`[Image Download] ✓ Tourism API 이미지 사용: ${spot.name}`);
        } else {
          // 중복이면 다음 명소들을 확인
          console.warn(`[Image Download] ⚠️ Tourism 이미지 중복: ${spot.name}, 다음 명소 확인 중...`);
          const spots = tourismData[placeholder.category] || [];
          let foundAlternative = false;

          // 현재 인덱스 이후의 명소들을 확인
          // placeholder.index는 1-based이므로, spots[placeholder.index]부터 시작하면 다음 spot부터 확인
          for (let i = placeholder.index; i < spots.length; i++) {
            const alternativeSpot = spots[i];
            if (alternativeSpot.image && !usedImageUrls.has(alternativeSpot.image)) {
              imageUrl = alternativeSpot.image;
              usedImageUrls.add(imageUrl);
              searchTerm = alternativeSpot.name;
              console.log(`[Image Download] ✓ 대체 명소 이미지 사용: ${alternativeSpot.name}`);
              foundAlternative = true;
              break;
            }
          }

          if (!foundAlternative) {
            console.warn(`[Image Download] ⚠️ 대체 명소도 없음, 외부 API 검색 시작`);
          }
        }
      }
    } else {
      // Tourism 데이터가 없는 경우 - 카테고리 키워드 사용
      console.warn(`[Image Download] ${placeholder.category}[${placeholder.index}] Tourism 데이터 없음 - 대체 검색 시작`);
      searchTerm = categoryKeyword;
    }

    // 이미지가 아직 없으면 외부 API에서 검색
    if (!imageUrl) {
      // placeholder.index를 페이지 번호로 사용하여 각 이미지마다 다른 결과를 가져옴
      let pageNumber = placeholder.index || 1;

      // 중복 이미지 방지: 같은 이미지가 나오면 다음 페이지 시도
      while (attemptCount < 5) {
        const tempUrl = await tryFetchUniqueImage(
          spot,
          searchTerm,
          categoryKeyword,
          region,
          photoStyle,
          pageNumber + attemptCount,
          usedImageUrls
        );

        if (tempUrl && !usedImageUrls.has(tempUrl)) {
          imageUrl = tempUrl;
          usedImageUrls.add(tempUrl);
          break;
        }

        attemptCount++;
      }

      if (imageUrl) {
        console.log(`[Image Download] ✓ 고유 이미지 획득 (page ${pageNumber + attemptCount}): ${categoryKeyword} (${searchTerm})`);
      } else {
        console.warn(`[Image Download] ❌ 고유 이미지를 찾을 수 없음: ${searchTerm} ({{placeholder.placeholder})`);
        // 이미지를 찾지 못한 경우 카테고리별 아이콘 이미지 사용
        console.log(`[Image Download] 🎨 카테고리 아이콘 이미지 검색: ${placeholder.category}`);
        imageUrl = await fetchCategoryIconImage(placeholder.category);
        if (imageUrl) {
          console.log(`[Image Download] ✓ 카테고리 아이콘 이미지 획득: ${placeholder.category}`);
        }
      }
    }

    if (imageUrl) {
      imageUrls[placeholder.placeholder] = imageUrl;
    }
  }

  return imageUrls;
}

/**
 * 중복되지 않는 고유 이미지 가져오기
 */
async function tryFetchUniqueImage(
  spot: any,
  searchTerm: string,
  categoryKeyword: string,
  region: string,
  photoStyle: 'realistic' | 'illustration' | 'mixed',
  pageNumber: number,
  usedImageUrls: Set<string>
): Promise<string> {
  let imageUrl = '';

  // ===== 우선순위 1: 해당 장소명으로 직접 검색 (Tourism API에서 제공된 명소) =====

  // 1-1. Unsplash 검색 (장소명)
  if (spot && searchTerm !== categoryKeyword) {
    imageUrl = await fetchImageFromUnsplash(searchTerm, photoStyle, pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Priority] ✓ 명소 직접 검색 성공 (Unsplash): ${searchTerm}`);
      return imageUrl;
    }
  }

  // 1-2. Unsplash 검색 (장소명 + 지역명)
  if (spot && searchTerm !== categoryKeyword) {
    imageUrl = await fetchImageFromUnsplash(`${searchTerm} ${region}`, photoStyle, pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Priority] ✓ 명소+지역 검색 성공 (Unsplash): ${searchTerm} ${region}`);
      return imageUrl;
    }
  }

  // 1-3. Pixabay 검색 (장소명)
  if (spot && searchTerm !== categoryKeyword) {
    imageUrl = await fetchImageFromPixabay(searchTerm, photoStyle, pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Priority] ✓ 명소 직접 검색 성공 (Pixabay): ${searchTerm}`);
      return imageUrl;
    }
  }

  // 1-4. Pixabay 검색 (장소명 + 지역명)
  if (spot && searchTerm !== categoryKeyword) {
    imageUrl = await fetchImageFromPixabay(`${searchTerm} ${region}`, photoStyle, pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Priority] ✓ 명소+지역 검색 성공 (Pixabay): ${searchTerm} ${region}`);
      return imageUrl;
    }
  }

  // 1-5. 네이버 검색 (장소명)
  if (spot && searchTerm !== categoryKeyword) {
    imageUrl = await fetchImageFromNaver(searchTerm, photoStyle, pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Priority] ✓ 명소 직접 검색 성공 (Naver): ${searchTerm}`);
      return imageUrl;
    }
  }

  // 1-6. 네이버 검색 (장소명 + 지역명)
  if (spot && searchTerm !== categoryKeyword) {
    imageUrl = await fetchImageFromNaver(`${searchTerm} ${region}`, photoStyle, pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Priority] ✓ 명소+지역 검색 성공 (Naver): ${searchTerm} ${region}`);
      return imageUrl;
    }
  }

  // ===== 우선순위 2: 지역 + 카테고리 키워드로 검색 (Fallback) =====

  console.log(`[Image Priority] ⚠️ 명소명 검색 실패, 카테고리 키워드로 전환: ${region} ${categoryKeyword}`);

  // 2-1. Unsplash 검색 (지역 + 카테고리)
  imageUrl = await fetchImageFromUnsplash(`${categoryKeyword} ${region} Korea`, photoStyle, pageNumber);
  if (imageUrl && !usedImageUrls.has(imageUrl)) {
    console.log(`[Image Priority] ✓ 지역+카테고리 검색 성공 (Unsplash): ${region} ${categoryKeyword}`);
    return imageUrl;
  }

  // 2-2. Pixabay 검색 (지역 + 카테고리)
  imageUrl = await fetchImageFromPixabay(`${categoryKeyword} ${region} Korea`, photoStyle, pageNumber);
  if (imageUrl && !usedImageUrls.has(imageUrl)) {
    console.log(`[Image Priority] ✓ 지역+카테고리 검색 성공 (Pixabay): ${region} ${categoryKeyword}`);
    return imageUrl;
  }

  // 2-3. 네이버 검색 (지역 + 카테고리)
  imageUrl = await fetchImageFromNaver(`${region} ${categoryKeyword}`, photoStyle, pageNumber);
  if (imageUrl && !usedImageUrls.has(imageUrl)) {
    console.log(`[Image Priority] ✓ 지역+카테고리 검색 성공 (Naver): ${region} ${categoryKeyword}`);
    return imageUrl;
  }

  // ===== 우선순위 3: 카테고리 키워드만 사용 (최종 Fallback) =====

  console.log(`[Image Priority] ⚠️ 지역+카테고리 검색 실패, 카테고리만 검색: ${categoryKeyword}`);

  imageUrl = await fetchImageFromUnsplash(categoryKeyword, photoStyle, pageNumber);
  if (imageUrl && !usedImageUrls.has(imageUrl)) return imageUrl;

  imageUrl = await fetchImageFromPixabay(categoryKeyword, photoStyle, pageNumber);
  if (imageUrl && !usedImageUrls.has(imageUrl)) return imageUrl;

  imageUrl = await fetchImageFromNaver(categoryKeyword, photoStyle, pageNumber);
  if (imageUrl && !usedImageUrls.has(imageUrl)) return imageUrl;

  // 9. 실사 검색이 실패했을 때 일러스트로 재시도 (realistic 또는 mixed 모드인 경우)
  if (photoStyle !== 'illustration') {
    console.log(`[Image Download] ⚠️ 실사 이미지를 찾을 수 없음, 일러스트로 재검색: ${categoryKeyword}`);

    // Pixabay 일러스트 검색 (장소명)
    if (spot && searchTerm !== categoryKeyword) {
      imageUrl = await fetchImageFromPixabay(searchTerm, 'illustration', pageNumber);
      if (imageUrl && !usedImageUrls.has(imageUrl)) {
        console.log(`[Image Download] ✓ 일러스트 이미지 획득: ${searchTerm}`);
        return imageUrl;
      }
    }

    // Pixabay 일러스트 검색 (카테고리 키워드 + 지역명)
    imageUrl = await fetchImageFromPixabay(`${categoryKeyword} ${region}`, 'illustration', pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Download] ✓ 일러스트 이미지 획득: ${categoryKeyword} ${region}`);
      return imageUrl;
    }

    // Pixabay 일러스트 검색 (카테고리 키워드만)
    imageUrl = await fetchImageFromPixabay(categoryKeyword, 'illustration', pageNumber);
    if (imageUrl && !usedImageUrls.has(imageUrl)) {
      console.log(`[Image Download] ✓ 일러스트 이미지 획득: ${categoryKeyword}`);
      return imageUrl;
    }
  }

  return '';
}

/**
 * 카테고리별 아이콘 이미지 검색
 */
async function fetchCategoryIconImage(category: string): Promise<string> {
  // 카테고리별 아이콘 검색 키워드 매핑
  const iconKeywords: { [key: string]: string } = {
    NATURAL_SITE: 'nature landscape icon illustration',
    EDU_SITE: 'education school icon illustration',
    HISTORICAL_SITE: 'historical landmark icon illustration',
    MARKETPLACE: 'market shopping icon illustration',
    RECREATIONAREA: 'recreation park icon illustration',
    TRANSIT_HUB: 'transportation station icon illustration',
  };

  const keyword = iconKeywords[category] || 'location icon illustration';

  console.log(`[Category Icon] Searching for: "${keyword}"`);

  // Unsplash에서 아이콘 스타일 이미지 검색
  const imageUrl = await fetchImageFromUnsplash(keyword, 'illustration', 1);

  if (imageUrl) {
    console.log(`[Category Icon] ✓ Found icon for ${category}`);
    return imageUrl;
  }

  // Unsplash 실패 시 Pixabay에서 검색
  const pixabayUrl = await fetchImageFromPixabay(keyword, 'illustration', 1);
  if (pixabayUrl) {
    console.log(`[Category Icon] ✓ Found icon for ${category} (Pixabay)`);
    return pixabayUrl;
  }

  console.warn(`[Category Icon] ✗ No icon found for ${category}`);
  return '';
}

/**
 * 네이버 이미지 검색
 */
async function fetchImageFromNaver(
  query: string,
  photoStyle: 'realistic' | 'illustration' | 'mixed',
  page: number = 1
): Promise<string> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('[Naver API] Client ID or Secret not configured');
    return '';
  }

  try {
    const start = (page - 1) * 1 + 1; // 네이버는 1부터 시작
    const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(query)}&display=1&start=${start}&sort=sim&filter=large`;

    console.log(`[Naver API] Searching: "${query}", page: ${page}`);

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Naver API] HTTP ${response.status}: ${errorText}`);
      return '';
    }

    const data = await response.json();
    const imageUrl = data.items?.[0]?.link || '';

    if (imageUrl) {
      console.log(`[Naver API] ✓ Found image for "${query}"`);
    } else {
      console.log(`[Naver API] ✗ No image found for "${query}"`);
    }

    return imageUrl;
  } catch (error) {
    console.error('[Naver API] Error:', error);
    return '';
  }
}

/**
 * Unsplash에서 이미지 검색
 */
async function fetchImageFromUnsplash(
  query: string,
  photoStyle: 'realistic' | 'illustration' | 'mixed',
  page: number = 1
): Promise<string> {
  if (photoStyle === 'illustration') {
    return ''; // Unsplash는 실사 위주
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return '';

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&page=${page}&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) return '';

    const data = await response.json();
    return data.results[0]?.urls?.regular || '';
  } catch (error) {
    console.error('Unsplash fetch error:', error);
    return '';
  }
}

/**
 * Pixabay에서 이미지 검색
 */
async function fetchImageFromPixabay(
  query: string,
  photoStyle: 'realistic' | 'illustration' | 'mixed',
  page: number = 1
): Promise<string> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) return '';

  const imageType = photoStyle === 'illustration' ? 'illustration' : 'photo';

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=${imageType}&per_page=1&page=${page}&orientation=horizontal`
    );

    if (!response.ok) return '';

    const data = await response.json();
    return data.hits[0]?.largeImageURL || '';
  } catch (error) {
    console.error('Pixabay fetch error:', error);
    return '';
  }
}

/**
 * 텍스트 Placeholder 교체 맵 생성
 */
export function buildTextReplacements(
  region: string,
  tourismData: TourismDataByCategory,
  metadata: TemplateMetadata
): { [key: string]: string } {
  const replacements: { [key: string]: string } = {
    '{{REGION}}': region,
  };

  // SITE, NAME, DESC 타입 placeholder 처리
  for (const placeholder of metadata.placeholders) {
    if (placeholder.type === 'IMAGE') continue; // 이미지는 별도 처리

    if (!placeholder.category || placeholder.index === null) continue;

    const spots = tourismData[placeholder.category] || [];
    const spotIndex = placeholder.index - 1;
    const spot = spots[spotIndex];

    if (placeholder.type === 'SITE' || placeholder.type === 'NAME') {
      if (spot) {
        // 제목 정리: [대괄호 내용] 제거 후 뒷부분 사용
        let placeName = spot.name;

        // [북한산 둘레길 3구간] 흰구름길 → 흰구름길
        const bracketMatch = placeName.match(/\[.*?\]\s*(.+)/);
        if (bracketMatch) {
          placeName = bracketMatch[1].trim();
        }

        // 12자를 초과하면 자르기
        if (placeName.length > 12) {
          placeName = placeName.substring(0, 12) + '...';
        }

        replacements[placeholder.placeholder] = placeName;
      } else {
        // Tourism 데이터가 없을 때 대체 텍스트
        const categoryName = getCategoryDisplayName(placeholder.category);
        replacements[placeholder.placeholder] = `${region} ${categoryName} ${placeholder.index}`;
      }
    } else if (placeholder.type === 'DESC') {
      // 설명 생성 로직 - 카테고리별 다양한 템플릿
      if (spot) {
        let description = spot.description || '';

        // 10자 미만일 경우 카테고리별 템플릿으로 설명 생성
        if (description.length < 10) {
          description = generateCategoryDescription(spot.name, region, placeholder.category);
        } else if (description.length < 50) {
          // 10~49자일 경우 카테고리별 추가 설명
          const additionalText = getCategoryAdditionalText(placeholder.category, region);
          description = `${description}\n${additionalText}`;
        }
        // 50자 이상이면 그대로 사용

        replacements[placeholder.placeholder] = description;
      } else {
        // Tourism 데이터가 없을 때 카테고리별 기본 설명
        const fallbackName = `${region} ${getCategoryDisplayName(placeholder.category)}`;
        replacements[placeholder.placeholder] = generateCategoryDescription(
          fallbackName,
          region,
          placeholder.category
        );
      }
    }
  }

  return replacements;
}

/**
 * 카테고리 한글 이름 반환
 */
function getCategoryDisplayName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    'NATURAL_SITE': '자연명소',
    'EDU_SITE': '교육시설',
    'CULTURE_SITE': '문화시설',
    'HISTORICAL_SITE': '역사유적지',
    'HISTOIRCAL_SITE': '역사유적지',
    'FESTIVAL_SITE': '축제',
    'TRANSIT_HUB': '교통허브',
    'TRANSITHUB_SITE': '교통허브',
    'MARKETPLACE': '시장',
    'RECREATIONAREA' : '휴양지',
    'SPORTS_SITE': '스포츠시설',
    'SHOPPING_SITE': '쇼핑센터',
    'FOOD_SITE': '음식점',
    'HOTEL_SITE': '숙박시설',
    'TOUR_COURSE': '여행코스',
  };
  return categoryNames[category] || '관광지';
}

/**
 * 카테고리별 설명 생성 (10자 미만일 때 사용)
 */
function generateCategoryDescription(spotName: string, region: string, category: string): string {
  const templates: { [key: string]: string[] } = {
    'NATURAL_SITE': [
      `${spotName}은(는) ${region}의 아름다운 자연경관을 자랑하는 명소입니다.`,
      `푸른 자연 속에서 힐링의 시간을 보낼 수 있는 특별한 장소입니다.`
    ],
    'EDU_SITE': [
      `${spotName}은(는) ${region}에서 다양한 학습 체험이 가능한 교육시설입니다.`,
      `어린이들의 호기심과 창의력을 키워주는 유익한 공간입니다.`
    ],
    'CULTURE_SITE': [
      `${spotName}은(는) ${region}의 문화와 예술을 체험할 수 있는 공간입니다.`,
      `지역의 문화적 가치를 느끼고 배울 수 있는 의미 있는 장소입니다.`
    ],
    'HISTORICAL_SITE': [
      `${spotName}은(는) ${region}의 깊은 역사와 전통이 담긴 유적지입니다.`,
      `선조들의 지혜와 문화를 직접 체험할 수 있는 소중한 장소입니다.`
    ],
    'HISTOIRCAL_SITE': [
      `${spotName}은(는) ${region}의 깊은 역사와 전통이 담긴 유적지입니다.`,
      `선조들의 지혜와 문화를 직접 체험할 수 있는 소중한 장소입니다.`
    ],
    'FESTIVAL_SITE': [
      `${spotName}은(는) ${region}의 활기찬 축제와 행사가 열리는 곳입니다.`,
      `지역 주민과 방문객이 함께 즐기는 특별한 문화 체험 공간입니다.`
    ],
    'TRANSIT_HUB': [
      `${spotName}은(는) ${region}의 주요 교통 중심지입니다.`,
      `다양한 지역으로 연결되는 편리한 이동의 출발점입니다.`
    ],
    'TRANSITHUB_SITE': [
      `${spotName}은(는) ${region}의 주요 교통 중심지입니다.`,
      `다양한 지역으로 연결되는 편리한 이동의 출발점입니다.`
    ],
    'MARKETPLACE': [
      `${spotName}은(는) ${region}의 활기찬 전통시장입니다.`,
      `지역 특산물과 먹거리를 만날 수 있는 정겨운 장소입니다.`
    ],
    'RECREATIONAREA': [
      `${spotName}은(는) ${region}에서 여유로운 휴식을 즐길 수 있는 휴양지입니다.`,
      `자연 속에서 재충전의 시간을 보낼 수 있는 힐링 명소입니다.`
    ],
    'SPORTS_SITE': [
      `${spotName}은(는) ${region}의 다양한 스포츠 활동이 가능한 시설입니다.`,
      `건강한 여가 생활을 즐길 수 있는 활력 넘치는 공간입니다.`
    ],
    'SHOPPING_SITE': [
      `${spotName}은(는) ${region}에서 쇼핑을 즐길 수 있는 명소입니다.`,
      `다양한 상품과 편의시설을 갖춘 복합 쇼핑 공간입니다.`
    ],
    'FOOD_SITE': [
      `${spotName}은(는) ${region}의 맛있는 음식을 맛볼 수 있는 곳입니다.`,
      `지역의 특색 있는 미식을 경험할 수 있는 맛집입니다.`
    ],
    'HOTEL_SITE': [
      `${spotName}은(는) ${region}에서 편안한 숙박이 가능한 시설입니다.`,
      `여행의 피로를 풀고 편안한 휴식을 취할 수 있는 공간입니다.`
    ],
    'TOUR_COURSE': [
      `${spotName}은(는) ${region}을(를) 탐방하는 특별한 여행 코스입니다.`,
      `지역의 주요 명소를 효율적으로 둘러볼 수 있는 추천 경로입니다.`
    ],
  };

  const defaultTemplate = [
    `${spotName}은(는) ${region}에 위치한 지역의 대표 명소입니다.`,
    `방문객들에게 특별한 추억을 선사하는 곳입니다.`
  ];

  const template = templates[category] || defaultTemplate;
  return template.join('\n');
}

/**
 * 카테고리별 추가 설명 (10~49자일 때 사용)
 */
function getCategoryAdditionalText(category: string, region: string): string {
  const additionalTexts: { [key: string]: string } = {
    'NATURAL_SITE': `${region}의 자연을 만끽하며 힐링의 시간을 보내보세요.`,
    'EDU_SITE': `아이들과 함께 즐거운 학습 체험을 해보세요.`,
    'CULTURE_SITE': `${region}의 문화와 예술을 직접 체험해보세요.`,
    'HISTORICAL_SITE': `${region}의 역사와 전통을 느껴보세요.`,
    'HISTOIRCAL_SITE': `${region}의 역사와 전통을 느껴보세요.`,
    'FESTIVAL_SITE': `지역 축제의 활기찬 분위기를 즐겨보세요.`,
    'TRANSIT_HUB': `편리한 교통으로 ${region} 곳곳을 둘러보세요.`,
    'TRANSITHUB_SITE': `편리한 교통으로 ${region} 곳곳을 둘러보세요.`,
    'MARKETPLACE': `${region}의 특산물과 먹거리를 맛보세요.`,
    'RECREATIONAREA': `자연 속에서 여유로운 휴식을 즐겨보세요.`,
    'SPORTS_SITE': `건강한 스포츠 활동을 즐겨보세요.`,
    'SHOPPING_SITE': `다양한 쇼핑과 여가를 즐겨보세요.`,
    'FOOD_SITE': `${region}의 맛있는 음식을 맛보세요.`,
    'HOTEL_SITE': `편안한 숙소에서 여행의 피로를 풀어보세요.`,
    'TOUR_COURSE': `추천 여행 코스를 따라 ${region}의 매력을 발견해보세요.`,
  };

  return additionalTexts[category] || `가족, 친구들과 함께 ${region}을(를) 방문해보세요.`;
}
