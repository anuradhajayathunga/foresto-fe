'use client';

import { EmailIcon, PasswordIcon, UserIcon } from '@/assets/icons';
import InputGroup from '../FormElements/InputGroup';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost, User } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SigninWithPassword() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiPost<User>('/api/register/', form);
      toast.success('Created account successfully.');
      router.push('signin');
    } catch (err: any) {
      const msg = err.message || 'Something went wrong';
      toast.error(`failed:${msg}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('access')) {
      router.replace('/profile');
    }
  }, [router]);

  return (
    <div className='w-full'>
      {/* Error message */}
      {error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700'>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          <InputGroup
            type='text'
            label='First Name'
            className='[&_input]:py-[11px]'
            placeholder='John'
            name='first_name' // ✅ matches state
            handleChange={handleChange}
            value={form.first_name}
            // icon={<UserIcon />}
          />
          <InputGroup
            type='text'
            label='Last Name'
            className='[&_input]:py-[11px]'
            placeholder='Doe'
            name='last_name' // ✅ matches state
            handleChange={handleChange}
            value={form.last_name}
            // icon={<UserIcon />}
          />
        </div>

        <InputGroup
          type='email'
          label='Email'
          className='[&_input]:py-[11px]'
          placeholder='you@example.com'
          name='email'
          handleChange={handleChange}
          value={form.email}
          // icon={<EmailIcon />}
          required
        />

        <InputGroup
          type='text'
          label='Username'
          className='[&_input]:py-[11px]'
          placeholder='yourusername'
          name='username'
          handleChange={handleChange}
          value={form.username}
          // icon={<UserIcon />}
        />

        <InputGroup
          type='password'
          label='Password'
          className='[&_input]:py-[11px]'
          placeholder='••••••••'
          name='password'
          handleChange={handleChange}
          value={form.password}
          // icon={<PasswordIcon />}
        />

        {/* Submit */}
        <div className='mb-4.5 mt-6'>
          <button
            type='submit'
            disabled={loading}
            className='flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90'
          >
            {loading ? 'Creating account...' : 'Sign up'}
            {loading && (
              <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-primary dark:border-t-transparent' />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
