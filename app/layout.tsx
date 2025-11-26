import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import type { PropsWithChildren } from 'react';
import { Toaster } from 'react-hot-toast';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Foresto',
  description: 'Foresto — A modern and elegant restaurant experience.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`
          ${poppins.variable}
          antialiased
          font-poppins
        `}
      >
        <Providers>{children}</Providers>
        <Toaster position='bottom-right' />
      </body>
    </html>
  );
}
