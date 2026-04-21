import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Users, ShoppingBag, Package, TrendingUp } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: ordersCount } = await supabase.from('order').select('*', { count: 'exact', head: true });
      const { count: productsCount } = await supabase.from('product').select('*', { count: 'exact', head: true });
      return { users: usersCount, orders: ordersCount, products: productsCount };
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-secondary text-sm">Overview of your shop activity</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<Users className="text-blue-500" />} label="Users" value={stats?.users || 0} />
        <StatCard icon={<ShoppingBag className="text-green-500" />} label="Orders" value={stats?.orders || 0} />
        <StatCard icon={<Package className="text-purple-500" />} label="Products" value={stats?.products || 0} />
        <StatCard icon={<TrendingUp className="text-orange-500" />} label="Growth" value="+12%" />
      </div>

      <div className="bg-bg border border-separator rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold">Recent Activity</h3>
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-secondary-bg flex items-center justify-center text-xs font-bold">U{i}</div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-text">New order placed</p>
                        <p className="text-[10px] text-secondary">2 hours ago</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <div className="bg-bg border border-separator rounded-2xl p-4 space-y-3 shadow-sm hover:border-primary transition-colors">
    <div className="w-10 h-10 rounded-xl bg-secondary-bg flex items-center justify-center">{icon}</div>
    <div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[10px] text-secondary font-bold uppercase tracking-tight">{label}</p>
    </div>
  </div>
);
