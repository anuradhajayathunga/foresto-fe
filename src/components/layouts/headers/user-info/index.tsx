'use client';

import { ChevronUpIcon } from '@/assets/icons';
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from '@/components/ui/dropdown';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogOutIcon, SettingsIcon, UserIcon } from './icons';
import { useRouter } from 'next/navigation';
import { useAuth, type User } from '@/hooks/useAuthToken';
import toast from 'react-hot-toast';

function UserInfoSkeleton() {
  return (
    <div className='flex items-center justify-end gap-3'>
      <div className='hidden items-end max-[1024px]:sr-only lg:flex flex-col gap-2'>
        <div className='h-2 w-20 rounded bg-slate-200 dark:bg-slate-600 animate-pulse' />
        <div className='h-2 w-16 rounded bg-slate-300 dark:bg-slate-700 animate-pulse' />
      </div>
      <div className='h-12 w-12 rounded-full bg-slate-300 dark:bg-slate-700 animate-pulse' />
    </div>
  );
}

export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const USER = {
    name: 'John Smith',
    email: 'johnson@nextadmin.com',
    img: '/images/user/user-03.png',
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login'); 
    }
  }, [authLoading, user, router]);

  const handleLogout = () => {
    // Clear tokens (or whatever you stored on login)
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (e) {
      console.error('Error clearing auth tokens', e);
    }

    setIsOpen(false);
    toast.success('Logged out successfully.');
    router.push('/login');
  };

  if (authLoading || !user) {
    return <UserInfoSkeleton />;
  }

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className='rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark'>
        <span className='sr-only'>My Account</span>

        <figure className='flex items-center gap-3'>
          <figcaption className='flex flex-col items-end leading-tight max-[1024px]:hidden'>
            <span className='text-[11px] font-medium capitalize tracking-wide text-slate-500 dark:text-slate-400'>
              Welcome back,
            </span>
            <span className='text-sm font-semibold text-slate-900 dark:text-slate-50 capitalize truncate max-w-[120px]'>
              {user?.username}
            </span>
          </figcaption>

          <div className='relative'>
            <Image
              src={USER.img}
              className='size-12 rounded-full border border-slate-200 object-cover dark:border-slate-700'
              alt={`Avatar of ${user?.username}`}
              role='presentation'
              width={200}
              height={200}
            />
            {/* <span
              className='absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-400 shadow-sm dark:border-slate-900'
              aria-hidden
            /> */}
          </div>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className=' border border-stroke bg-white shadow-md dark:border-dark-3 dark:bg-gray-dark min-[230px]:min-w-[19rem] py-2'
        align='end'
      >
        <h2 className='sr-only'>User information</h2>

        <figure className='flex items-center gap-2.5 px-5 py-3.5'>
          <Image
            src={USER.img}
            className='size-12'
            alt={`Avatar for ${user?.username}`}
            role='presentation'
            width={200}
            height={200}
          />

          <figcaption className='space-y-1 text-base font-medium'>
            <div className='mb-2 leading-none text-dark dark:text-white capitalize'>
              {user?.username}
            </div>

            <div className='leading-none text-gray-6 text-sm'>
              {user?.email}
            </div>
          </figcaption>
        </figure>

        <hr className='border-[#E8E8E8] dark:border-dark-3' />

        <div className='p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer'>
          <Link
            href={'/profile'}
            onClick={() => setIsOpen(false)}
            className='flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white'
          >
            <UserIcon />
            <span className='mr-auto text-base font-medium'>View profile</span>
          </Link>

          <Link
            href={'/pages/settings'}
            onClick={() => setIsOpen(false)}
            className='flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white'
          >
            <SettingsIcon />
            <span className='mr-auto text-base font-medium'>
              Account Settings
            </span>
          </Link>
        </div>

        <hr className='border-[#E8E8E8] dark:border-dark-3' />

        <div className='p-2 text-base text-[#4B5563] dark:text-dark-6'>
          <button
            type='button'
            className='flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white cursor-pointer'
            onClick={handleLogout}
          >
            <LogOutIcon />
            <span className='text-base font-medium'>Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
