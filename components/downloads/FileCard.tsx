import { useState, memo, useCallback } from 'react';
import { FileText, Download, Trash2, Edit2, RefreshCw, CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react';
import type { GeneratedFile } from '@/types';

interface FileCardProps {
  file: GeneratedFile;
  onDownload: (file: GeneratedFile) => void;
  onDelete: (fileId: string) => void;
  onRename: (fileId: string, newName: string) => void;
  onRegenerate: (fileId: string) => void;
  isSelected?: boolean;
  onSelect?: (fileId: string, selected: boolean) => void;
}

const FileCard = memo(function FileCard({
  file,
  onDownload,
  onDelete,
  onRename,
  onRegenerate,
  isSelected = false,
  onSelect,
}: FileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(file.regionName);

  const handleRename = useCallback(() => {
    if (editedName.trim() && editedName !== file.regionName) {
      onRename(file.id, editedName.trim());
    }
    setIsEditing(false);
  }, [editedName, file.regionName, file.id, onRename]);

  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'completed':
        return <span className="text-green-600">생성 완료</span>;
      case 'processing':
        return <span className="text-blue-600">생성 중</span>;
      case 'failed':
        return <span className="text-red-600">생성 실패</span>;
    }
  };

  return (
    <div
      className={`p-4 md:p-6 bg-white dark:bg-gray-800 border-2 rounded-lg hover:shadow-md transition-all ${
        isSelected ? 'border-primary bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-3 md:gap-4 flex-1">
          {/* 선택 체크박스 */}
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(file.id, e.target.checked)}
              className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
          )}

          {/* 파일 아이콘 */}
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-primary" />
          </div>

          <div className="flex-1">
            {/* 파일명 */}
            {isEditing ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  className="flex-1 px-3 py-1 border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>
            ) : (
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {file.regionName} - {file.templateTitle}
              </h3>
            )}

            {/* 파일 정보 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{file.generatedAt}</span>
              </div>

              <div className="flex items-center gap-1">
                {getStatusIcon()}
                {getStatusText()}
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
          {file.status === 'completed' && file.downloadUrl && (
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`${file.regionName} 파일 다운로드`}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm md:text-base">다운로드</span>
            </button>
          )}

          {file.status === 'processing' && (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg cursor-not-allowed"
              aria-label="처리 중"
            >
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span className="text-sm md:text-base">처리 중</span>
            </button>
          )}

          {file.status === 'failed' && (
            <button
              onClick={() => onRegenerate(file.id)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label={`${file.regionName} 파일 재생성`}
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm md:text-base">재생성</span>
            </button>
          )}

          {file.status === 'completed' && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                title="이름 변경"
                aria-label="파일 이름 변경"
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                onClick={() => onDelete(file.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                title="삭제"
                aria-label={`${file.regionName} 파일 삭제`}
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default FileCard;
