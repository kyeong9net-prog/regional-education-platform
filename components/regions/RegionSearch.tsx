'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface RegionSearchProps {
  onSearch: (query: string) => void;
}

export default function RegionSearch({ onSearch }: RegionSearchProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      <input
        type="text"
        placeholder="지역명을 검색하세요 (예: 강남구, 해운대구)"
        value={query}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>
  );
}
