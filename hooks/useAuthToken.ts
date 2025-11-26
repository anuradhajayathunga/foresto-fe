'use client';

import { useEffect, useState } from 'react';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('accessToken');
    setToken(t);
    setLoading(false);
  }, []);

  return { token, loading };
}
