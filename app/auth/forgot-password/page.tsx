// components/Auth/ForgotPassword.tsx
'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      // TODO: Replace this with your actual forgot-password API / server action
      // await forgotPasswordAction(email);

      // For now, just show a success message
      setMessage(
        'If an account exists for this email, we’ve sent a password reset link.',
      );
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='max-w-xl'>
      <h2 className='mb-1.5 text-2xl font-bold text-dark dark:text-white'>
        Forgot Password
      </h2>
      <p className='mb-7 text-sm text-dark-4 dark:text-dark-6'>
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </p>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          {/* <label
            htmlFor='email'
            className='mb-2.5 block text-sm font-medium text-dark dark:text-white'
          >
            Email
          </label> */}
          <input
            id='email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@example.com'
            className='w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-sm outline-none transition focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white'
          />
        </div>

        {message && (
          <div className='rounded-lg border border-success/40 bg-success/5 px-4 py-3 text-sm text-success'>
            {message}
          </div>
        )}

        {error && (
          <div className='rounded-lg border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger'>
            {error}
          </div>
        )}

        <button
          type='submit'
          disabled={isSubmitting}
          className='mt-2 flex w-full items-center justify-center rounded-lg border border-primary bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70'
        >
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <div className='mt-6 text-center text-sm'>
        <p>
          Remembered your password?{' '}
          <Link href='/auth/signin' className='text-primary'>
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
