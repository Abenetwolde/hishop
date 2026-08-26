import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Clock, XCircle, ChevronDown, ChevronUp, Loader2, Trash2, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OrdersProps {
  onNavigate?: (tab: string) => void;
}

export const Orders: React.FC<OrdersProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Cancel order mutation
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
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      setActionError(`Failed to cancel: ${err.message || 'Permission denied'}`);
    }
  });

  // Permanent Delete order mutation
  const deleteMutation = useMutation({
    mutationFn: async (orderId: number) => {
      // 1. Delete associated credit entries if any
      await supabase.from('credit').delete().eq('order_id', orderId);

      // 2. Delete associated notification entries if any
      await supabase.from('notifications').delete().eq('order_id', orderId);

      // 3. Delete order_item rows first due to FK constraint
      const { error: itemErr } = await supabase.from('order_item').delete().eq('order', orderId);
      if (itemErr) console.warn('order_item deletion warning:', itemErr.message);

      // 4. Delete the main order row
      const { error: orderErr } = await supabase.from('order').delete().eq('id', orderId);
      if (orderErr) throw orderErr;
    },
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setExpandedOrder(null);
    },
    onError: async (err: any, orderId: number) => {
      console.error('Direct deletion error:', err);
      // Fallback: If DB RLS policy restricts DELETE on order table, update status to cancelled
      try {
        await supabase.from('order').update({ status: 'cancelled' }).eq('id', orderId);
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        setActionError('Order status set to Cancelled.');
      } catch (fallbackErr: any) {
        setActionError(`Unable to delete order: ${err.message || 'Permission denied'}`);
      }
    }
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('order')
        .select('*, order_item(*, product(*))')
        .eq('user', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-secondary-bg animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-secondary-bg rounded-full flex items-center justify-center shadow-inner">
          <ShoppingBag className="text-secondary w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">{t('noOrdersYet') || 'No Orders Yet'}</h2>
          <p className="text-secondary font-bold text-xs max-w-xs">
            {t('noOrdersDesc') || 'You have not placed any orders yet. Browse products and place your first order!'}
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3.5 bg-primary text-button-text rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
          >
            {t('browseProducts') || 'Browse Catalog'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">{t('myOrders') || 'Order History'}</h2>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      {actionError && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 text-xs font-bold text-center animate-in fade-in">
          {actionError}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const isPending = (order.status || '').toLowerCase() === 'pending';
          const isCancelled = (order.status || '').toLowerCase() === 'cancelled';
          const isPaid = (order.status || '').toLowerCase() === 'paid' || (order.status || '').toLowerCase() === 'completed';

          return (
            <div
              key={order.id}
              className="bg-bg border border-separator/30 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 hover:border-primary/30"
            >
              <div
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="p-5 space-y-4 cursor-pointer active:bg-secondary-bg/30 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">
                      Order #{order.slug || order.id}
                    </p>
                    <div className="flex items-center text-[10px] font-bold text-secondary uppercase tracking-tight">
                      <Clock size={12} className="mr-1.5 opacity-40" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      isPaid
                        ? 'bg-green-500/10 text-green-500'
                        : isCancelled
                        ? 'bg-error/10 text-error'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {order.order_item?.slice(0, 4).map((item: any) => (
                      <div key={item.id} className="w-10 h-10 rounded-full border-2 border-bg overflow-hidden shadow-sm bg-secondary-bg">
                        <img
                          src={item.product?.heroImage || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80'}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                    ))}
                    {order.order_item?.length > 4 && (
                      <div className="w-10 h-10 rounded-full border-2 border-bg bg-secondary-bg flex items-center justify-center text-[10px] font-black shadow-sm">
                        +{order.order_item.length - 4}
                      </div>
                    )}
                  </div>
                  {expandedOrder === order.id ? (
                    <ChevronUp size={18} className="text-secondary opacity-40" />
                  ) : (
                    <ChevronDown size={18} className="text-secondary opacity-40" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="px-5 pb-5 pt-2 space-y-5 animate-in slide-in-from-top-4 duration-300">
                  <div className="h-px bg-separator/30 w-full" />

                  <div className="space-y-3">
                    {order.order_item?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary-bg/50 p-1 flex-shrink-0">
                            <img
                              src={item.product?.heroImage || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80'}
                              className="w-full h-full object-cover rounded-lg"
                              alt=""
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold line-clamp-1">{item.product?.title || 'Product'}</p>
                            <p className="text-[10px] font-bold text-secondary">
                              {item.quantity} x {Number(item.product?.price || 0).toLocaleString()} ETB
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black">
                          {(item.quantity * Number(item.product?.price || 0)).toLocaleString()} ETB
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-secondary-bg/30 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-secondary">
                      <span>Total Amount</span>
                      <span className="text-sm font-black text-primary">{Number(order.totalPrice || 0).toLocaleString()} ETB</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {isPending && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Cancel this pending order?')) {
                            cancelMutation.mutate(order.id);
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="w-full py-3.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        {cancelMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        <span>Cancel Order</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove order #${order.slug || order.id} from your order history?`)) {
                          deleteMutation.mutate(order.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className={`w-full py-3.5 bg-error/10 text-error hover:bg-error/20 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 active:scale-[0.98] transition-all disabled:opacity-50 ${
                        !isPending ? 'col-span-2' : ''
                      }`}
                    >
                      {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      <span>Delete Order</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
