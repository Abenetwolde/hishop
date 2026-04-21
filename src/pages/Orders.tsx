import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Clock, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedOrder, setExpandedOrder] = React.useState<number | null>(null);

  const cancelMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const { data, error } = await supabase
        .from('order')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order')
        .select('*, order_item(*, product(*))')
        .eq('user', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  if (isLoading) return <div className="space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-secondary-bg animate-pulse rounded-2xl" />)}
  </div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('myOrders')}</h2>
      <div className="space-y-4">
        {orders?.map(order => (
          <div key={order.id} className="bg-bg border border-separator/30 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
            <div 
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              className="p-5 space-y-4 cursor-pointer active:bg-secondary-bg/30 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">Order #{order.slug}</p>
                  <div className="flex items-center text-[10px] font-bold text-secondary uppercase tracking-tight">
                    <Clock size={12} className="mr-1.5 opacity-40" />
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  order.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                  order.status === 'cancelled' ? 'bg-error/10 text-error' :
                  'bg-primary/10 text-primary'
                }`}>
                  {t(order.status.toLowerCase())}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-3">
                  {order.order_item.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="w-10 h-10 rounded-full border-2 border-bg overflow-hidden shadow-sm">
                      <img 
                        src={item.product?.heroImage} 
                        className="w-full h-full object-cover" 
                        alt=""
                      />
                    </div>
                  ))}
                  {order.order_item.length > 4 && (
                    <div className="w-10 h-10 rounded-full border-2 border-bg bg-secondary-bg flex items-center justify-center text-[10px] font-black shadow-sm">
                      +{order.order_item.length - 4}
                    </div>
                  )}
                </div>
                {expandedOrder === order.id ? <ChevronUp size={18} className="text-secondary opacity-40" /> : <ChevronDown size={18} className="text-secondary opacity-40" />}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedOrder === order.id && (
              <div className="px-5 pb-5 pt-2 space-y-5 animate-in slide-in-from-top-4 duration-300">
                <div className="h-px bg-separator/30 w-full" />
                
                <div className="space-y-3">
                  {order.order_item.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-bg/50 p-1">
                          <img src={item.product?.heroImage} className="w-full h-full object-contain" alt="" />
                        </div>
                        <div>
                          <p className="text-xs font-bold line-clamp-1">{item.product?.title}</p>
                          <p className="text-[10px] font-bold text-secondary">{item.quantity} x {item.product?.price.toLocaleString()} ETB</p>
                        </div>
                      </div>
                      <span className="text-xs font-black">{(item.quantity * item.product?.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-secondary-bg/30 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-secondary">
                    <span>{t('total')}</span>
                    <span className="text-sm font-black text-primary">{order.totalPrice.toLocaleString()} ETB</span>
                  </div>
                </div>

                {order.status.toLowerCase() === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(t('confirmCancel'))) {
                        cancelMutation.mutate(order.id);
                      }
                    }}
                    disabled={cancelMutation.isPending}
                    className="w-full py-4 bg-error/10 text-error rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    <span>{t('cancelOrder')}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
