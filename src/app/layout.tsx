import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import type { PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';
import { cn } from '@/lib/utils';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Foresto',
  description: 'Foresto — A modern and elegant restaurant experience.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' suppressHydrationWarning className={poppins.variable}>
      <body className={cn(poppins.className)}>
        <Providers>{children}</Providers>
        <Toaster position='bottom-right' />
      </body>
    </html>
  );
}
