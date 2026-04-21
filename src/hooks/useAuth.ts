import { useEffect, useState } from 'react';
import { retrieveLaunchParams, isTMA } from '@telegram-apps/sdk';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  type: 'USER' | 'ADMIN';
  avatar_url: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;

    const authenticate = async () => {
      try {
        let initDataRaw: string | undefined;

        // Method 1: SDK retrieveLaunchParams
        try {
          const lp = retrieveLaunchParams();
          initDataRaw = lp.initDataRaw as string;
        } catch (e) {
          // Ignore and try fallbacks
        }

        // Method 2: window.Telegram.WebApp.initData (The most classic and often robust)
        if (!initDataRaw) {
          initDataRaw = (window as any).Telegram?.WebApp?.initData;
        }

        // Method 3: Direct hash parsing
        if (!initDataRaw && window.location.hash) {
          const hashString = window.location.hash.slice(1);
          const params = new URLSearchParams(hashString);
          initDataRaw = params.get('tgWebAppData') || undefined;
          
          // Some environments put everything in the hash without the key
          if (!initDataRaw && hashString.includes('user=')) {
              initDataRaw = hashString;
          }
        }

        if (!initDataRaw && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying auth detection (${retryCount}/${maxRetries})...`);
          setTimeout(authenticate, 500);
          return;
        }

        if (!initDataRaw) {
          const isTmaEnv = await isTMA();
          setError(`No Telegram init data found.\nTMA Environment: ${isTmaEnv ? 'Yes' : 'No'}\nURL: ${window.location.href.split('#')[0]}`);
          setLoading(false);
          return;
        }

        console.log('Sending auth request to Edge Function...');
        const { data, error: funcError } = await supabase.functions.invoke('telegram-auth', {
          body: { initDataRaw }
        });

        if (funcError) {
          console.error('Edge Function error object:', funcError);
          let details = funcError.message;
          if ((funcError as any).context?.response) {
             const body = await (funcError as any).context.response.text();
             details += ` | Body: ${body}`;
          }
          throw new Error(`Edge Function error: ${details}`);
        }

        if (data?.token_hash && data?.type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: data.token_hash,
            type: data.type,
          });
          if (verifyError) throw verifyError;
          // Get metadata from auth user
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const meta = authUser?.user_metadata || {};
          setUser({ 
            ...data.user, 
            firstName: meta.full_name?.split(' ')[0] || undefined,
            lastName: meta.full_name?.split(' ').slice(1).join(' ') || undefined,
            username: meta.username || undefined
          });
        } else if (data?.session) {
          await supabase.auth.setSession(data.session);
          // Get metadata from session
          const meta = data.session?.user?.user_metadata || {};
          setUser({ 
            ...data.user, 
            firstName: meta.full_name?.split(' ')[0] || undefined,
            lastName: meta.full_name?.split(' ').slice(1).join(' ') || undefined,
            username: meta.username || undefined
          });
        } else {
          setError('Authentication failed: No session returned');
        }
      } catch (err: any) {
        console.error('Auth error:', err);
        setError(err.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    authenticate();
  }, []);

  return { user, loading, error };
};
