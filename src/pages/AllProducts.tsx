import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';

interface AllProductsProps {
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
  categoryId?: number;
  categoryName?: string;
}

export const AllProducts: React.FC<AllProductsProps> = ({ onNavigate, categoryId, categoryName }) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['all-products', categoryId],
    queryFn: async () => {
      let query = supabase.from('product').select('*');
      if (categoryId) {
        query = query.eq('category', categoryId);
      } else {
        query = query.order('title', { ascending: true });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-secondary-bg animate-pulse rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{categoryName || 'All Products'}</h2>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-secondary">No products found.</div>
      )}
    </div>
  );
};
