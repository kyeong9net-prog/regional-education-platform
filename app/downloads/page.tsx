'use client';

import { useState } from 'react';
import Navigation from '@/components/layout/Navigation';
import FileCard from '@/components/downloads/FileCard';
import BulkActions from '@/components/downloads/BulkActions';
import { dummyGeneratedFiles } from '@/lib/dummy-data';
import { Search, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFileSearch } from '@/lib/hooks/useFileSearch';
import { useFileFilter } from '@/lib/hooks/useFileFilter';
import { usePagination } from '@/lib/hooks/usePagination';
import { downloadFile, deleteFile, deleteFiles, renameFile, regenerateFile } from '@/lib/api/files';
import type { GeneratedFile } from '@/types';

export default function DownloadsPage() {
  const [files, setFiles] = useState<GeneratedFile[]>(dummyGeneratedFiles);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // 검색 및 필터링
  const { searchQuery, filteredFiles: searchedFiles, handleSearch, clearSearch } = useFileSearch(files);
  const {
    filter,
    sortBy,
    filteredFiles,
    setStatusFilter,
    setDateRange,
    setSortBy,
    clearFilters,
    isFiltered,
  } = useFileFilter(searchedFiles);

  // 페이지네이션
  const {
    pagination,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
  } = usePagination(filteredFiles, 10);

  const handleDownload = async (file: GeneratedFile) => {
    if (file.downloadUrl) {
      await downloadFile(file.downloadUrl, `${file.regionName}-${file.templateTitle}.pptx`);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      await deleteFile(fileId);
      setFiles(files.filter(f => f.id !== fileId));
      setSelectedFiles(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;

    if (confirm(`선택한 ${selectedFiles.size}개의 파일을 삭제하시겠습니까?`)) {
      await deleteFiles(Array.from(selectedFiles));
      setFiles(files.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
    }
  };

  const handleRename = async (fileId: string, newName: string) => {
    await renameFile(fileId, newName);
    setFiles(files.map(f => f.id === fileId ? { ...f, regionName: newName } : f));
  };

  const handleRegenerate = async (fileId: string) => {
    const { jobId } = await regenerateFile(fileId);
    alert(`재생성이 시작되었습니다. (Job ID: ${jobId})`);
  };

  const handleSelectFile = (fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(fileId);
      } else {
        next.delete(fileId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedFiles(new Set(paginatedItems.map(f => f.id)));
  };

  const handleDeselectAll = () => {
    setSelectedFiles(new Set());
  };

  return (
    <div className="flex">
      <Navigation />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              다운로드
            </h1>
            <p className="text-gray-600">
              생성된 PPT 수업자료를 관리하고 다운로드하세요.
            </p>
          </div>

          {/* 검색 및 필터 UI */}
          <div className="mb-6 space-y-4">
            {/* 검색 바 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="지역명 또는 템플릿명으로 검색..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">필터:</span>
              </div>

              {/* 상태 필터 */}
              <select
                value={filter.status || ''}
                onChange={(e) => setStatusFilter(e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">전체 상태</option>
                <option value="completed">생성 완료</option>
                <option value="processing">생성 중</option>
                <option value="failed">생성 실패</option>
              </select>

              {/* 정렬 옵션 */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="latest">최신순</option>
                <option value="name">이름순</option>
                <option value="region">지역순</option>
                <option value="status">상태순</option>
              </select>

              {/* 날짜 범위 필터 */}
              <input
                type="date"
                value={filter.dateFrom || ''}
                onChange={(e) => setDateRange(e.target.value || null, filter.dateTo || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="시작 날짜"
              />
              <span className="text-sm text-gray-500">~</span>
              <input
                type="date"
                value={filter.dateTo || ''}
                onChange={(e) => setDateRange(filter.dateFrom || null, e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="종료 날짜"
              />

              {/* 필터 초기화 */}
              {(isFiltered || searchQuery) && (
                <button
                  onClick={() => {
                    clearFilters();
                    clearSearch();
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  필터 초기화
                </button>
              )}

              {/* 결과 수 */}
              <span className="ml-auto text-sm text-gray-600">
                {pagination.totalItems}개 파일
              </span>
            </div>
          </div>

          {/* 일괄 작업 */}
          <div className="mb-4">
            <BulkActions
              selectedCount={selectedFiles.size}
              totalCount={paginatedItems.length}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onDeleteSelected={handleDeleteSelected}
            />
          </div>

          {/* 파일 목록 */}
          <div className="space-y-4">
            {paginatedItems.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onRename={handleRename}
                onRegenerate={handleRegenerate}
                isSelected={selectedFiles.has(file.id)}
                onSelect={handleSelectFile}
              />
            ))}
          </div>

          {/* 빈 상태 */}
          {filteredFiles.length === 0 && (
            <div className="text-center py-16 bg-white border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || isFiltered ? '검색 결과가 없습니다' : '생성된 파일이 없습니다'}
              </h3>
              <p className="text-gray-600">
                {searchQuery || isFiltered
                  ? '다른 검색어나 필터 조건을 사용해보세요.'
                  : '워크스페이스에서 새로운 자료를 생성해보세요.'}
              </p>
            </div>
          )}

          {/* 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {pagination.totalItems}개 중 {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}번째 표시
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={pagination.currentPage === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pagination.currentPage === page
                          ? 'bg-primary text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={nextPage}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
