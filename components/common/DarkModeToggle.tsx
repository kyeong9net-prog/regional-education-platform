'use client';

import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/lib/hooks/useDarkMode';

export default function DarkModeToggle() {
  const { isDark, isLoaded, toggle } = useDarkMode();

  // 로딩 중일 때는 빈 div 반환 (깜빡임 방지)
  if (!isLoaded) {
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      aria-pressed={isDark}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500" aria-hidden="true" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" aria-hidden="true" />
      )}
    </button>
  );
}
