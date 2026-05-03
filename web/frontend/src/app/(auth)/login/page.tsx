'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { loginUser, setTokens, getMe } from '@/lib/auth';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleIcon, XIcon } from '@/assets/icons';
import logo from '@/assets/logo/logo-v1.svg';

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Server,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';
import { AuthButton } from '@/components/auth/AuthButtons';
import toast from 'react-hot-toast';
import Image from 'next/image';

type LoginResponse = {
  access: string;
  refresh: string;
  restaurant_id?: number;
  restaurant_slug?: string;
};

type ApiErrorShape = {
  detail?: string;
  non_field_errors?: string[];
  email?: string[];
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantSlug, setRestaurantSlug] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusPulse, setStatusPulse] = useState(true);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setStatusPulse((p) => !p), 2500);
    return () => clearInterval(interval);
  }, []);

  const statusItems = useMemo(
    () => [
      { label: 'Database', status: '99.99%', icon: Server, tone: 'emerald' as const },
      { label: 'API', status: 'Healthy', icon: Zap, tone: 'blue' as const },
      { label: 'Security', status: 'Active', icon: Shield, tone: 'amber' as const },
    ],
    []
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const result = (await loginUser({
        email,
        password,
        restaurant_slug: restaurantSlug.trim().toLowerCase() || undefined,
      })) as LoginResponse;

      // Store tokens + restaurant context
      setTokens(result.access, result.refresh, {
        restaurantId: result.restaurant_id,
        restaurantSlug: result.restaurant_slug || restaurantSlug || undefined,
      });

      // If restaurant_id wasn't in token response, fetch it from /me
      if (!result.restaurant_id) {
        try {
          await getMe(); // this syncs restaurant_id into localStorage automatically
        } catch {
          // non-fatal, proceed anyway
        }
      }

      toast.success('Successfully signed in!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const apiErr = error as ApiErrorShape;
      const msg =
        apiErr?.detail ||
        apiErr?.non_field_errors?.[0] ||
        apiErr?.email?.[0] ||
        'Invalid email or password';
      setErr(msg);
      toast.error('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="min-h-screen mx-auto flex">
        {/* LEFT: Brand / Trust / Status */}
        <aside className="hidden lg:flex w-1/2 relative overflow-hidden px-12 py-12">
          <div className="absolute inset-0 bg-restaurant-sidebar" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/40" />
          <div className="absolute -top-24 -left-28 h-[420px] w-[420px] rounded-full blur-3xl bg-[color:var(--restaurant-primary)]/15" />
          <div className="absolute -bottom-24 -right-28 h-[420px] w-[420px] rounded-full blur-3xl bg-[color:var(--restaurant-primary-light)]/10" />

          <div className="relative z-10 flex h-full w-full flex-col justify-between text-white">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/15">
                  <Image src={logo} alt="Foresto" width={50} height={50} className="p-[10%]" priority />
                </div>
                <div className="leading-tight">
                  <div className="text-3xl font-bold tracking-tight leading-none">
                    foresto<span className="text-primary">.</span>
                  </div>
                  <div className="text-xs text-white/65 font-medium capitalize">
                    Modern and Elegant Restaurant Experience.
                  </div>
                </div>
              </div>

              <p className="mt-6 max-w-lg text-sm text-white/70 leading-relaxed">
                Sign in to manage orders, menus, staff, and analytics with
                enterprise-grade security and reliability.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {['SOC2-ready', 'Audit logs', 'Role-based access'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Status Card */}
            <div className="space-y-5 max-w-lg">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-4 ring-emerald-500/10">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white/90">System Status</div>
                    <div className="text-xs text-white/60 flex items-center gap-2">
                      <span className={cn('inline-block h-1.5 w-1.5 rounded-full bg-emerald-400', statusPulse && 'animate-pulse')} />
                      Live monitoring
                    </div>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Operational
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {statusItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-white/5 transition">
                      <div className="flex items-center gap-2.5">
                        <item.icon className={cn(
                          'h-4 w-4',
                          item.tone === 'emerald' && 'text-emerald-300',
                          item.tone === 'blue' && 'text-blue-300',
                          item.tone === 'amber' && 'text-amber-300'
                        )} />
                        <span className="text-sm text-white/80 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span className="text-xs text-white/70 font-mono">{item.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>Avg response time</span>
                    <span className="font-mono text-white/85 font-semibold">45ms</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[92%] rounded-full bg-[color:var(--restaurant-primary)]/80" />
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/55">
                © {new Date().getFullYear()} Restaurant Admin • Security Protocol v2.5.1
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: Login Form */}
        <section className="flex w-full lg:w-1/2 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[550px]">
            <div className="mb-6 text-left">
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to manage your restaurant operations.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card">
              <div className="p-6 sm:p-8">
                {/* OAuth */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <AuthButton variant="secondary" className="gap-3 px-7">
                    <GoogleIcon /> Sign in with Google
                  </AuthButton>
                  <AuthButton variant="secondary" className="gap-3 px-7">
                    <XIcon /> Sign in with X
                  </AuthButton>
                </div>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase text-muted-foreground font-semibold">Or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                    <Input
                      id="email"
                      data-testid="login-email-input"
                      placeholder="admin@restaurant.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={loading}
                      value={email}
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 bg-background border-input"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <Input
                        id="password"
                        data-testid="login-password-input"
                        type={showPassword ? 'text' : 'password'}
                        disabled={loading}
                        value={password}
                        required
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 bg-background border-input pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        suppressHydrationWarning
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>

                    <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground select-none">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary accent-[color:var(--restaurant-primary)]"
                        suppressHydrationWarning
                      />
                      Remember this device
                    </label>
                  </div>

                  {/* Error — now visible */}
                  {err && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive animate-in slide-in-from-top-2">
                      {err}
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    disabled={loading || !email || !password}
                    data-testid="login-submit-button"
                    className={cn(
                      'h-12 w-full font-semibold text-base',
                      'bg-primary text-primary-foreground hover:bg-[color:var(--restaurant-primary-dark)]'
                    )}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Protected by rate limiting and audit logging.
                  </p>
                </form>
              </div>

              <div className="border-t border-border px-6 py-5 sm:px-8">
                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="font-semibold text-foreground hover:underline underline-offset-4">
                    Sign up
                  </Link>
                </p>
                <p className="mt-4 text-center text-xs text-muted-foreground leading-relaxed">
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="underline underline-offset-4 hover:text-foreground font-medium">Terms</Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground font-medium">Privacy Policy</Link>.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
              Secure access • Audit logs • Role-based permissions
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}