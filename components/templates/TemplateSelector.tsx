'use client';

import { useState } from 'react';
import { FileText, Check } from 'lucide-react';
import type { Template } from '@/lib/supabase/types';

interface TemplateSelectorProps {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelect: (template: Template) => void;
}

export default function TemplateSelector({ templates, selectedTemplateId, onSelect }: TemplateSelectorProps) {
  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-primary text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  {isSelected ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold mb-1 ${
                    isSelected ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {template.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
          등록된 템플릿이 없습니다.
        </div>
      )}
    </div>
  );
}
