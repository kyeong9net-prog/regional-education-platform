import { useState } from 'react';
import Image from 'next/image';
import { FileText, Calendar, Layers, HardDrive, Tag, History, X } from 'lucide-react';
import type { Template } from '@/lib/dummy-data';
import TemplateVersionHistory from '@/components/templates/TemplateVersionHistory';

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onDelete?: (templateId: string) => void;
  onToggleActive?: (templateId: string, isActive: boolean) => void;
}

export default function TemplateCard({ template, onEdit, onDelete, onToggleActive }: TemplateCardProps) {
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  return (
    <>
    <div className="p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* 미리보기 이미지 또는 아이콘 */}
        <div className="w-20 h-20 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {template.previewImageUrl ? (
            <Image
              src={template.previewImageUrl}
              alt={template.title}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText className="w-10 h-10 text-purple-600" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {template.title}
                {template.isActive === false && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                    비활성
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {template.description}
              </p>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {template.slideCount && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Layers className="w-3.5 h-3.5" />
                <span>{template.slideCount}슬라이드</span>
              </div>
            )}
            {template.fileSize && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{template.fileSize}</span>
              </div>
            )}
            {template.category && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Tag className="w-3.5 h-3.5" />
                <span>{template.category}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{template.createdAt}</span>
            </div>
          </div>

          {/* 태그 */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {template.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium hover:bg-purple-200 transition-colors"
            >
              <History className="w-3 h-3" />
              v{template.version}
            </button>
            {template.variables && template.variables.length > 0 && (
              <span className="text-xs text-gray-500">
                변수 {template.variables.length}개
              </span>
            )}
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col gap-2">
          {/* 활성화/비활성화 토글 */}
          <button
            onClick={() => onToggleActive?.(template.id, template.isActive !== false)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              template.isActive === false
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            aria-label={`템플릿 ${template.isActive === false ? '활성화' : '비활성화'}`}
            aria-pressed={template.isActive !== false}
          >
            {template.isActive === false ? '비활성' : '활성'}
          </button>
          <button
            onClick={() => onEdit?.(template)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={`${template.title} 템플릿 수정`}
          >
            수정
          </button>
          <button
            onClick={() => onDelete?.(template.id)}
            className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            aria-label={`${template.title} 템플릿 삭제`}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 버전 히스토리 모달 */}
      {showVersionHistory && template.versionHistory && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900">버전 히스토리</h4>
            <button
              onClick={() => setShowVersionHistory(false)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <TemplateVersionHistory
            versionHistory={template.versionHistory}
            currentVersion={template.version}
          />
        </div>
      )}
    </div>
    </>
  );
}
