'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/useAuthToken';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  AlertCircle,
  AtSign,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
} from 'lucide-react';

type FormState = {
  fullName: string;
  phoneNumber: string;
  email: string;
  username: string;
  bio: string;
};

export function PersonalInfoForm() {
  const { user } = useAuth();

  const initial = useMemo<FormState>(
    () => ({
      fullName: `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim(),
      phoneNumber: '',
      email: user?.email ?? '',
      username: user?.username ?? '',
      bio: '',
    }),
    [user]
  );

  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  function update<K extends keyof FormState>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setSaved(false);
    };
  }

  function onCancel() {
    setErr(null);
    setSaved(false);
    setForm(initial);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaved(false);
    setSaving(true);

    try {
      // TODO: replace with real API call
      await new Promise((r) => setTimeout(r, 450));
      console.log('save personal info', form);
      setSaved(true);
    } catch (error: any) {
      setErr(error?.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Personal information
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your profile details up to date.
            </p>
          </div>

          {saved ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-restaurant-success" />
              Saved
            </span>
          ) : null}
        </div>
      </header>

      <form onSubmit={onSubmit} className="space-y-5 px-6 py-5">
        {err ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Full name"
            icon={<User className="h-4 w-4" />}
            input={
              <Input
                value={form.fullName}
                onChange={update('fullName')}
                placeholder="Your name"
                autoComplete="name"
              />
            }
          />

          <Field
            label="Phone"
            icon={<Phone className="h-4 w-4" />}
            input={
              <Input
                value={form.phoneNumber}
                onChange={update('phoneNumber')}
                placeholder="+94 …"
                autoComplete="tel"
              />
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Email"
            icon={<Mail className="h-4 w-4" />}
            input={
              <Input
                value={form.email}
                onChange={update('email')}
                placeholder="name@company.com"
                type="email"
                autoComplete="email"
              />
            }
          />

          <Field
            label="Username"
            icon={<AtSign className="h-4 w-4" />}
            input={
              <Input
                value={form.username}
                onChange={update('username')}
                placeholder="username"
                autoComplete="username"
              />
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Bio</Label>
          <textarea
            value={form.bio}
            onChange={update('bio')}
            placeholder="Tell us a little about yourself…"
            rows={5}
            className={cn(
              'w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-sm text-foreground',
              'placeholder:text-muted-foreground/80',
              'shadow-sm outline-none transition-colors transition-shadow',
              'hover:bg-muted/60',
              'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15'
            )}
          />
          <p className="text-xs text-muted-foreground">
            This will be visible to team members who can view your profile.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-[color:var(--restaurant-primary-dark)]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  icon,
  input,
}: {
  label: string;
  icon: React.ReactNode;
  input: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
          {icon}
        </div>
        <div className="[&>input]:pl-9">{input}</div>
      </div>
    </div>
  );
}
