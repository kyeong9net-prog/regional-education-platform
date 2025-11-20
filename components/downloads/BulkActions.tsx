import { Trash2, CheckSquare, Square } from 'lucide-react';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
}

export default function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
}: BulkActionsProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {allSelected ? (
              <>
                <CheckSquare className="w-4 h-4" />
                <span>전체 선택 해제</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                <span>전체 선택</span>
              </>
            )}
          </button>

          <span className="text-sm font-medium text-gray-700">
            {selectedCount}개 파일 선택됨
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>선택한 파일 삭제</span>
          </button>
        </div>
      </div>
    </div>
  );
}
