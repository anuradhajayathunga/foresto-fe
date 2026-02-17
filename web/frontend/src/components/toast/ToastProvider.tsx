'use client';

import React, {
  createContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type Toast = {
  id: number;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
};

type ToastOptions = Omit<Toast, 'id'>;

type ToastContextValue = {
  show: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

function getVariantClasses(variant?: ToastVariant) {
  switch (variant) {
    case 'success':
      return 'border-emerald-500/60 bg-emerald-50/90 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-50';
    case 'error':
      return 'border-rose-500/60 bg-rose-50/90 text-rose-900 dark:bg-rose-900/50 dark:text-rose-50';
    case 'warning':
      return 'border-amber-500/60 bg-amber-50/90 text-amber-900 dark:bg-amber-900/50 dark:text-amber-50';
    case 'info':
    default:
      return 'border-sky-500/60 bg-sky-50/90 text-sky-900 dark:bg-sky-900/50 dark:text-sky-50';
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = ++idRef.current;
      const toast: Toast = {
        id,
        duration: options.duration ?? 3000,
        ...options,
      };

      setToasts((prev) => [...prev, toast]);

      if (toast.duration && toast.duration > 0) {
        window.setTimeout(() => {
          remove(id);
        }, toast.duration);
      }
    },
    [remove],
  );

  const makeVariant =
    (variant: ToastVariant) => (title: string, description?: string) =>
      show({ variant, title, description });

  const value: ToastContextValue = {
    show,
    success: makeVariant('success'),
    error: makeVariant('error'),
    info: makeVariant('info'),
    warning: makeVariant('warning'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast viewport */}
      <div className="pointer-events-none fixed inset-0 z-[9999] flex items-start justify-end p-4 sm:p-6">
        <div className="mt-12 flex w-full max-w-sm flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={[
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm',
                'transition-all duration-200 ease-out',
                'animate-[slide-in_0.2s_ease-out]',
                'dark:border-slate-700/70',
                getVariantClasses(toast.variant),
              ].join(' ')}
            >
              {/* Colored dot */}
              <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-current opacity-80" />

              {/* Text */}
              <div className="flex-1">
                {toast.title && (
                  <div className="text-sm font-semibold leading-snug">
                    {toast.title}
                  </div>
                )}
                {toast.description && (
                  <div className="mt-0.5 text-xs leading-snug opacity-90">
                    {toast.description}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Simple keyframes (Tailwind not needed if you add this to global CSS) */}
      <style jsx global>{`
        @keyframes slide-in {
          0% {
            opacity: 0;
            transform: translateX(16px) translateY(4px);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
