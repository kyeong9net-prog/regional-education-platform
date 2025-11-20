import { Clock, CheckCircle } from 'lucide-react';
import type { VersionHistoryEntry } from '@/types';

interface TemplateVersionHistoryProps {
  versionHistory?: VersionHistoryEntry[];
  currentVersion: string;
}

export default function TemplateVersionHistory({
  versionHistory = [],
  currentVersion,
}: TemplateVersionHistoryProps) {
  if (versionHistory.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        버전 히스토리가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">버전 히스토리</h4>

      <div className="relative">
        {/* 타임라인 선 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {versionHistory.map((entry, index) => (
            <div key={index} className="relative pl-12">
              {/* 타임라인 점 */}
              <div className={`absolute left-2 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                entry.version === currentVersion
                  ? 'bg-primary'
                  : 'bg-gray-300'
              }`}>
                {entry.version === currentVersion && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                entry.version === currentVersion
                  ? 'border-primary bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      entry.version === currentVersion
                        ? 'text-primary'
                        : 'text-gray-900'
                    }`}>
                      버전 {entry.version}
                    </span>
                    {entry.version === currentVersion && (
                      <span className="px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                        현재
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{entry.date}</span>
                  </div>
                </div>

                <ul className="space-y-1">
                  {entry.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
