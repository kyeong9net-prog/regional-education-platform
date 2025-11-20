'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileMenu from './MobileMenu';
import DarkModeToggle from '@/components/common/DarkModeToggle';

export default function Header() {
  const pathname = usePathname();
  const isAdminMode = pathname?.startsWith('/admin');

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-700" role="banner">
      <div className="container mx-auto px-4 md:px-7 py-4 md:py-7 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-base md:text-xl font-bold text-primary leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
          aria-label="홈으로 이동 - LLM기반 초등학교 3학년 사회과 지역화 단원 수업자료 생성기"
        >
          <span className="hidden lg:inline">LLM기반 초등학교 3학년 사회과 지역화 단원 수업자료 생성기</span>
          <span className="lg:hidden">사회과 수업자료 생성기</span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="flex items-center gap-6" role="navigation" aria-label="주 메뉴">
            <Link
              href="/"
              className={`text-sm font-medium hover:text-primary transition-colors leading-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1 ${
                !isAdminMode ? 'text-primary font-semibold' : 'text-muted-foreground dark:text-gray-200'
              }`}
              aria-current={!isAdminMode ? 'page' : undefined}
            >
              자료생성
            </Link>
            <Link
              href="/admin/templates"
              className={`text-sm font-medium hover:text-primary transition-colors leading-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm px-2 py-1 ${
                isAdminMode ? 'text-primary font-semibold' : 'text-muted-foreground dark:text-gray-200'
              }`}
              aria-current={isAdminMode ? 'page' : undefined}
            >
              템플릿 공유 모드
            </Link>
          </nav>
          <DarkModeToggle />
        </div>

        {/* 모바일: 다크모드 토글 + 메뉴 버튼 */}
        <div className="flex md:hidden items-center gap-2">
          <DarkModeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
