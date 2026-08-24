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
    const maxRetries = 5;

    const authenticate = async () => {
      try {
        // Step 1: Check existing Supabase session first (prevents auth failure on page reload)
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession?.user) {
          const authUser = existingSession.user;
          const meta = authUser.user_metadata || {};

          // Fetch profile details from users table if available
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle();

          setUser({
            id: profile?.id || authUser.id,
            email: profile?.email || authUser.email || '',
            type: profile?.type || 'USER',
            avatar_url: profile?.avatar_url || meta.avatar_url || '',
            firstName: meta.full_name?.split(' ')[0] || meta.firstName || 'User',
            lastName: meta.full_name?.split(' ').slice(1).join(' ') || meta.lastName,
            username: meta.username || meta.telegram_id?.toString()
          });
          setLoading(false);
          return;
        }

        // Step 2: Extract Telegram initDataRaw
        let initDataRaw: string | undefined;

        try {
          const lp = retrieveLaunchParams();
          initDataRaw = lp.initDataRaw as string;
        } catch (e) {
          // Ignore SDK errors and try fallbacks
        }

        if (!initDataRaw) {
          initDataRaw = (window as any).Telegram?.WebApp?.initData;
        }

        if (!initDataRaw && window.location.hash) {
          const hashString = window.location.hash.slice(1);
          const params = new URLSearchParams(hashString);
          initDataRaw = params.get('tgWebAppData') || undefined;

          if (!initDataRaw && hashString.includes('user=')) {
            initDataRaw = hashString;
          }
        }

        if (!initDataRaw && retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying Telegram auth detection (${retryCount}/${maxRetries})...`);
          setTimeout(authenticate, 400);
          return;
        }

        if (!initDataRaw) {
          const isTmaEnv = await isTMA();
          setError(`No Telegram init data found.\nTMA Environment: ${isTmaEnv ? 'Yes' : 'No'}`);
          setLoading(false);
          return;
        }

        // Step 3: Call Edge Function to authenticate Telegram initData
        console.log('Sending auth request to Edge Function...');
        const { data, error: funcError } = await supabase.functions.invoke('telegram-auth', {
          body: { initDataRaw }
        });

        if (funcError) {
          console.error('Edge Function error object:', funcError);
          let details = funcError.message;
          if ((funcError as any).context?.response) {
            try {
              const bodyText = await (funcError as any).context.response.text();
              const parsed = JSON.parse(bodyText);
              details = parsed.error || parsed.details || bodyText;
            } catch {
              // Non-JSON body
            }
          }
          throw new Error(details || 'Edge Function authentication failed');
        }

        if (data?.session) {
          await supabase.auth.setSession(data.session);
          const meta = data.session?.user?.user_metadata || {};
          setUser({
            ...data.user,
            firstName: meta.full_name?.split(' ')[0] || undefined,
            lastName: meta.full_name?.split(' ').slice(1).join(' ') || undefined,
            username: meta.username || undefined
          });
        } else if (data?.token_hash && data?.type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: data.token_hash,
            type: data.type,
          });
          if (verifyError) throw verifyError;
          const { data: { user: authUser } } = await supabase.auth.getUser();
          const meta = authUser?.user_metadata || {};
          setUser({
            ...data.user,
            firstName: meta.full_name?.split(' ')[0] || undefined,
            lastName: meta.full_name?.split(' ').slice(1).join(' ') || undefined,
            username: meta.username || undefined
          });
        } else {
          setError('Authentication failed: No session returned from server');
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
