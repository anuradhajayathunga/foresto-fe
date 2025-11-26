'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, User } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access');

    if (!token) {
      router.replace('/login');
      return;
    }
    console.log('Access token:', token);

    // 👉 Now TypeScript knows this is a real string
    const safeToken: string = token;

    async function loadUser() {
      try {
        const data = await apiGet<User>('/api/me/', safeToken);
        setUser(data);
      } catch {
        setError('Session expired. Please log in again.');
        localStorage.clear();
        router.replace('/auth/sign-in');
      }
    }

    loadUser();
  }, [router]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <h1>Your Profile</h1>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Username:</strong> {user.username}
      </p>
      <p>
        <strong>Name:</strong> {user.first_name} {user.last_name}
      </p>

      <button
        onClick={() => {
          localStorage.clear();
          router.push('/auth/signin');
        }}
      >
        Logout
      </button>
    </div>
  );
}
