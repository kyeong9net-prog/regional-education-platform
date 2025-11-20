'use client';

import { useState } from 'react';
import { Upload, Plus, X } from 'lucide-react';
import type { TemplateVariable } from '@/types';

interface TemplateFormProps {
  onSubmit: (data: TemplateFormData) => void;
  onCancel: () => void;
}

export interface TemplateFormData {
  title: string;
  description: string;
  version: string;
  file: File | null;
  // Phase 3: 확장된 필드
  category: string;
  tags: string;
  usageGuide: string;
  slideCount: number;
  variables: TemplateVariable[];
}

export default function TemplateForm({ onSubmit, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    description: '',
    version: '1.0',
    file: null,
    category: '기본',
    tags: '',
    usageGuide: '',
    slideCount: 10,
    variables: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const addVariable = () => {
    setFormData({
      ...formData,
      variables: [...formData.variables, { key: '', label: '', description: '' }],
    });
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: string) => {
    const newVariables = [...formData.variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setFormData({ ...formData, variables: newVariables });
  };

  const removeVariable = (index: number) => {
    const newVariables = formData.variables.filter((_, i) => i !== index);
    setFormData({ ...formData, variables: newVariables });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white border rounded-lg space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        새 템플릿 등록
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          템플릿 제목
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="예: 우리 고장의 모습 - 기본형"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          설명
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          placeholder="템플릿에 대한 설명을 입력하세요"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          버전
        </label>
        <input
          type="text"
          value={formData.version}
          onChange={(e) => setFormData({ ...formData, version: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="1.0"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="기본">기본</option>
            <option value="심화">심화</option>
            <option value="특화">특화</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            슬라이드 수
          </label>
          <input
            type="number"
            min="1"
            value={formData.slideCount}
            onChange={(e) => setFormData({ ...formData, slideCount: parseInt(e.target.value) || 10 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="예: 3학년, 1학기, 우리고장"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          사용 가이드
        </label>
        <textarea
          value={formData.usageGuide}
          onChange={(e) => setFormData({ ...formData, usageGuide: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          placeholder="템플릿 사용 방법 및 적용 예시를 입력하세요"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            템플릿 변수
          </label>
          <button
            type="button"
            onClick={addVariable}
            className="flex items-center gap-1 px-3 py-1 text-sm text-primary hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            변수 추가
          </button>
        </div>
        <div className="space-y-3">
          {formData.variables.map((variable, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="변수 키 (예: {{지역명}})"
                />
                <input
                  type="text"
                  value={variable.label}
                  onChange={(e) => updateVariable(index, 'label', e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="변수 이름"
                />
                <button
                  type="button"
                  onClick={() => removeVariable(index)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={variable.description || ''}
                onChange={(e) => updateVariable(index, 'description', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="변수 설명 (선택사항)"
              />
            </div>
          ))}
          {formData.variables.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              변수를 추가하여 템플릿 커스터마이징을 설정하세요
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PPTX 파일 업로드
        </label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm">파일 선택</span>
            <input
              type="file"
              accept=".pptx"
              onChange={handleFileChange}
              className="hidden"
              required
            />
          </label>
          {formData.file && (
            <span className="text-sm text-gray-600">{formData.file.name}</span>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          등록하기
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}
