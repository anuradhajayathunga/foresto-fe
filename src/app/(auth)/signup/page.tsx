'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { registerUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Server,
  Shield,
  XCircle,
  Fingerprint,
} from 'lucide-react';
import { AuthButton } from '@/components/auth/AuthButtons';
import { GoogleIcon, XIcon } from '@/assets/icons';
import toast from 'react-hot-toast';

type ApiErrorShape = {
  detail?: string;
  non_field_errors?: string[];
  email?: string[];
  username?: string[];
  password?: string[];
  password2?: string[];
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusPulse, setStatusPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setStatusPulse((p) => !p), 2500);
    return () => clearInterval(interval);
  }, []);

  // Password rules
  const passwordCriteria = useMemo(() => {
    const p = form.password;
    return [
      { label: 'At least 8 characters', met: p.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(p) },
      { label: 'One number', met: /\d/.test(p) },
      { label: 'One special character', met: /[^a-zA-Z\d]/.test(p) },
    ];
  }, [form.password]);

  const isPasswordValid = passwordCriteria.every((c) => c.met);
  const passwordsMatch =
    form.password.length > 0 &&
    form.password2.length > 0 &&
    form.password === form.password2;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    if (form.password !== form.password2) {
      setErr('Passwords do not match');
      return;
    }
    if (!isPasswordValid) {
      setErr('Please meet all password requirements');
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      toast.success('Account created successfully! Please log in.');
      router.push('/login');
    } catch (error: unknown) {
      const apiErr = error as ApiErrorShape;
      const msg =
        apiErr?.detail ||
        apiErr?.email?.[0] ||
        apiErr?.username?.[0] ||
        apiErr?.password?.[0] ||
        apiErr?.password2?.[0] ||
        apiErr?.non_field_errors?.[0] ||
        'Registration failed';
      setErr(msg);
      toast.error(`Registration failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='min-h-screen w-full bg-background text-foreground'>
      <div className='min-h-screen mx-auto flex'>
        {/* LEFT: Brand / Trust / Status (match login) */}
        <aside className='hidden lg:flex w-1/2 relative overflow-hidden px-12 py-12'>
          <div className='absolute inset-0 bg-restaurant-sidebar' />
          <div className='absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/40' />

          <div
            className='absolute inset-0 opacity-25 pointer-events-none'
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgb(255 255 255 / 0.18) 1px, transparent 0)',
              backgroundSize: '46px 46px',
            }}
          />

          <div className='absolute -top-24 -left-28 h-[420px] w-[420px] rounded-full blur-3xl bg-[color:var(--restaurant-primary)]/15' />
          <div className='absolute -bottom-24 -right-28 h-[420px] w-[420px] rounded-full blur-3xl bg-[color:var(--restaurant-primary-light)]/10' />

          <div className='relative z-10 flex h-full w-full flex-col justify-between text-white'>
            {/* Brand */}
            <div>
              <div className='flex items-center gap-3'>
                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/15'>
                  <ShieldCheck className='h-6 w-6' />
                </div>
                <div className='leading-tight'>
                  <div className='text-3xl font-bold tracking-tight'>
                    Foresto
                  </div>
                  <div className='text-xs text-white/65 font-medium'>
                    {/* Account provisioning & security */}
                  </div>
                </div>
              </div>

              <p className='mt-6 max-w-lg text-sm text-white/70 leading-relaxed'>
                Create an admin account for managing menu, orders, staff, and
                analytics. All registrations are logged for compliance.
              </p>

              {/* Protocols */}
              <div className='mt-6 max-w-lg rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl'>
                <div className='flex items-center gap-2 text-sm font-semibold text-white/90'>
                  <ShieldAlert className='h-4 w-4 text-amber-300' />
                  Registration Protocols
                </div>

                <div className='mt-4 space-y-3 text-sm'>
                  {[
                    {
                      title: 'Verified identity',
                      body: 'Use a real email. Verification may be required.',
                    },
                    {
                      title: 'Strong password policy',
                      body: 'Passwords must meet minimum security rules.',
                    },
                    {
                      title: 'Audit & monitoring',
                      body: 'Device and IP logging enabled for this session.',
                    },
                  ].map((p, idx) => (
                    <div
                      key={p.title}
                      className='flex gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition'
                    >
                      <div className='mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-xs font-bold'>
                        {idx + 1}
                      </div>
                      <div>
                        <div className='text-white/85 font-medium'>
                          {p.title}
                        </div>
                        <div className='text-xs text-white/60 mt-1'>
                          {p.body}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className='p-6'>
                  <div className='mt-3 space-y-3'>
                    {[
                      {
                        label: 'Database',
                        status: '99.99%',
                        icon: Server,
                        tone: 'emerald',
                      },
                      {
                        label: 'API',
                        status: 'Healthy',
                        icon: Zap,
                        tone: 'blue',
                      },
                      {
                        label: 'Security',
                        status: 'Active',
                        icon: Shield,
                        tone: 'amber',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className='flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5 transition'
                      >
                        <div className='flex items-center gap-2.5'>
                          <item.icon
                            className={cn(
                              'h-4 w-4',
                              item.tone === 'emerald' && 'text-emerald-300',
                              item.tone === 'blue' && 'text-blue-300',
                              item.tone === 'amber' && 'text-amber-300'
                            )}
                          />
                          <span className='text-sm text-white/80 font-medium'>
                            {item.label}
                          </span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <CheckCircle2 className='h-4 w-4 text-emerald-300' />
                          <span className='text-xs text-white/70 font-mono'>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className='mt-5 border-t border-white/10 pt-4'>
                    <div className='flex items-center justify-between text-xs text-white/60'>
                      <span>Avg response time</span>
                      <span className='font-mono text-white/85 font-semibold'>
                        45ms
                      </span>
                    </div>
                    <div className='mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10'>
                      <div className='h-full w-[92%] rounded-full bg-[color:var(--restaurant-primary)]/80' />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status card (same feel as login) */}
            <div className='space-y-5'>
              <div className='text-xs text-white/55'>
                © {new Date().getFullYear()} Restaurant Admin • Secure
                onboarding
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: SaaS Card Register */}
        <section className='flex w-full lg:w-1/2 items-center justify-center px-6 py-10'>
          <div className='w-full max-w-[550px]'>
            {/* Header */}
            <div className='mb-6 text-left'>
              {/* <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm ring-8 ring-muted'>
                <ShieldCheck className='h-7 w-7' />
              </div> */}
              <h1 className='text-3xl font-bold tracking-tight'>
                Create your account
              </h1>
              <p className='mt-2 text-sm text-muted-foreground'>
                Register to access the restaurant admin panel.
              </p>
            </div>

            {/* Card */}
            <div className='rounded-2xl border border-border bg-card'>
              <div className='p-6 sm:p-8'>
                {/* OAuth */}
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
                  <AuthButton variant='secondary' className='gap-3 px-7'>
                    <GoogleIcon />
                    Sign up with Google
                  </AuthButton>
                  <AuthButton variant='secondary' className='gap-3 px-7'>
                    <XIcon />
                    Sign up with X
                  </AuthButton>
                </div>
                {/* Divider */}
                <div className='my-6 flex items-center gap-3'>
                  <div className='h-px flex-1 bg-border' />
                  <span className='text-xs uppercase text-muted-foreground font-semibold'>
                    Or
                  </span>
                  <div className='h-px flex-1 bg-border' />
                </div>
                <form onSubmit={onSubmit} className='space-y-5'>
                  {/* Username + Email */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label
                        htmlFor='username'
                        className='text-sm font-semibold'
                      >
                        Username
                      </Label>
                      <Input
                        id='username'
                        placeholder='jdoe'
                        value={form.username}
                        required
                        disabled={loading}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, username: e.target.value }))
                        }
                        className='h-12 bg-background border-input'
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='email' className='text-sm font-semibold'>
                        Email
                      </Label>
                      <Input
                        id='email'
                        type='email'
                        placeholder='admin@restaurant.com'
                        value={form.email}
                        required
                        disabled={loading}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, email: e.target.value }))
                        }
                        className='h-12 bg-background border-input'
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className='space-y-2'>
                    <Label htmlFor='password' className='text-sm font-semibold'>
                      Password
                    </Label>
                    <div className='relative'>
                      <Input
                        id='password'
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        required
                        disabled={loading}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, password: e.target.value }))
                        }
                        className='h-12 bg-background border-input pr-11'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword((s) => !s)}
                        className='absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition'
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>

                    {/* Live checklist */}
                    {form.password.length > 0 && (
                      <div className='mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                        {passwordCriteria.map((c) => (
                          <div
                            key={c.label}
                            className='flex items-center gap-2'
                          >
                            {c.met ? (
                              <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                            ) : (
                              <div className='h-2 w-2 rounded-full bg-muted-foreground/40' />
                            )}
                            <span
                              className={cn(
                                'text-xs',
                                c.met
                                  ? 'text-foreground font-medium'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {c.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='password2'
                      className='text-sm font-semibold'
                    >
                      Confirm password
                    </Label>
                    <div className='relative'>
                      <Input
                        id='password2'
                        type={showPassword2 ? 'text' : 'password'}
                        value={form.password2}
                        required
                        disabled={loading}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, password2: e.target.value }))
                        }
                        className='h-12 bg-background border-input pr-11'
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword2((s) => !s)}
                        className='absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition'
                        aria-label={
                          showPassword2 ? 'Hide password' : 'Show password'
                        }
                      >
                        {showPassword2 ? (
                          <EyeOff className='h-5 w-5' />
                        ) : (
                          <Eye className='h-5 w-5' />
                        )}
                      </button>
                    </div>

                    {form.password2.length > 0 && (
                      <div className='flex items-center gap-2 text-xs mt-2'>
                        {passwordsMatch ? (
                          <>
                            <CheckCircle2 className='h-4 w-4 text-emerald-500' />
                            <span className='text-emerald-600'>
                              Passwords match
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className='h-4 w-4 text-red-500' />
                            <span className='text-red-600'>
                              Passwords do not match
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {/* {err && (
                    <Alert
                      variant='destructive'
                      className='animate-in slide-in-from-top-2'
                    >
                      <AlertDescription className='flex items-center gap-2'>
                        <XCircle className='h-4 w-4' />
                        <span className='font-medium'>{err}</span>
                      </AlertDescription>
                    </Alert>
                  )} */}

                  {/* Submit */}
                  <Button
                    type='submit'
                    disabled={loading || !isPasswordValid || !passwordsMatch}
                    className={cn(
                      'h-12 w-full font-semibold text-base',
                      'bg-primary text-primary-foreground hover:bg-[color:var(--restaurant-primary-dark)]'
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </form>
              </div>
              {/* Footer */}
              <div className='border-t border-border px-6 py-5 sm:px-8'>
                <p className=' text-center text-sm text-muted-foreground'>
                  Already have an account?{' '}
                  <Link
                    href='/login'
                    className='font-semibold text-foreground hover:underline underline-offset-4'
                  >
                    Sign in
                  </Link>
                </p>
                <p className='mt-4 text-center text-xs text-muted-foreground leading-relaxed'>
                  By continuing, you agree to our{' '}
                  <Link
                    href='/terms'
                    className='underline underline-offset-4 hover:text-foreground font-medium'
                  >
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    href='/privacy'
                    className='underline underline-offset-4 hover:text-foreground font-medium'
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <p className='mt-6 text-center text-xs text-muted-foreground lg:hidden'>
              Secure onboarding • Audit logs • Role-based permissions
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
