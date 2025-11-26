import { GoogleIcon } from '@/assets/icons';

export default function GoogleSigninButton({ text }: { text: string }) {
  return (
    <button className='flex w-full items-center justify-center gap-2 rounded-lg border border-stroke bg-gray-2 p-[10px] font-medium text-md hover:bg-opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-opacity-50'>
      <GoogleIcon />
      Sign up with {text}
    </button>
  );
}
