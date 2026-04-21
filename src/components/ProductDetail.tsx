import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShoppingCart, Minus, Plus, Share2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../store/cart-store';

interface Product {
  id: number;
  title: string;
  price: number;
  heroImage: string;
  description?: string;
  maxQuantity: number;
}

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose, onNavigate }) => {
  const { addItem, items, incrementItem, decrementItem } = useCartStore();
  const { t } = useTranslation();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  const cartItem = items.find(i => i.id === product.id);

  useEffect(() => {
    if (cartItem) {
      setAdded(true);
    }
  }, [cartItem]);

  const handleAddToCart = () => {
    addItem({ ...product, quantity, heroImage: product.heroImage });
    setAdded(true);
  };

  const handleGoToCheckout = () => {
    onNavigate('cart');
  };

  const handleIncrement = () => {
    if (!added) {
      setQuantity(q => Math.min(q + 1, product.maxQuantity));
    } else {
      incrementItem(product.id);
    }
  };

  const handleDecrement = () => {
    if (!added) {
      setQuantity(q => Math.max(q - 1, 1));
    } else {
      decrementItem(product.id);
    }
  };

  const displayQty = added ? (cartItem?.quantity ?? quantity) : quantity;

  if (!product) return null;

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text animate-in fade-in slide-in-from-right duration-300 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-bg/80 backdrop-blur-xl border-b border-separator/30">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-secondary-bg/50 rounded-2xl active:scale-90 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-bold truncate max-w-[200px]">{product.title}</h1>
        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 flex items-center justify-center bg-secondary-bg/50 rounded-2xl active:scale-90 transition-transform">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Product Image */}
        <div className="w-full aspect-square bg-secondary-bg relative overflow-hidden">
          <img
            src={product.heroImage}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <button 
            onClick={() => setIsLiked(!isLiked)}
            className="absolute bottom-4 right-4 w-12 h-12 bg-bg/60 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
          >
            <Heart size={24} className={isLiked ? "fill-red-500 text-red-500" : "text-text"} />
          </button>
        </div>

        {/* Content Details */}
        <div className="px-6 py-6 space-y-8">
          {/* Title & Price */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-lg">
                {t('premiumQuality')}
              </span>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                {t('inStock')}
              </span>
            </div>
            <h2 className="text-2xl font-black leading-tight">{product.title}</h2>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-primary">{product.price.toLocaleString()}</span>
              <span className="text-sm font-bold text-primary">ETB</span>
            </div>
          </div>

          <div className="h-px bg-separator/50 w-full" />

          {/* Quantity Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-secondary">{t('quantity')}</h3>
              <span className="text-xs font-bold text-secondary">{product.maxQuantity} {t('inStock')}</span>
            </div>
            <div className="flex items-center justify-between bg-secondary-bg/50 border border-separator/30 rounded-3xl p-2">
              <button
                onClick={handleDecrement}
                disabled={displayQty <= 1 && !added}
                className="w-14 h-14 rounded-2xl bg-bg border border-separator/50 shadow-sm flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
              >
                <Minus size={20} />
              </button>
              <span className="text-xl font-black w-12 text-center">{displayQty}</span>
              <button
                onClick={handleIncrement}
                disabled={displayQty >= product.maxQuantity}
                className="w-14 h-14 rounded-2xl bg-bg border border-separator/50 shadow-sm flex items-center justify-center active:scale-90 transition-all disabled:opacity-30"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-widest text-secondary">{t('productDetails')}</h3>
            </div>
            <p className="text-secondary text-sm leading-relaxed font-medium">
              {product.description || "Experience top-tier performance and style with this premium gadget. Engineered for excellence, it offers unmatched reliability and a sleek design inspired by modern tech trends. Ideal for daily use and professional tasks alike."}
            </p>
          </div>

          {/* Features / Specs placeholder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-secondary-bg/30 p-4 rounded-3xl border border-separator/20 space-y-1">
              <span className="text-[10px] font-bold text-secondary uppercase">{t('warranty')}</span>
              <span className="block text-sm font-bold">12 {t('months')}</span>
            </div>
            <div className="bg-secondary-bg/30 p-4 rounded-3xl border border-separator/20 space-y-1">
              <span className="text-[10px] font-bold text-secondary uppercase">{t('delivery')}</span>
              <span className="block text-sm font-bold">24-48 {t('hours')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-bg/60 backdrop-blur-3xl border-t border-separator/30 z-[60] max-w-lg mx-auto">
        {!added ? (
          <button
            onClick={handleAddToCart}
            className="w-full py-5 bg-primary text-button-text rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 flex items-center justify-center space-x-3 active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={22} className="stroke-[3]" />
            <span>{t('addToCart')}</span>
          </button>
        ) : (
          <button
            onClick={handleGoToCheckout}
            className="w-full py-5 bg-primary text-button-text rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/40 flex items-center justify-center space-x-3 active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={22} className="stroke-[3]" />
            <span>{t('checkout')}</span>
          </button>
        )}
      </div>
    </div>
  );
};
