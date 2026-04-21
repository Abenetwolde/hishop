import React, { useState } from 'react';
import { useCartStore } from '../store/cart-store';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';
import { Trash2, Plus, Minus, ShoppingBag, Loader2, CheckCircle2, Wallet, Banknote, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PaymentBottomSheet } from '../components/PaymentBottomSheet';

interface CartProps {
  onNavigate: (tab: string) => void;
}

type PaymentMethod = 'CASH' | 'ONLINE';

export const Cart: React.FC<CartProps> = ({ onNavigate }) => {
  const { items, removeItem, incrementItem, decrementItem, getTotalPrice, getItemCount, resetCart } = useCartStore();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const totalAmount = parseFloat(getTotalPrice());

  const handleCheckoutClick = () => {
    if (paymentMethod === 'ONLINE') {
      setShowPaymentSheet(true);
    } else {
      processOrder();
    }
  };

  const processOrder = async (paymentData?: { reference: string; bank: string }) => {
    if (!user || items.length === 0) return;
    setLoading(true);
    setError(null);
    setShowPaymentSheet(false);

    try {
      const slug = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // 1. Create the order record
      const { data: order, error: orderErr } = await supabase
        .from('order')
        .insert({
          user: user.id,
          totalPrice: totalAmount,
          slug,
          status: paymentData ? 'PAID' : 'PENDING',
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Create order items
      const orderItems = items.map(item => ({
        order: order.id,
        product: item.id,
        quantity: item.quantity,
      }));

      const { error: itemsErr } = await supabase.from('order_item').insert(orderItems);
      if (itemsErr) throw itemsErr;

      // 3. Clear cart and show success
      resetCart();
      setOrderSuccess(true);

      // 4. Navigate to orders after a short delay
      setTimeout(() => {
        onNavigate('orders');
      }, 2000);

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center relative">
          <CheckCircle2 className="text-green-500 w-12 h-12" />
          <div className="absolute inset-0 rounded-full border-4 border-green-500/20 animate-ping" />
        </div>
        <h2 className="text-3xl font-black">{t('orderPlaced')}</h2>
        <p className="text-secondary font-bold text-sm max-w-[200px]">{t('orderProcessing')}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6 animate-in fade-in duration-300">
        <div className="w-24 h-24 bg-secondary-bg rounded-full flex items-center justify-center shadow-inner">
          <ShoppingBag className="text-secondary w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black">{t('bagEmpty')}</h2>
          <p className="text-secondary font-bold text-sm">{t('bagEmptyDesc')}</p>
        </div>
        <button 
          onClick={() => onNavigate('home')}
          className="px-8 py-4 bg-primary text-button-text rounded-2xl font-black text-sm active:scale-95 transition-transform"
        >
          {t('browseProducts')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-text">{t('shoppingBag')}</h2>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg">{getItemCount()} {t('items')}</span>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-bg border border-separator/30 rounded-3xl p-4 flex space-x-5 shadow-sm group hover:border-primary/30 transition-all">
            <div className="w-24 h-24 bg-secondary-bg rounded-2xl overflow-hidden flex-shrink-0 border border-separator/20">
              <img src={item.heroImage} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-black line-clamp-2 leading-tight">{item.title}</h3>
                  <button onClick={() => removeItem(item.id)} className="text-error/40 hover:text-error active:scale-90 transition-all ml-2">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-primary font-black text-base">{item.price.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-primary">ETB</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 bg-secondary-bg/50 rounded-xl px-3 py-1">
                  <button onClick={() => decrementItem(item.id)} className="text-secondary active:scale-75 transition-transform"><Minus size={14} /></button>
                  <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => incrementItem(item.id)} className="text-secondary active:scale-75 transition-transform"><Plus size={14} /></button>
                </div>
                <p className="text-[10px] font-black text-secondary uppercase tracking-tight">Total: {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-widest text-secondary">{t('accountInfo')}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPaymentMethod('CASH')}
            className={`p-4 rounded-3xl border-2 flex flex-col items-center space-y-2 transition-all ${
              paymentMethod === 'CASH' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-separator/30 bg-bg'
            }`}
          >
            <Banknote size={24} className={paymentMethod === 'CASH' ? 'text-primary' : 'text-secondary'} />
            <span className={`text-[10px] font-black uppercase tracking-tight ${paymentMethod === 'CASH' ? 'text-primary' : 'text-secondary'}`}>{t('cashOnDelivery')}</span>
          </button>
          <button
            onClick={() => setPaymentMethod('ONLINE')}
            className={`p-4 rounded-3xl border-2 flex flex-col items-center space-y-2 transition-all ${
              paymentMethod === 'ONLINE' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-separator/30 bg-bg'
            }`}
          >
            <Wallet size={24} className={paymentMethod === 'ONLINE' ? 'text-primary' : 'text-secondary'} />
            <span className={`text-[10px] font-black uppercase tracking-tight ${paymentMethod === 'ONLINE' ? 'text-primary' : 'text-secondary'}`}>{t('payOnline')}</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-secondary-bg/50 rounded-[2.5rem] p-8 space-y-6 shadow-inner border border-separator/20">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-secondary font-bold text-sm">
            <span>{t('subtotal')}</span>
            <span>{totalAmount.toLocaleString()} ETB</span>
          </div>
          <div className="flex justify-between items-center text-secondary font-bold text-sm">
            <span>{t('platformFee')}</span>
            <span>0.00 ETB</span>
          </div>
          <div className="h-px bg-separator/50 w-full my-2" />
          <div className="flex justify-between items-center text-xl font-black">
            <span>{t('total')}</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-primary">{totalAmount.toLocaleString()}</span>
              <span className="text-xs text-primary">ETB</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-error text-xs font-bold text-center bg-error/10 rounded-2xl p-4 animate-in shake duration-300">{error}</p>
        )}

        <div className="space-y-4">
          <button
            onClick={handleCheckoutClick}
            disabled={loading}
            className="w-full py-5 bg-primary text-button-text rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>{t('verifying')}</span>
              </>
            ) : (
              <>
                {paymentMethod === 'ONLINE' ? <ShieldCheck size={24} /> : <CheckCircle2 size={24} />}
                <span>{paymentMethod === 'ONLINE' ? t('payAndOrder') : t('orderNow')}</span>
              </>
            )}
          </button>
          <p className="text-[10px] font-bold text-secondary text-center uppercase tracking-widest leading-relaxed">
            {t('agreeTerms')}
          </p>
        </div>
      </div>

      {showPaymentSheet && (
        <PaymentBottomSheet 
          totalAmount={totalAmount}
          onClose={() => setShowPaymentSheet(false)}
          onPaymentVerified={(data) => processOrder(data)}
        />
      )}
    </div>
  );
};
