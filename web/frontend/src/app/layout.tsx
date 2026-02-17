import type { Metadata } from 'next'
import { Poppins, Noto_Sans_Sinhala } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import type { PropsWithChildren } from 'react'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import RootLoading from './loading'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const sinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sinhala',
})

export const metadata: Metadata = {
  title: 'Foresto | Modern and Elegant Restaurant Experience.',
  description: 'Foresto — A modern and elegant restaurant experience.',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="si"
      suppressHydrationWarning
      className={cn(poppins.variable, sinhala.variable)}
    >
      <body className={cn(poppins.className)}>
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
