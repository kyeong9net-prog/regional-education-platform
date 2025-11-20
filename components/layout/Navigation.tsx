'use client';

import Link from 'next/link';
import { Home, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/workspace', icon: FileText, label: '수업자료 생성' },
  ];

  return (
    <nav
      className="hidden md:block w-64 border-r bg-white dark:bg-gray-900 dark:border-gray-700 min-h-screen p-6"
      role="navigation"
      aria-label="사이드바 네비게이션"
    >
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isActive ? 'bg-secondary text-primary font-semibold' : ''
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
