import SignupwithForm from '@/components/Auth/SignupwithForm'; // your password form
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import Signin from '@/components/Auth/Signin';
import FacebookSigninButton from '@/components/Auth/FacebookSigninButton';
import GoogleSigninButton from '@/components/Auth/GoogleSigninButton';

export const metadata: Metadata = {
  title: 'Foresto - Sign up',
};

export default function SignUpPage() {
  return (
    <div>
      <div className='relative overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card'>
        <div className='flex flex-col lg:flex-row'>
          {/* LEFT: white area with form */}
          <div className='w-full lg:w-1/2 bg-primary text-white flex flex-col justify-between px-10 py-10'>
              <div>
            <h2 className="text-2xl sm:text-3xl font-semibold">
              The simplest way to manage
              <br />
              your workforce
            </h2>
            <p className="mt-3 text-sm text-blue-100 max-w-md">
              Enter your credentials to access your account and stay on top of
              productivity, timesheets, and team performance.
            </p>
          </div>

            {/* mock dashboard image */}
            <div className='mt-8 flex justify-center'>
              <Image
                src='/images/grids/grid-02.svg' // replace with your dashboard mock
                alt='App preview'
                width={420}
                height={320}
                className='drop-shadow-xl'
              />
            </div>

            {/* logos row (like WeChat / Booking.com / etc.) */}
            <div className='mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-blue-100 opacity-80'>
              <span className='font-ligh'>
                2025 Foresto. All rights reserved.
              </span>
            </div>
          </div>

          {/* RIGHT: blue promo panel */}
          <div className='w-full lg:w-1/2 px-8 py-10 sm:px-12'>
            {/* logo */}
            {/* <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <Image
                className="hidden dark:block"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={140}
                height={28}
              />
              <Image
                className="dark:hidden"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={140}
                height={28}
              />
            </Link> */}

            {/* heading */}
            <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
              Get Started Now
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Enter your credentials to access your account
            </p>
          </div>

            {/* social buttons */}
            <div className=' grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <GoogleSigninButton text='Google' />
              <FacebookSigninButton text='Apple' />
            </div>

            {/* divider */}
            <div className='my-6 flex items-center justify-center'>
              <span className='block h-px w-full bg-stroke dark:bg-dark-3' />
              <div className='block w-full min-w-fit bg-white px-3 text-xs text-center font-medium text-slate-400 dark:bg-gray-dark'>
                Or sign up with email
              </div>
              <span className='block h-px w-full bg-stroke dark:bg-dark-3' />
            </div>

            {/* your form component */}
            <Signin />

            {/* bottom link */}
            <p className='mt-4 text-sm text-slate-500 text-center'>
              Don't have an account?{' '}
              <Link
                href='/auth/signup'
                className='font-medium text-primary hover:underline'
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
