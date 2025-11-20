/**
 * Phase 7: 다크 모드 관리 훅
 */

import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드 시 localStorage와 시스템 설정 확인
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');

    if (stored !== null) {
      // localStorage에 저장된 값이 있으면 사용
      const isDarkMode = stored === 'true';
      setIsDark(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      }
    } else {
      // 시스템 설정 확인
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }

    setIsLoaded(true);
  }, []);

  // 다크 모드 토글
  const toggle = () => {
    setIsDark((prev) => {
      const newValue = !prev;

      // DOM 업데이트
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // localStorage 저장
      localStorage.setItem('darkMode', String(newValue));

      return newValue;
    });
  };

  // 다크 모드 설정
  const setDarkMode = (value: boolean) => {
    setIsDark(value);

    // DOM 업데이트
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // localStorage 저장
    localStorage.setItem('darkMode', String(value));
  };

  return {
    isDark,
    isLoaded,
    toggle,
    setDarkMode,
  };
}
