import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import PizZip from 'pizzip';
import sharp from 'sharp';
import {
  loadOrGenerateTemplateMetadata,
  fetchTourismDataForTemplate,
  downloadImagesForPlaceholders,
  buildTextReplacements
} from '@/lib/dynamic-pptx-generator';

/**
 * PowerPoint XML에서 placeholder를 치환하는 함수
 * 분리된 태그도 처리: {{ | REGION}} 같은 경우
 */
function replacePlaceholdersInXML(
  xmlContent: string,
  replacements: { [key: string]: string }
): string {
  let result = xmlContent;
  let foundCount = 0;

  // 모든 placeholder를 순회
  for (const [placeholder, value] of Object.entries(replacements)) {
    // 이미지 placeholder는 건너뛰기 (descr 속성에서 사용되므로)
    if (placeholder.includes('_IMAGE_')) {
      continue;
    }

    // 1. 단순 치환 시도 (분리되지 않은 경우)
    if (result.includes(placeholder)) {
      console.log(`[XML Replace] ✓ Found intact "${placeholder}" → "${value}"`);
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedPlaceholder, 'g'), value);
      foundCount++;
      continue;
    }

    // 2. 분리된 placeholder 처리
    // <p:txBody> 블록 단위로 처리
    const txBodyRegex = /<p:txBody[^>]*>([\s\S]*?)<\/p:txBody>/g;
    let txBodyMatch;
    const txBodyMatches = [];

    while ((txBodyMatch = txBodyRegex.exec(result)) !== null) {
      txBodyMatches.push({
        fullMatch: txBodyMatch[0],
        content: txBodyMatch[1],
        index: txBodyMatch.index
      });
    }

    for (const match of txBodyMatches) {
      const txBody = match.fullMatch;
      const txBodyContent = match.content;

      // 모든 <a:t> 태그의 텍스트를 추출
      const textParts: string[] = [];
      const textRegex = /<a:t[^>]*>(.*?)<\/a:t>/g;
      let textMatch;

      while ((textMatch = textRegex.exec(txBodyContent)) !== null) {
        textParts.push(textMatch[1]);
      }

      // 텍스트를 합쳐서 placeholder가 있는지 확인
      const combinedText = textParts.join('');

      if (combinedText.includes(placeholder)) {
        console.log(`[XML Replace] ✓ Found split "${placeholder}" → "${value}"`);

        // 치환된 텍스트
        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replacedText = combinedText.replace(new RegExp(escapedPlaceholder, 'g'), value);

        // 첫 번째 <a:t> 태그에 전체 텍스트를 넣고, 나머지는 비우기
        let isFirst = true;
        const newTxBody = txBody.replace(/<a:t([^>]*)>(.*?)<\/a:t>/g, (_match: string, attrs: string) => {
          if (isFirst) {
            isFirst = false;
            return `<a:t${attrs}>${replacedText}</a:t>`;
          } else {
            return `<a:t${attrs}></a:t>`;
          }
        });

        result = result.replace(txBody, newTxBody);
        foundCount++;
      }
    }
  }

  if (foundCount > 0) {
    console.log(`[XML Replace] ✅ Successfully replaced ${foundCount} placeholders`);
  } else {
    console.log('[XML Replace] ⚠ No placeholders found in this slide');
  }

  return result;
}

/**
 * 이미지 URL에서 이미지를 다운로드하여 Buffer로 반환
 */
async function downloadImage(url: string, retries = 3): Promise<Buffer | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Image Download] Attempt ${attempt}/${retries}: Fetching image from: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[Image Download] HTTP ${response.status} for ${url}`);
        if (attempt < retries) {
          console.log(`[Image Download] Retrying in 1s...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log(`[Image Download] ✓ Success: ${buffer.length} bytes downloaded`);
      return buffer;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`[Image Download] Timeout after 10s for ${url}`);
      } else {
        console.error(`[Image Download] Error (attempt ${attempt}/${retries}):`, error.message);
      }

      if (attempt < retries) {
        console.log(`[Image Download] Retrying in 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        return null;
      }
    }
  }
  return null;
}

/**
 * PowerPoint XML에서 이미지의 크기 정보 추출 (EMU 단위)
 * EMU (English Metric Units): PowerPoint에서 사용하는 단위 (1 inch = 914400 EMU)
 */
interface ImageDimensions {
  width: number;  // EMU 단위
  height: number; // EMU 단위
  widthPx: number;  // 픽셀 단위 (96 DPI 기준)
  heightPx: number; // 픽셀 단위 (96 DPI 기준)
}

function extractImageDimensions(slideContent: string, rId: string): ImageDimensions | null {
  try {
    // rId를 가진 <p:pic> 블록 찾기
    const picRegex = new RegExp(`<p:pic>[\\s\\S]*?<a:blip\\s+r:embed="rId${rId}"[\\s\\S]*?<\\/p:pic>`, 'i');
    const picMatch = slideContent.match(picRegex);

    if (!picMatch) {
      return null;
    }

    const picBlock = picMatch[0];

    // <a:ext> 태그에서 cx, cy 속성 추출 (크기 정보)
    const extMatch = picBlock.match(/<a:ext\s+cx="(\d+)"\s+cy="(\d+)"/i);

    if (!extMatch) {
      return null;
    }

    const width = parseInt(extMatch[1]);
    const height = parseInt(extMatch[2]);

    // EMU를 픽셀로 변환 (96 DPI 기준)
    // 1 inch = 914400 EMU, 1 inch = 96 pixels
    const widthPx = Math.round((width / 914400) * 96);
    const heightPx = Math.round((height / 914400) * 96);

    console.log(`[Image Dimensions] Extracted: ${width} x ${height} EMU = ${widthPx} x ${heightPx} px`);

    return {
      width,
      height,
      widthPx,
      heightPx
    };
  } catch (error) {
    console.error('[Image Dimensions] Error extracting dimensions:', error);
    return null;
  }
}

/**
 * 다운로드한 이미지를 PowerPoint 이미지 크기에 맞게 리사이즈/크롭
 */
async function resizeImageToFit(
  imageBuffer: Buffer,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer> {
  try {
    console.log(`[Image Resize] Target size: ${targetWidth} x ${targetHeight} px`);

    // 원본 이미지 정보 가져오기
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`[Image Resize] Original size: ${metadata.width} x ${metadata.height} px`);

    // Cover 방식: 대상 영역을 완전히 채우면서 비율 유지 (넘치는 부분은 크롭)
    const resized = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'cover',  // 영역을 완전히 채움
        position: 'centre'  // 중앙 기준으로 크롭
      })
      .jpeg({ quality: 90 })  // 고품질 JPEG로 변환
      .toBuffer();

    console.log(`[Image Resize] ✓ Resized to ${targetWidth} x ${targetHeight} px (${resized.length} bytes)`);

    return resized;
  } catch (error) {
    console.error('[Image Resize] Error resizing image:', error);
    // 리사이즈 실패 시 원본 반환
    return imageBuffer;
  }
}

/**
 * 관계 파일에서 최대 rId 번호 찾기
 */
function findMaxRId(relContent: string | undefined): number {
  if (!relContent) return 0;
  const rIdMatches = relContent.match(/rId(\d+)/g);
  if (!rIdMatches) return 0;
  const rIdNumbers = rIdMatches.map(id => parseInt(id.replace('rId', ''), 10));
  return Math.max(...rIdNumbers);
}

/**
 * PowerPoint에서 기존 이미지를 교체 - descr 속성 기반
 */
async function replaceExistingImages(
  zip: PizZip,
  slideFileName: string,
  imageReplacements: { [key: string]: string }
): Promise<boolean> {
  try {
    const slideContent = zip.file(slideFileName)?.asText() || '';
    let modifiedContent = slideContent;
    let modified = false;

    console.log(`[Image Replace] Checking ${slideFileName} for descr attributes...`);
    console.log(`[Image Replace] imageReplacements keys:`, Object.keys(imageReplacements));

    // descr 속성에서 placeholder 찾기
    const imageDescRegex = /<[^:>]*:?cNvPr[^>]*\sdescr="([^"]*)"[^>]*>/gi;

    let match;
    const imagesToReplace: Array<{
      placeholder: string;
      imageUrl: string;
      rId?: string;
      originalTag: string;
    }> = [];

    while ((match = imageDescRegex.exec(slideContent)) !== null) {
      const descr = match[1];
      const originalTag = match[0];
      console.log(`[Image Replace] Found descr="${descr}"`);
      console.log(`[Image Replace] Full tag: ${originalTag.substring(0, 200)}`);

      for (const [placeholder, imageUrl] of Object.entries(imageReplacements)) {
        if (descr.includes(placeholder) && imageUrl) {
          // rId 추출 시도 - 주변 XML 컨텍스트에서 찾기
          const rIdMatch = originalTag.match(/id="(\d+)"/);

          // 추가 디버깅: 이 descr이 속한 <p:pic> 블록 찾기
          const picBlockStart = slideContent.lastIndexOf('<p:pic>', match.index);
          const picBlockEnd = slideContent.indexOf('</p:pic>', match.index) + 8;
          const picBlock = slideContent.substring(picBlockStart, picBlockEnd);

          // <a:blip> 태그에서 r:embed 찾기
          const blipMatch = picBlock.match(/<a:blip[^>]*r:embed="([^"]*)"[^>]*>/i);
          const embedRId = blipMatch ? blipMatch[1] : undefined;

          console.log(`[Image Replace] DEBUG for "${placeholder}":`);
          console.log(`  - id from cNvPr: ${rIdMatch ? rIdMatch[1] : 'NONE'}`);
          console.log(`  - r:embed from blip: ${embedRId || 'NONE'}`);
          console.log(`  - picBlock length: ${picBlock.length} chars`);

          imagesToReplace.push({
            placeholder,
            imageUrl,
            rId: embedRId || (rIdMatch ? rIdMatch[1] : undefined),
            originalTag
          });
          console.log(`[Image Replace] ✓ MATCHED descr="${descr}" with placeholder="${placeholder}"`);
        }
      }
    }

    if (imagesToReplace.length === 0) {
      console.log(`[Image Replace] ⚠ No images with placeholders found in ${slideFileName}`);
      return false;
    }

    console.log(`[Image Replace] Found ${imagesToReplace.length} images to replace`);

    // 슬라이드의 관계 파일 확인
    const slideRelFileName = slideFileName.replace('ppt/slides/', 'ppt/slides/_rels/').replace('.xml', '.xml.rels');
    let slideRelContent = zip.file(slideRelFileName)?.asText();

    if (!slideRelContent) {
      console.error(`[Image Replace] Relationship file not found: ${slideRelFileName}`);
    }

    // 이미 처리된 rId와 imagePath를 추적 (중복 방지)
    const processedRIds = new Map<string, { placeholder: string; imagePath: string }>();

    // 각 이미지를 다운로드하고 교체
    let imageCounter = 1;
    let newImageIdCounter = Date.now();
    for (const imageInfo of imagesToReplace) {
      const { placeholder, imageUrl, rId } = imageInfo;
      console.log(`[Image Replace] Processing ${placeholder} from ${imageUrl}`);

      // 1. 이미지 다운로드
      let imageBuffer = await downloadImage(imageUrl);
      if (!imageBuffer) {
        console.error(`[Image Replace] ❌ Failed to download image for ${placeholder}`);
        imageCounter++;
        continue;
      }
      console.log(`[Image Replace] ✓ Downloaded ${placeholder}: ${imageBuffer.length} bytes`);

      // 2. PowerPoint에서 기존 이미지의 크기 정보 추출
      if (rId) {
        const dimensions = extractImageDimensions(slideContent, rId);
        if (dimensions) {
          // 3. 다운로드한 이미지를 기존 이미지 크기에 맞게 리사이즈/크롭
          imageBuffer = await resizeImageToFit(imageBuffer, dimensions.widthPx, dimensions.heightPx);
        } else {
          console.warn(`[Image Replace] Could not extract dimensions for ${placeholder}, using original size`);
        }
      }

      // 이미지 확장자 결정
      const imageExt = imageUrl.match(/\.(jpg|jpeg|png|gif)$/i)?.[1]?.toLowerCase() || 'jpg';

      // 이 이미지가 교체되었는지 추적
      let imageReplaced = false;

      // 4. 관계 파일에서 해당 이미지의 실제 경로 찾기
      if (slideRelContent && rId) {
        console.log(`[Image Replace] Looking for relationship with rId="${rId}"`);

        // rId 형식 처리 (rId123 또는 123)
        const cleanRId = rId.replace(/^rId/i, '');
        const relPattern = new RegExp(`<Relationship[^>]*Id="rId${cleanRId}"[^>]*Target="([^"]*)"[^>]*/>`, 'i');
        const relMatch = slideRelContent.match(relPattern);

        console.log(`[Image Replace] Searching pattern: <Relationship...Id="rId${cleanRId}"...>`);
        console.log(`[Image Replace] Found match: ${relMatch ? 'YES' : 'NO'}`);

        if (relMatch) {
          let imagePath = relMatch[1].replace('../', 'ppt/');
          console.log(`[Image Replace] ✅ Found image relationship: ${imagePath}`);

          // 파일이 실제로 존재하는지 확인
          const existingFile = zip.file(imagePath);
          if (existingFile) {
            console.log(`[Image Replace] ✅ File exists in zip: ${imagePath}`);
          } else {
            console.warn(`[Image Replace] ⚠ File NOT found in zip: ${imagePath}`);
          }

          // 이 rId가 이미 다른 placeholder에 의해 처리되었는지 확인
          if (processedRIds.has(rId)) {
            const previous = processedRIds.get(rId)!;
            console.log(`[Image Replace] ⚠ rId="${rId}" already used by ${previous.placeholder}`);
            console.log(`[Image Replace] 🔧 Creating NEW image file for ${placeholder}`);

            // 새로운 이미지 파일 생성
            newImageIdCounter++;
            const newImagePath = `ppt/media/image${newImageIdCounter}.${imageExt}`;
            zip.file(newImagePath, imageBuffer);
            console.log(`[Image Replace] ✅ Created new image: ${newImagePath}`);

            // 새로운 rId 생성
            const maxRId = findMaxRId(slideRelContent);
            const newRId = `rId${maxRId + 1}`;
            console.log(`[Image Replace] 🔧 Creating new relationship: ${newRId} → ${newImagePath}`);

            // 관계 파일에 새 관계 추가
            const newRelationship = `<Relationship Id="${newRId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${newImagePath.split('/').pop()}"/>`;
            slideRelContent = slideRelContent!.replace('</Relationships>', `  ${newRelationship}\n</Relationships>`);

            // 슬라이드 XML에서 이 placeholder의 r:embed를 새 rId로 업데이트
            const picBlockStart = modifiedContent.lastIndexOf('<p:pic>', modifiedContent.indexOf(placeholder));
            const picBlockEnd = modifiedContent.indexOf('</p:pic>', picBlockStart) + 8;
            const picBlock = modifiedContent.substring(picBlockStart, picBlockEnd);
            const updatedPicBlock = picBlock.replace(new RegExp(`r:embed="${rId}"`, 'g'), `r:embed="${newRId}"`);
            modifiedContent = modifiedContent.substring(0, picBlockStart) + updatedPicBlock + modifiedContent.substring(picBlockEnd);

            console.log(`[Image Replace] ✅ Updated slide XML: ${rId} → ${newRId}`);

            imagePath = newImagePath;
            processedRIds.set(newRId, { placeholder, imagePath: newImagePath });
          } else {
            // 처음 사용되는 rId - 기존 파일 교체
            zip.file(imagePath, imageBuffer);
            processedRIds.set(rId, { placeholder, imagePath });
            console.log(`[Image Replace] ✓ Replaced ${imagePath} with resized image (${imageBuffer.length} bytes)`);
          }

          modified = true;
          imageReplaced = true;
        } else {
          console.warn(`[Image Replace] ⚠ Could not find relationship for rId="${rId}"`);
        }
      } else {
        console.warn(`[Image Replace] ⚠ No relationship content or rId for ${placeholder}`);
      }

      // 관계를 찾지 못한 경우, media 폴더의 이미지를 순차적으로 교체
      if (!imageReplaced) {
        console.log(`[Image Replace] ⚠ FALLBACK PATH: Using index-based replacement for ${placeholder}`);

        const mediaFiles = Object.keys(zip.files).filter(name =>
          name.startsWith('ppt/media/') && /\.(jpg|jpeg|png|gif)$/i.test(name)
        ).sort();

        console.log(`[Image Replace] All media files (${mediaFiles.length}):`, mediaFiles);
        console.log(`[Image Replace] Looking for index: ${imageCounter} (0-based: ${imageCounter - 1})`);

        if (mediaFiles.length >= imageCounter) {
          // 순서대로 이미지 교체
          const targetImagePath = mediaFiles[imageCounter - 1];
          console.log(`[Image Replace] ⚠ FALLBACK: Will replace ${targetImagePath} for ${placeholder}`);

          // 기존 이미지에서 크기 읽기
          try {
            const existingImageBuffer = zip.file(targetImagePath)?.asNodeBuffer();
            if (existingImageBuffer) {
              const existingMetadata = await sharp(existingImageBuffer).metadata();
              if (existingMetadata.width && existingMetadata.height) {
                console.log(`[Image Replace] Extracted size from existing image: ${existingMetadata.width} x ${existingMetadata.height} px`);
                console.log(`[Image Replace] ⚠ THIS IS LIKELY THE WRONG IMAGE! Dimensions: ${existingMetadata.width}x${existingMetadata.height}`);
                // 기존 이미지 크기에 맞춰 리사이즈
                imageBuffer = await resizeImageToFit(imageBuffer, existingMetadata.width, existingMetadata.height);
              }
            }
          } catch (error) {
            console.warn(`[Image Replace] Could not resize to match existing image:`, error);
          }

          zip.file(targetImagePath, imageBuffer);
          modified = true;
          imageReplaced = true;
          console.log(`[Image Replace] ✓ Replaced ${targetImagePath} (index: ${imageCounter}) with resized image (${imageBuffer.length} bytes)`);
        } else {
          // 새 이미지 추가
          const newImagePath = `ppt/media/image${Date.now()}_${imageCounter}.${imageExt}`;
          zip.file(newImagePath, imageBuffer);
          modified = true;
          imageReplaced = true;
          console.log(`[Image Replace] ✓ Added new image to ${newImagePath} (${imageBuffer.length} bytes)`);
        }
      }

      if (!imageReplaced) {
        console.error(`[Image Replace] ❌ Failed to replace ${placeholder} - no valid path found`);
      }

      imageCounter++;
    }

    // descr 속성의 placeholder를 이미지 정보로 치환 (선택적)
    if (modified) {
      for (const [placeholder, imageUrl] of Object.entries(imageReplacements)) {
        if (imageUrl) {
          const imageName = imageUrl.split('/').pop() || 'image';
          modifiedContent = modifiedContent.replace(
            new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            imageName
          );
        }
      }

      // 수정된 슬라이드 내용 저장
      zip.file(slideFileName, modifiedContent);

      // 수정된 관계 파일 저장
      if (slideRelContent) {
        zip.file(slideRelFileName, slideRelContent);
        console.log(`[Image Replace] ✅ Updated relationship file: ${slideRelFileName}`);
      }
    }

    return modified;
  } catch (error) {
    console.error(`[Image Replace] Error in ${slideFileName}:`, error);
    return false;
  }
}

/**
 * 오래된 생성 기록 자동 정리
 * 최근 10개만 유지하고 나머지는 삭제 (DB + Storage)
 */
async function cleanupOldGenerations(supabase: any) {
  try {
    // 1. 최근 10개를 제외한 오래된 레코드 조회
    const { data: allRecords } = await supabase
      .from('generation_requests')
      .select('id, result_file_path, created_at')
      .order('created_at', { ascending: false });

    if (!allRecords || allRecords.length <= 10) {
      // 10개 이하면 정리 필요 없음
      return;
    }

    // 최근 10개를 제외한 나머지
    const recordsToDelete = allRecords.slice(10);

    console.log(`[Cleanup] Deleting ${recordsToDelete.length} old records...`);

    // 2. Storage에서 파일 삭제
    const filePaths = recordsToDelete
      .map((r: any) => r.result_file_path)
      .filter(Boolean);

    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('templates')
        .remove(filePaths);

      if (storageError) {
        console.error('[Cleanup] Storage delete error:', storageError);
      } else {
        console.log(`[Cleanup] Deleted ${filePaths.length} files from storage`);
      }
    }

    // 3. 데이터베이스에서 레코드 삭제
    const idsToDelete = recordsToDelete.map((r: any) => r.id);
    const { error: dbError } = await supabase
      .from('generation_requests')
      .delete()
      .in('id', idsToDelete);

    if (dbError) {
      console.error('[Cleanup] Database delete error:', dbError);
    } else {
      console.log(`[Cleanup] Deleted ${idsToDelete.length} records from database`);
    }
  } catch (error) {
    console.error('[Cleanup] Cleanup error:', error);
    // 정리 실패해도 생성은 계속 진행
  }
}

/**
 * PPT 생성 API - 동적 시스템 적용
 * POST /api/generate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { regionName, templateId, options } = body;

    if (!templateId || !options || !regionName) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    console.log('[Dynamic PPTX] ========================================');
    console.log('[Dynamic PPTX] 동적 PPTX 생성 시작');
    console.log('[Dynamic PPTX] Region:', regionName);
    console.log('[Dynamic PPTX] Template ID:', templateId);
    console.log('[Dynamic PPTX] Options:', options);
    console.log('[Dynamic PPTX] ========================================');

    // 1. 템플릿 정보 조회
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log('[Dynamic PPTX] Template found:', template.title);

    // 2. 템플릿 PPTX 파일 다운로드
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('templates')
      .createSignedUrl(template.file_path, 60);

    if (urlError || !signedUrlData) {
      console.error('Signed URL creation error:', urlError);
      return NextResponse.json(
        { error: '템플릿 파일 URL 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 3. PPTX 파일 다운로드 및 Buffer로 변환
    let templateBuffer: Buffer;
    try {
      const response = await fetch(signedUrlData.signedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      templateBuffer = Buffer.from(arrayBuffer);

      console.log(`[Dynamic PPTX] Downloaded file size: ${templateBuffer.length} bytes`);

      if (templateBuffer.length === 0) {
        throw new Error('Downloaded file is empty');
      }
    } catch (error) {
      console.error('[Dynamic PPTX] File download error:', error);
      return NextResponse.json(
        { error: '템플릿 파일 다운로드 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 4. 템플릿 메타데이터 로드 (Placeholder 분석)
    console.log('[Dynamic PPTX] Step 1: 템플릿 메타데이터 추출 중...');
    const metadata = await loadOrGenerateTemplateMetadata(
      templateBuffer,
      template.id,
      template.title,
      template.file_path
    );

    console.log(`[Dynamic PPTX] ✓ 템플릿 메타데이터 로드 완료`);
    console.log(`[Dynamic PPTX]   Placeholder 수: ${metadata.placeholders.length}`);
    metadata.placeholders.forEach(p => {
      console.log(`[Dynamic PPTX]   - ${p.placeholder} (${p.type}, ${p.category || 'N/A'}, index: ${p.index || 'N/A'})`);
    });

    // 5. Tourism 데이터 가져오기
    console.log('[Dynamic PPTX] Step 2: Tourism 데이터 가져오는 중...');
    const tourismApiKey = process.env.KOREAN_TOURISM_API_KEY;

    if (!tourismApiKey) {
      return NextResponse.json(
        { error: 'Tourism API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const tourismData = await fetchTourismDataForTemplate(
      regionName,
      metadata,
      tourismApiKey
    );

    console.log('[Dynamic PPTX] ✓ Tourism 데이터 가져오기 완료');
    for (const [category, spots] of Object.entries(tourismData)) {
      console.log(`[Dynamic PPTX]   ${category}: ${spots.length}개`);
      spots.forEach((spot, idx) => {
        const readcountStr = spot.readcount ? ` [조회수: ${spot.readcount.toLocaleString()}]` : '';
        console.log(`[Dynamic PPTX]     ${idx + 1}. ${spot.name} (이미지: ${spot.image ? 'O' : 'X'})${readcountStr}`);
      });
    }

    // 6. 이미지 다운로드 및 매핑
    console.log('[Dynamic PPTX] Step 3: 이미지 다운로드 및 매핑 중...');
    const imageUrls = await downloadImagesForPlaceholders(
      metadata,
      tourismData,
      regionName,
      options.photoStyle || 'realistic'
    );

    console.log('[Dynamic PPTX] ✓ 이미지 매핑 완료');
    for (const [placeholder, url] of Object.entries(imageUrls)) {
      console.log(`[Dynamic PPTX]   ${placeholder} → ${url.substring(0, 60)}...`);
    }

    // 7. 텍스트 Replacement 맵 생성
    console.log('[Dynamic PPTX] Step 4: 텍스트 Replacement 맵 생성 중...');
    const replacements = buildTextReplacements(
      regionName,
      tourismData,
      metadata
    );

    console.log('[Dynamic PPTX] ✓ 텍스트 Replacement 맵 생성 완료');
    for (const [placeholder, value] of Object.entries(replacements)) {
      console.log(`[Dynamic PPTX]   ${placeholder} → ${value}`);
    }

    // 8. PPTX 파일 수정
    console.log('[Dynamic PPTX] Step 5: PPTX 파일 수정 중...');
    let zip: PizZip;
    try {
      zip = new PizZip(templateBuffer);
    } catch (error) {
      console.error('[Dynamic PPTX] PizZip initialization error:', error);
      return NextResponse.json(
        { error: 'PPTX 파일이 손상되었거나 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    const slideFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );

    console.log(`[Dynamic PPTX] 총 ${slideFiles.length}개 슬라이드 발견`);

    // 9. 이미지 교체 (먼저 실행)
    console.log('[Dynamic PPTX] 9-1. 이미지 교체 중...');
    for (const slideFile of slideFiles) {
      await replaceExistingImages(zip, slideFile, imageUrls);
    }

    // 10. 텍스트 교체
    console.log('[Dynamic PPTX] 9-2. 텍스트 교체 중...');
    for (const slideFile of slideFiles) {
      const slideContent = zip.file(slideFile)?.asText();
      if (!slideContent) continue;

      const modifiedContent = replacePlaceholdersInXML(slideContent, replacements);
      zip.file(slideFile, modifiedContent);
    }

    // 11. 수정된 PPTX 파일 생성
    console.log('[Dynamic PPTX] Step 6: 수정된 PPTX 파일 생성 중...');
    const resultBuffer = zip.generate({ type: 'nodebuffer' });
    // 파일명: Supabase Storage가 한글을 지원하지 않으므로 타임스탬프만 사용
    // 원본 지역명은 DB의 options 필드에 저장됨
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileName = `ppt_${timestamp}_${randomId}.pptx`;

    // 12. Supabase Storage에 업로드
    console.log('[Dynamic PPTX] Step 7: Supabase Storage에 업로드 중...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('templates')
      .upload(`generated/${fileName}`, resultBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        upsert: true
      });

    if (uploadError) {
      console.error('[Dynamic PPTX] Upload error:', uploadError);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('[Dynamic PPTX] ✓ 파일 업로드 완료:', fileName);

    // 13. generation_requests 테이블에 기록
    const { data: insertData, error: insertError} = await supabase
      .from('generation_requests')
      .insert({
        region_id: null,
        template_id: templateId,
        options: {
          regionName: regionName,
          photoStyle: options.photoStyle,
          slideCount: options.slideCount
        },
        result_file_path: `generated/${fileName}`,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Dynamic PPTX] Database insert error:', insertError);
    } else {
      console.log('[Dynamic PPTX] ✓ DB 기록 완료:', insertData?.id);
    }

    // 14. 오래된 파일 정리 (비동기, 백그라운드)
    cleanupOldGenerations(supabase).catch(err => {
      console.error('[Dynamic PPTX] Cleanup error:', err);
    });

    // 15. 다운로드 URL 생성
    const { data: downloadUrlData } = await supabase.storage
      .from('templates')
      .createSignedUrl(`generated/${fileName}`, 3600); // 1시간 유효

    console.log('[Dynamic PPTX] ========================================');
    console.log('[Dynamic PPTX] ✅ PPTX 생성 완료!');
    console.log('[Dynamic PPTX] ========================================');

    return NextResponse.json({
      success: true,
      jobId: insertData?.id || 'completed', // 클라이언트 호환성을 위한 jobId
      fileUrl: downloadUrlData?.signedUrl,
      fileName: fileName,
      metadata: {
        region: regionName,
        template: template.title,
        placeholders: metadata.placeholders.length,
        tourismSpots: Object.values(tourismData).flat().length
      }
    });

  } catch (error) {
    console.error('[Dynamic PPTX] Fatal error:', error);
    return NextResponse.json(
      { error: 'PPTX 생성 중 오류가 발생했습니다.', details: String(error) },
      { status: 500 }
    );
  }
}
