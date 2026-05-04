'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { AlertCircle, Image as ImageIcon, Loader2, Trash2, UploadCloud } from 'lucide-react';

type SelectedFile = {
  file: File;
  previewUrl: string;
};

const MAX_MB = 4;
const ACCEPTED = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
]);

export function UploadPhotoForm() {
  const [selected, setSelected] = useState<SelectedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentSrc = useMemo(() => {
    // TODO: replace with real user avatar url
    return '/images/user/user-03.png';
  }, []);

  useEffect(() => {
    return () => {
      if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
    };
  }, [selected]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(null);
    const f = e.target.files?.[0];
    if (!f) return;

    if (!ACCEPTED.has(f.type)) {
      setErr('Please upload a PNG, JPG, WEBP, or GIF image.');
      e.target.value = '';
      return;
    }

    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > MAX_MB) {
      setErr(`Image is too large. Max size is ${MAX_MB}MB.`);
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(f);
    setSelected({ file: f, previewUrl });
  }

  function clearSelection() {
    setErr(null);
    setSelected((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!selected?.file) {
      setErr('Choose an image first.');
      return;
    }

    setSaving(true);
    try {
      // TODO: replace with real upload logic
      await new Promise((r) => setTimeout(r, 650));
      console.log('upload photo', selected.file);
      clearSelection();
    } catch (error: any) {
      setErr(error?.message ?? 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">Profile photo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a square image for best results.
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5 px-6 py-5">
        {err ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border bg-muted">
            <Image
              src={selected?.previewUrl ?? currentSrc}
              alt="Profile"
              fill
              sizes="56px"
              className="object-cover"
              priority
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-foreground">
              {selected ? 'Ready to upload' : 'Current photo'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {selected
                ? `${selected.file.name} • ${(selected.file.size / 1024 / 1024).toFixed(2)}MB`
                : `PNG, JPG, WEBP or GIF (max ${MAX_MB}MB)`}
            </div>
          </div>

          {selected ? (
            <Button
              type="button"
              variant="outline"
              onClick={clearSelection}
              disabled={saving}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>

        <div className="relative">
          <input
            id="profilePhoto"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={onPickFile}
            className="sr-only"
            disabled={saving}
          />

          <label
            htmlFor="profilePhoto"
            className={cn(
              'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center transition',
              'hover:bg-muted/40 hover:border-primary/60',
              saving && 'cursor-not-allowed opacity-60'
            )}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background shadow-sm">
              {selected ? (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <UploadCloud className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </div>

            <div className="text-sm font-semibold text-foreground">
              {selected ? 'Choose a different image' : 'Click to upload'}
            </div>
            <div className="text-xs text-muted-foreground">
              Drag & drop is optional (click works everywhere).
            </div>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={clearSelection} disabled={saving || !selected}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !selected}
            className="bg-primary text-primary-foreground hover:bg-[color:var(--restaurant-primary-dark)]"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              'Save photo'
            )}
          </Button>
        </div>
      </form>
    </section>
  );
}
