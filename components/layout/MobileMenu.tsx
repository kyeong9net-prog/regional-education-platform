'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, FileText } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isAdminMode = pathname?.startsWith('/admin');

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const mainNav = [
    { href: '/', label: '자료 생성 모드', isActive: !isAdminMode },
    { href: '/admin/templates', label: '템플릿 공유 모드', isActive: isAdminMode },
  ];

  const sideNav = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/workspace', icon: FileText, label: '수업자료 생성' },
  ];

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" aria-hidden="true" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" aria-hidden="true" />
        )}
      </button>

      {/* 모바일 메뉴 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* 모바일 메뉴 패널 */}
      <div
        id="mobile-menu"
        className={`fixed top-0 right-0 z-50 h-full w-64 bg-white dark:bg-gray-900 shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="모바일 메뉴"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          {/* 메뉴 헤더 */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">메뉴</h2>
            <button
              onClick={closeMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="메뉴 닫기"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" aria-hidden="true" />
            </button>
          </div>

          {/* 메인 네비게이션 */}
          <nav className="p-4 border-b dark:border-gray-700" aria-label="주 메뉴">
            <ul className="space-y-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={`block px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      item.isActive
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    aria-current={item.isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 사이드 네비게이션 */}
          <nav className="flex-1 p-4 overflow-y-auto" aria-label="페이지 메뉴">
            <ul className="space-y-2">
              {sideNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                        isActive
                          ? 'bg-secondary text-primary font-semibold'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
