'use client';

import Link from 'next/link';
import { FileText, BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AdminNavigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/templates', icon: FileText, label: '템플릿 관리' },
    { href: '/admin/stats', icon: BarChart3, label: '통계' },
  ];

  return (
    <nav
      className="hidden md:block w-64 border-r bg-white dark:bg-gray-900 dark:border-gray-700 min-h-screen p-6"
      role="navigation"
      aria-label="관리자 메뉴"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">관리자 메뉴</h2>
      </div>
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isActive ? 'bg-secondary text-primary font-semibold' : 'text-gray-800 dark:text-gray-100'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-gray-700 dark:text-gray-300 group-hover:text-primary'}`} aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
