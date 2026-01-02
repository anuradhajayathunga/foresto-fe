'use client';

import { ErrorIcon } from '@/assets/icons';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const NotFound: React.FC = () => {
  const [loaded, setLoaded] = useState(true);

  useEffect(() => {
    // Simulate the 500ms preloader behavior from the original AlpineJS
    const timeout = setTimeout(() => setLoaded(false), 500);
    return () => clearTimeout(timeout);
  }, []);

  const year = new Date().getFullYear();

  return (
    <div className='relative min-h-screen'>
      {loaded && (
        <div className='fixed left-0 top-0 z-[999999] flex h-screen w-screen items-center justify-center bg-white dark:bg-black'>
          <div className='h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent' />
        </div>
      )}

      <div className='relative z-[1] flex min-h-screen flex-col items-center justify-center overflow-hidden p-6'>
        <div className='pointer-events-none absolute right-0 top-0 -z-[1] w-full max-w-[250px] xl:max-w-[450px]'>
          <img src='/images/grids/grid-02.svg' alt='grid' />
        </div>
        <div className='pointer-events-none absolute bottom-0 left-0 -z-[1] w-full max-w-[250px] rotate-180 xl:max-w-[450px]'>
          <img src='/images/grids/grid-01.svg' alt='grid' />
        </div>

        <div className='mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]'>
          <h1 className='mb-8 text-title-md font-bold text-gray-800 dark:text-white/90 xl:text-title-2xl'>
            ERROR
          </h1>

          <div className='text-primary mx-auto h-auto w-full max-w-[472px]'>
            <ErrorIcon className='' />
          </div>

          <p className='mb-6 mt-10 text-base text-gray-700 dark:text-gray-400 sm:text-lg'>
            We can’t seem to find the page you are looking for!
          </p>

          <Link
            href='/dashboard'
            className='inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200'
          >
            Back to Home Page
          </Link>
        </div>

        {/* Footer */}
        <p className='absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400'>
          &copy; {year} - Foresto
        </p>
      </div>
      {/* ===== Page Wrapper End ===== */}
    </div>
  );
};

export default NotFound;
