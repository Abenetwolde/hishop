import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { Search as SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SearchProps {
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
}

export const Search: React.FC<SearchProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) return [];
      const { data, error } = await supabase
        .from('product')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: query.length > 2
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
        <input 
          type="text" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchProducts')}
          className="w-full pl-12 pr-4 py-4 bg-secondary-bg/50 border border-separator/30 rounded-2xl focus:ring-2 focus:ring-primary outline-hidden text-sm transition-all"
        />
      </div>

      <div className="px-1">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-secondary-bg/50 animate-pulse rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {results?.map(product => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        )}

        {query.length > 2 && !isLoading && results?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
            <div className="w-16 h-16 bg-secondary-bg/50 rounded-full flex items-center justify-center">
              <SearchIcon size={24} className="text-secondary opacity-30" />
            </div>
            <p className="text-secondary font-bold text-sm">No results for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
