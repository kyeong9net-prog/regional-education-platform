import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'LLM기반 초등학교 3학년 사회과 지역화 단원 수업자료 생성 서비스',
    template: '%s | 사회과 수업자료 서비스',
  },
  description: '초등학교 3학년 사회과 지역화 교과서 수업자료를 AI로 자동 생성하는 서비스. 226개 지역별 맞춤 PPT 제작.',
  keywords: ['초등학교', '3학년', '사회과', '지역화', '수업자료', 'PPT', '교사', '교육'],
  authors: [{ name: '사회과 수업자료 서비스' }],
  creator: '사회과 수업자료 서비스',
  publisher: '사회과 수업자료 서비스',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://example.com',
    title: 'LLM기반 초등학교 3학년 사회과 지역화 단원 수업자료 서비스',
    description: '초등학교 3학년 사회과 지역화 교과서 수업자료를 AI로 자동 생성하는 서비스',
    siteName: '사회과 수업자료 서비스',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LLM기반 초등학교 3학년 사회과 지역화 단원 수업자료 서비스',
    description: '초등학교 3학년 사회과 지역화 교과서 수업자료를 AI로 자동 생성하는 서비스',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="antialiased font-sans">
        <ErrorBoundary>
          <Header />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
