import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import type { PropsWithChildren } from 'react';

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-6xl">{children}</div>
    </div>
  );
}