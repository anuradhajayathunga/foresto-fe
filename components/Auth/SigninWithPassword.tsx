'use client';
import { EmailIcon, PasswordIcon } from '@/assets/icons';
import Link from 'next/link';
import InputGroup from '../FormElements/InputGroup';
import { Checkbox } from '../FormElements/checkbox';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, TokenResponse } from '@/lib/api';

export default function SigninWithPassword() {
  const router = useRouter();
  const [error, setError] = useState('');

  const [form, setData] = useState({
    email: process.env.NEXT_PUBLIC_DEMO_USER_MAIL || '',
    password: process.env.NEXT_PUBLIC_DEMO_USER_PASS || '',
    remember: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();

  //   // You can remove this code block
  //   setLoading(true);

  //   setTimeout(() => {
  //     setLoading(false);
  //   }, 1000);
  // };

  // function handleChange(e: ChangeEvent<HTMLInputElement>) {
  //   setForm({ ...form, [e.target.name]: e.target.value });
  // }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 1000);

    try {
      const data = await apiPost<TokenResponse>('/api/token/', form);
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);

      router.push('profile');
    } catch (err: any) {
      setError(err.message);
    }
  }
  useEffect(() => {
    if (localStorage.getItem('access')) router.replace('/profile');
  }, [router]);

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        type='email'
        label='Email'
        className='mb-4 [&_input]:py-[15px]'
        placeholder='you@example.com'
        name='email'
        handleChange={handleChange}
        value={form.email}
        // icon={<EmailIcon />}
      />

      <InputGroup
        type='password'
        label='Password'
        className='mb-5 [&_input]:py-[15px]'
        placeholder='••••••••'
        name='password'
        handleChange={handleChange}
        value={form.password}
        // icon={<PasswordIcon />}
      />

      <div className='mb-6 flex items-center justify-between gap-2 pb-2 text-sm font-medium'>
        <Checkbox
          label='Remember me'
          name='remember'
          withIcon='check'
          minimal
          radius='md'
          // onChange={(e) =>
          //   setData({
          //     ...form,
          //     remember: e.target.checked,
          //   })
          // }
        />

        <Link
          href='/auth/forgot-password'
          className='text-xs hover:text-primary dark:text-white dark:hover:text-primary'
        >
          Forgot Password?
        </Link>
      </div>

      <div className='mb-4.5'>
        <button
          type='submit'
          className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90'
        >
          Sign In
          {loading && (
            <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent' />
          )}
        </button>
      </div>
    </form>
  );
}
