'use client';

import { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, Edit2, X, ChevronUp, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  slides_count: number;
  file_path: string;
  thumbnail_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 업로드 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [slidesCount, setSlidesCount] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSlidesCount, setEditSlidesCount] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  // 환경변수에서 관리자 비밀키 가져오기
  const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'your-random-secret-key-change-this';

  // 템플릿 목록 조회
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/templates', {
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        console.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 템플릿 목록 조회
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 템플릿 업로드 (Supabase Storage로 직접 업로드)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title || !description || !category || !slidesCount) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    const uploadToast = toast.loading('파일 업로드 중...');
    try {
      setUploading(true);

      // 1단계: Supabase Storage에 파일 직접 업로드

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `${timestamp}-${randomId}.pptx`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast.error('파일 업로드에 실패했습니다: ' + uploadError.message, { id: uploadToast });
        return;
      }

      toast.loading('템플릿 정보 저장 중...', { id: uploadToast });

      // 2단계: 데이터베이스에 템플릿 정보 저장
      const response = await fetch('/api/admin/templates/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          slides_count: parseInt(slidesCount, 10),
          file_path: uploadData.path,
        }),
      });

      if (response.ok) {
        toast.success('템플릿이 성공적으로 업로드되었습니다.', { id: uploadToast });
        // 폼 초기화
        setTitle('');
        setDescription('');
        setCategory('');
        setSlidesCount('');
        setFile(null);
        // 파일 input 초기화
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // 목록 새로고침
        fetchTemplates();
      } else {
        const data = await response.json();
        const errorMsg = data.error || '템플릿 정보 저장에 실패했습니다.';
        toast.error(errorMsg, { id: uploadToast });

        // 실패 시 업로드된 파일 삭제
        await supabase.storage.from('templates').remove([fileName]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('업로드 중 오류가 발생했습니다.', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  // 템플릿 수정 모달 열기
  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setEditTitle(template.title);
    setEditDescription(template.description);
    setEditCategory(template.category);
    setEditSlidesCount(template.slides_count.toString());
    setEditFile(null);
    setIsEditModalOpen(true);
  };

  // 템플릿 수정 저장 (Supabase Storage로 직접 업로드)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingTemplate || !editTitle || !editDescription || !editCategory || !editSlidesCount) {
      toast.error('모든 필드를 입력해주세요.');
      return;
    }

    const loadingToast = toast.loading('수정 중...');
    try {
      let filePath = editingTemplate.file_path;

      // 파일이 있는 경우 Supabase Storage에 직접 업로드
      if (editFile) {
        toast.loading('파일 업로드 중...', { id: loadingToast });

        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const fileName = `${timestamp}-${randomId}.pptx`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('templates')
          .upload(fileName, editFile, {
            contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            upsert: false,
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          toast.error('파일 업로드에 실패했습니다: ' + uploadError.message, { id: loadingToast });
          return;
        }

        // 기존 파일 삭제
        if (editingTemplate.file_path) {
          await supabase.storage.from('templates').remove([editingTemplate.file_path]);
        }

        filePath = uploadData.path;
      }

      toast.loading('템플릿 정보 저장 중...', { id: loadingToast });

      // 데이터베이스 업데이트
      const response = await fetch(`/api/admin/templates?id=${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          slides_count: parseInt(editSlidesCount, 10),
          file_path: filePath,
        }),
      });

      if (response.ok) {
        toast.success('템플릿이 수정되었습니다.', { id: loadingToast });
        setIsEditModalOpen(false);
        setEditingTemplate(null);
        setEditFile(null);
        fetchTemplates();
      } else {
        const data = await response.json();
        toast.error(data.error || '수정에 실패했습니다.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('수정 중 오류가 발생했습니다.', { id: loadingToast });
    }
  };

  // 수정 모달 닫기
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTemplate(null);
  };

  // 템플릿 순서 위로 이동 (데이터베이스에 저장)
  const handleMoveUp = async (index: number) => {
    if (index === 0) return; // 이미 맨 위

    const newTemplates = [...templates];
    const temp = newTemplates[index - 1];
    newTemplates[index - 1] = newTemplates[index];
    newTemplates[index] = temp;

    // 로컬 상태 즉시 업데이트
    setTemplates(newTemplates);

    // 데이터베이스에 순서 저장
    await updateDisplayOrders(newTemplates);
  };

  // 템플릿 순서 아래로 이동 (데이터베이스에 저장)
  const handleMoveDown = async (index: number) => {
    if (index === templates.length - 1) return; // 이미 맨 아래

    const newTemplates = [...templates];
    const temp = newTemplates[index + 1];
    newTemplates[index + 1] = newTemplates[index];
    newTemplates[index] = temp;

    // 로컬 상태 즉시 업데이트
    setTemplates(newTemplates);

    // 데이터베이스에 순서 저장
    await updateDisplayOrders(newTemplates);
  };

  // 데이터베이스에 display_order 저장
  const updateDisplayOrders = async (orderedTemplates: Template[]) => {
    try {
      // 각 템플릿의 display_order를 인덱스로 업데이트
      await Promise.all(
        orderedTemplates.map(async (template, index) => {
          const response = await fetch(`/api/admin/templates?id=${template.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-secret': adminSecret,
            },
            body: JSON.stringify({
              title: template.title,
              description: template.description,
              category: template.category,
              slides_count: template.slides_count,
              display_order: index,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update display order');
          }
        })
      );

      toast.success('순서가 저장되었습니다.');
    } catch (error) {
      console.error('Update order error:', error);
      toast.error('순서 저장에 실패했습니다.');
      // 실패 시 목록 다시 불러오기
      fetchTemplates();
    }
  };

  // 템플릿 삭제
  const handleDelete = async (templateId: string) => {
    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) {
      return;
    }

    const loadingToast = toast.loading('삭제 중...');
    try {
      const response = await fetch(`/api/admin/templates?id=${templateId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminSecret,
        },
      });

      if (response.ok) {
        toast.success('템플릿이 삭제되었습니다.', { id: loadingToast });
        fetchTemplates();
      } else {
        const data = await response.json();
        toast.error(data.error || '삭제에 실패했습니다.', { id: loadingToast });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('삭제 중 오류가 발생했습니다.', { id: loadingToast });
    }
  };

  return (
    <main className="flex-1 p-8">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            템플릿 관리
          </h1>
          <p className="text-gray-600">PPTX 템플릿을 업로드하고 관리합니다.</p>
        </div>

        {/* 업로드 폼 */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            새 템플릿 업로드
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  템플릿 제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: 우리 고장의 모습 - 기본형"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="예: 역사/문화, 관광, 경제"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명 *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder="템플릿에 대한 설명을 입력하세요"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  슬라이드 개수 *
                </label>
                <input
                  type="number"
                  value={slidesCount}
                  onChange={(e) => setSlidesCount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="10"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PPTX 파일 *
                </label>
                <input
                  type="file"
                  accept=".pptx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  템플릿 업로드
                </>
              )}
            </button>
          </form>
        </div>

        {/* 템플릿 목록 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            등록된 템플릿 ({templates.length}개)
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">템플릿 목록을 불러오는 중...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              등록된 템플릿이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template, index) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-primary transition-colors"
                >
                  {/* 순서 조정 버튼 */}
                  <div className="flex flex-col gap-1 mr-3">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                      }`}
                      title="위로 이동"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === templates.length - 1}
                      className={`p-1 rounded transition-colors ${
                        index === templates.length - 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                      }`}
                      title="아래로 이동"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>카테고리: {template.category}</span>
                      <span>슬라이드: {template.slides_count}장</span>
                      <span>
                        생성일: {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">템플릿 수정</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 제목 *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: 우리 고장의 모습 - 기본형"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="예: 역사/문화, 관광, 경제"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 *
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    placeholder="템플릿에 대한 설명을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    슬라이드 개수 *
                  </label>
                  <input
                    type="number"
                    value={editSlidesCount}
                    onChange={(e) => setEditSlidesCount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="10"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PPTX 파일 (선택사항 - 파일을 교체하려면 선택)
                  </label>
                  <input
                    type="file"
                    accept=".pptx"
                    onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {editFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      선택된 파일: {editFile.name}
                    </p>
                  )}
                  {editingTemplate && !editFile && (
                    <p className="mt-2 text-sm text-gray-500">
                      현재 파일: {editingTemplate.file_path}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    수정 완료
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
