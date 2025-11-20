import Link from 'next/link';
import { ArrowRight, Book, MapPin, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '홈',
  description: '초등학교 3학년 사회과 지역화 단원 수업자료를 AI로 자동 생성. 클릭 한 번으로 교실이 우리 지역 교과서로 바뀝니다.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            LLM기반 초등학교 3학년<br />사회과 지역화 단원 수업자료 생성기
          </h1>
          <p className="text-lg text-gray-500 mb-12">
            초등학교 3학년 사회과 지역화 단원을 위한 맞춤형 수업자료를 자동으로 생성합니다.
            <br />
            지역과 템플릿만 선택하면 PPT 수업 자료가 완성됩니다.
          </p>

          <Link
            href="/workspace"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            바로 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">간편한 사용</h3>
            <p className="text-gray-600">
              지역과 템플릿만 선택하면 끝. 학교명이나 복잡한 설정 없이 바로 생성됩니다.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">스마트 이미지 처리</h3>
            <p className="text-gray-600">
              실사 사진을 우선 검색하고, 없으면 자동으로 일러스트로 대체합니다.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Book className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">품질 표준화</h3>
            <p className="text-gray-600">
              검증된 템플릿으로 전국 단위의 수업자료 품질을 보장합니다.
            </p>
          </div>
        </div>

        {/* Footer - Copyright */}
        <footer className="mt-24 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              © 2024 <span className="font-semibold text-gray-900">hyunneey</span>. All rights reserved.
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Regional Education Platform
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
