import React from 'react';
import { useTranslation } from 'react-i18next';

interface Product {
  id: number;
  title: string;
  price: number;
  heroImage: string;
  maxQuantity: number;
}

interface ProductCardProps {
  product: Product;
  onNavigate: (tab: string, params?: Record<string, unknown>) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { t } = useTranslation();
  return (
    <div
      onClick={() => onNavigate('product-detail', { product })}
      className="bg-bg border border-separator rounded-2xl overflow-hidden shadow-sm flex flex-col group active:scale-[0.98] transition-transform duration-200 cursor-pointer"
    >
      <div className="aspect-[4/5] bg-secondary-bg overflow-hidden relative">
        <img
          src={product.heroImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2 bg-bg/80 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm">
          {t('new')}
        </div>
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold text-text line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className="text-primary font-bold text-sm mt-1">{product.price.toLocaleString()} ETB</p>
        </div>
        <div className="pt-2 flex items-center justify-between border-t border-separator/50">
          <span className="text-[10px] text-secondary font-medium">{t('stock')}: {product.maxQuantity}</span>
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
