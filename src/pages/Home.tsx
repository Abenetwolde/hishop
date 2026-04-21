import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { ProductCard } from '../components/ProductCard';
import { Search, Bell } from 'lucide-react';

interface HomeProps {
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('category').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: latestProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['latest-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    }
  });

  // Most ordered: join order_item and group by product
  const { data: mostOrdered } = useQuery({
    queryKey: ['most-ordered'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_item')
        .select('product, product!inner(*)')
        .limit(100);
      if (error) throw error;

      const counts: Record<number, { count: number; product: any }> = {};
      data?.forEach((item: any) => {
        const pid = item.product?.id;
        if (!pid) return;
        if (!counts[pid]) counts[pid] = { count: 0, product: item.product };
        counts[pid].count++;
      });

      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map(c => c.product);
    }
  });

  if (categoriesLoading || productsLoading) {
    return (
      <div className="space-y-4 p-5">
        <div className="h-8 bg-secondary-bg animate-pulse rounded-xl w-48" />
        <div className="h-12 bg-secondary-bg animate-pulse rounded-2xl" />
        <div className="flex space-x-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => <div key={i} className="flex-shrink-0 w-16 h-20 bg-secondary-bg animate-pulse rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-secondary-bg animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header & Search */}
      <div className="p-5 space-y-6">
        <div className="flex items-center justify-center">
          <div>
            <p className="text-secondary text-[10px] font-black uppercase tracking-widest opacity-60">{t('welcome')}</p>
            <h2 className="text-xl font-black">{user?.firstName ? t('greeting', { userName: user.firstName }) : t('welcome')}</h2>
          </div>
          {/* <button onClick={() => onNavigate('notifications')} className="w-12 h-12 bg-secondary-bg/50 rounded-2xl flex items-center justify-center relative active:scale-90 transition-transform">
            <Bell size={20} className="text-text" />
            <div className="absolute top-3.5 right-3.5 w-2 h-2 bg-primary rounded-full border-2 border-bg" />
          </button> */}
        </div>

        {/* Search Bar */}
        <div 
          onClick={() => onNavigate('search')}
          className="bg-secondary-bg/50 border border-separator/30 rounded-2xl px-5 py-4 flex items-center space-x-4 active:scale-[0.98] transition-all cursor-pointer group"
        >
          <Search size={18} className="text-secondary group-hover:text-primary transition-colors" />
          <span className="text-secondary/60 text-sm font-bold uppercase tracking-widest">{t('searchProducts')}</span>
        </div>
      </div>

      <div className="px-5 space-y-8">
        {/* Categories */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* <div className="w-1.5 h-6 bg-primary rounded-full" /> */}
              <h2 className="text-sm font-black  tracking-[0.2em]">{t('categories')}</h2>
            </div>
            <button onClick={() => onNavigate('search')} className="text-[10px] font-black text-primary  tracking-widest hover:opacity-70">
              {t('viewMore')}
            </button>
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories?.map(category => (
              <button
                key={category.id}
                onClick={() => onNavigate('category', { categoryId: category.id, categoryName: category.name })}
                className="flex-shrink-0 flex flex-col items-center space-y-3 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-secondary-bg border border-separator/30 p-1 overflow-hidden shadow-sm">
                  <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover rounded-[1.2rem]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-secondary">{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Most Ordered */}
        {mostOrdered && mostOrdered.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* <div className="w-1.5 h-6 bg-primary rounded-full" /> */}
                <h2 className="text-sm font-black  tracking-[0.2em]">{t('mostOrdered')}</h2>
              </div>
              <button className="text-[10px] font-black text-primary  tracking-widest hover:opacity-70">
                {t('viewMore')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {mostOrdered.map((product: any) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        )}

        {/* Latest Products */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em]">Latest Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {latestProducts?.map(product => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
