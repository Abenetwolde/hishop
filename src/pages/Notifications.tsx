import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/AuthProvider';
import { Bell, Info } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { user } = useAuth();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  if (isLoading) return <div className="space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-secondary-bg animate-pulse rounded-2xl" />)}
  </div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notifications</h2>
      <div className="space-y-4">
        {notifications?.length === 0 ? (
          <div className="text-center py-20 text-secondary">
            No notifications yet
          </div>
        ) : (
          notifications?.map(note => (
            <div key={note.id} className="bg-bg border border-separator rounded-2xl p-4 shadow-sm flex space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Bell size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold">{note.title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{note.body}</p>
                <p className="text-[10px] text-secondary font-medium pt-1">
                  {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
