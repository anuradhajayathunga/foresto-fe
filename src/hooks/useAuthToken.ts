'use client';

import { useEffect, useState } from 'react';
import { getMe, clearTokens } from '@/lib/auth';

export type User = {
  id: number;
  username: string;
  email: string;
  role?: string;
  first_name?: string;
  last_name?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await getMe();
        if (!mounted) return;
        setUser(me as User);
      } catch {
        clearTokens();
        if (!mounted) return;
        setUser(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { user, loading };
}
