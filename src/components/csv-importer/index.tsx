'use client';

import { useMemo, useState } from 'react';
import { authFetch } from '@/lib/auth';
import { importCsv } from '@/lib/imports';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import {
  Download,
  FileUp,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';

import type { Kind } from '@/types/import';
import { cn } from '@/lib/utils';

interface CsvImporterProps {
  kind: Kind;
  title?: string;
  description?: string;
}

export function CsvImporter({ kind, title, description }: CsvImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const defaultTitle = title || `Import ${kind.replace('_', ' ')}`;

  const fileMeta = useMemo(() => {
    if (!file) return null;
    const sizeKb = Math.round(file.size / 1024);
    return { name: file.name, size: sizeKb };
  }, [file]);

  async function downloadTemplate() {
    setDownloading(true);
    setErr(null);
    try {
      const response = await authFetch(`/api/import/template/?kind=${kind}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Permission denied. You must be Admin/Staff.');
        }
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${kind}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      setErr(e.message || 'Could not download template.');
    } finally {
      setDownloading(false);
    }
  }

  async function run() {
    setErr(null);
    setResult(null);

    if (!file) {
      setErr('Please choose a CSV file.');
      return;
    }

    setLoading(true);
    try {
      const res = await importCsv(kind, file, dryRun);
      setResult(res);
    } catch (e: any) {
      setErr(e?.detail || 'Import failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='w-full space-y-4'>
      {/* Step: Upload */}
      <div className=' p-4 space-y-4'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex flex-1 items-center gap-2 text-sm font-semibold '>
            <FileText className='h-4 w-4 text-muted-foreground' />
            <span>Upload CSV</span>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={downloadTemplate}
            disabled={downloading || loading}
            className='h-9 gap-2'
          >
            {downloading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Download className='h-4 w-4' />
            )}
            Template
          </Button>
        </div>

        <div className='space-y-2'>
          {/* <Label htmlFor='file-upload' className='text-sm'>
            Choose file
          </Label> */}

          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <Input
              id='file-upload'
              type='file'
              accept='.csv'
              disabled={loading || downloading}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className='cursor-pointer'
            />

            {file ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setFile(null)}
                disabled={loading}
                className='h-9 gap-2'
              >
                <X className='h-4 w-4' />
                Clear
              </Button>
            ) : null}
          </div>

          {fileMeta ? (
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span className='truncate max-w-[260px]'>{fileMeta.name}</span>
              <span className='text-muted-foreground/60'>•</span>
              <span>{fileMeta.size} KB</span>
            </div>
          ) : (
            <p className='text-xs text-muted-foreground'>
              Upload a <span className='font-medium'>.csv</span> file using the
              provided template.
            </p>
          )}
        </div>

        {/* Options */}
        <div className='flex items-start justify-between gap-4 rounded-lg bg-muted/30 p-3'>
          <div className='space-y-1'>
            <div className='text-sm font-medium'>Dry run</div>
            <p className='text-xs text-muted-foreground'>
              Validate data without saving changes.
            </p>
          </div>

          <label className='flex items-center gap-2 text-sm select-none'>
            <input
              id={`dryrun-${kind}`}
              type='checkbox'
              className='h-4 w-4 rounded border-border text-primary accent-[color:var(--restaurant-primary)]'
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              disabled={loading || downloading}
            />
            <span className='text-muted-foreground'>Enable</span>
          </label>
        </div>

        {/* Error */}
        {err ? (
          <Alert variant='destructive' className='mt-2'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        ) : null}

        {/* Action */}
        <Button
          onClick={run}
          disabled={loading || !file || downloading}
          className={cn(
            'w-full h-11 gap-2 font-semibold',
            'bg-primary text-primary-foreground hover:bg-[color:var(--restaurant-primary-dark)]'
          )}
        >
          {loading ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              Importing…
            </>
          ) : (
            <>
              <FileUp className='h-4 w-4' />
              Run import
            </>
          )}
        </Button>

        <p className='text-xs text-muted-foreground text-center'>
          <Sparkles className='inline h-3.5 w-3.5 mr-1 -translate-y-[1px]' />
          Audit logging is enabled for imports.
        </p>
      </div>

      {/* Results */}
      {result ? (
        <div className='rounded-xl border border-border bg-card p-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300'>
          <div className='flex items-start justify-between gap-4'>
            <div className='flex items-center gap-2'>
              <CheckCircle2 className='h-4 w-4 text-restaurant-success' />
              <div>
                <div className='text-sm font-semibold'>Import complete</div>
                <div className='text-xs text-muted-foreground'>
                  {result.dry_run ? 'Dry run (no data saved)' : 'Changes saved'}
                </div>
              </div>
            </div>

            <span className='rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
              {result.dry_run ? 'Dry run' : 'Live'}
            </span>
          </div>

          <div className='grid grid-cols-3 gap-3'>
            <Stat label='Created' value={result.created ?? 0} tone='success' />
            <Stat label='Updated' value={result.updated ?? 0} tone='info' />
            <Stat
              label='Errors'
              value={result.errors?.length ?? 0}
              tone='danger'
            />
          </div>

          {(result.errors?.length ?? 0) > 0 ? (
            <div className='border-t border-border pt-4 space-y-2'>
              <p className='text-xs font-semibold text-destructive'>
                Error log
              </p>
              <div className='max-h-44 overflow-y-auto pr-1 space-y-2 custom-scrollbar'>
                {result.errors.slice(0, 50).map((x: any, i: number) => (
                  <div
                    key={i}
                    className='rounded-lg border border-border bg-muted/20 p-3 text-xs'
                  >
                    <div className='font-semibold text-destructive'>
                      Row {x.row}
                    </div>
                    <div className='mt-1 text-muted-foreground'>{x.error}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'info' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-restaurant-success'
      : tone === 'info'
      ? 'text-blue-600 dark:text-blue-400'
      : 'text-destructive';

  return (
    <div className='rounded-lg border border-border bg-muted/20 p-3 text-center'>
      <div className={cn('text-lg font-bold', toneClass)}>{value}</div>
      <div className='mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
        {label}
      </div>
    </div>
  );
}
