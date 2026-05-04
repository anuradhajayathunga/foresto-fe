'use client';

import { useState } from 'react';
import { importCsv } from '@/lib/imports';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch'; // Assuming you have a switch component
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Loader2,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Kind = 'categories' | 'menu_items' | 'ingredients' | 'recipes';
import type { Metadata } from 'next';

import { PersonalInfoForm } from './_components/personal-info';
import { UploadPhotoForm } from './_components/upload-photo';

export default function SettingsPage() {
  const [kind, setKind] = useState<Kind>('categories');
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  // Helper to get color based on import type
  const getTypeColor = (k: Kind) => {
    switch (k) {
      case 'menu_items':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ingredients':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'recipes':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };
  return (
    <div className='mx-auto w-full max-w-[1080px] px-4 pb-10 pt-6 sm:px-6 lg:px-8'>
      {/* <div className="mb-6">
        <Breadcrumb pageName="Settings" />
      </div> */}

      <header className='mb-8'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>
          Account Settings 
        </h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Update your profile details and account preferences.
        </p>
      </header>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-12'>
        <div className='lg:col-span-7 xl:col-span-8'>
          <PersonalInfoForm />
        </div>

        <div className='lg:col-span-5 xl:col-span-4'>
          <div className='lg:sticky lg:top-24'>
            <UploadPhotoForm />
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-8 p-6 md:p-8 mx-auto w-full'>
        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-border/40 pb-6'>
          <div className='space-y-1'>
            <h1 className='text-3xl font-bold tracking-tight text-foreground'>
              Data Import
            </h1>
            <p className='text-sm text-muted-foreground max-w-2xl'>
              Bulk upload Categories, Items, and Recipes. Use 'Dry Run' to
              validate data structure before committing changes to the database.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' className='gap-2'>
              <FileSpreadsheet className='h-4 w-4' />
              Download Template
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* CENTER/RIGHT: Upload & Results Area */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Upload Card */}
            <Card className='shadow-sm border-border/60'>
              <CardContent className='p-6'>
                <div className='flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/5 p-10 transition-colors hover:bg-muted/10 hover:border-primary/50'>
                  <div className='bg-background p-4 rounded-full shadow-sm mb-4'>
                    <UploadCloud className='h-8 w-8 text-muted-foreground' />
                  </div>
                  <div className='space-y-1 text-center'>
                    <p className='text-sm font-medium'>
                      Drag & drop your CSV here or click to browse
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Max file size: 10MB
                    </p>
                  </div>
                  <Input
                    type='file'
                    accept='.csv'
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className='mt-6 w-full max-w-xs file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:text-sm hover:file:bg-primary/90 cursor-pointer'
                  />
                </div>

                {file && (
                  <div className='mt-4 flex items-center justify-between p-3 bg-muted/30 rounded-lg border'>
                    <div className='flex items-center gap-3'>
                      <FileSpreadsheet className='h-5 w-5 text-green-600' />
                      <span className='text-sm font-medium'>{file.name}</span>
                      <Badge variant='secondary' className='text-[10px] h-5'>
                        {(file.size / 1024).toFixed(1)} KB
                      </Badge>
                    </div>
                    <Button
                      size='sm'
                      onClick={run}
                      disabled={loading}
                      className='gap-2'
                    >
                      {loading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Play className='h-4 w-4 fill-current' />
                      )}
                      {loading ? 'Processing...' : 'Start Import'}
                    </Button>
                  </div>
                )}

                {err && (
                  <Alert
                    variant='destructive'
                    className='mt-4 bg-destructive/10 border-destructive/20 text-destructive'
                  >
                    <AlertCircle className='h-4 w-4' />
                    <AlertTitle>Import Error</AlertTitle>
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Results Card */}
            {result && (
              <Card className='shadow-sm border-border/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500'>
                <CardHeader className='bg-muted/30 border-b border-border/60 pb-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {result.errors?.length === 0 ? (
                        <div className='p-1.5 bg-green-100 text-green-700 rounded-full'>
                          <CheckCircle2 className='h-5 w-5' />
                        </div>
                      ) : (
                        <div className='p-1.5 bg-amber-100 text-amber-700 rounded-full'>
                          <AlertCircle className='h-5 w-5' />
                        </div>
                      )}
                      <CardTitle className='text-base'>
                        {result.dry_run
                          ? 'Dry Run Complete'
                          : 'Import Complete'}
                      </CardTitle>
                    </div>
                    <Badge variant={result.dry_run ? 'outline' : 'default'}>
                      {result.dry_run ? 'Simulation' : 'Live Run'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className='p-0'>
                  {/* Stats Row */}
                  <div className='grid grid-cols-3 divide-x border-b'>
                    <div className='p-4 text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {result.created}
                      </div>
                      <div className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>
                        Created
                      </div>
                    </div>
                    <div className='p-4 text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {result.updated}
                      </div>
                      <div className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>
                        Updated
                      </div>
                    </div>
                    <div className='p-4 text-center'>
                      <div
                        className={cn(
                          'text-2xl font-bold',
                          (result.errors?.length || 0) > 0
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                        )}
                      >
                        {result.errors?.length || 0}
                      </div>
                      <div className='text-xs text-muted-foreground uppercase tracking-wider font-semibold'>
                        Errors
                      </div>
                    </div>
                  </div>

                  {/* Error Log */}
                  {(result.errors?.length || 0) > 0 && (
                    <div className='bg-zinc-950 text-zinc-50 p-4 font-mono text-xs overflow-x-auto max-h-[300px]'>
                      <div className='flex items-center gap-2 text-zinc-400 mb-2 pb-2 border-b border-zinc-800'>
                        <Terminal className='h-3 w-3' />
                        <span>Error Log Output</span>
                      </div>
                      <div className='space-y-3'>
                        {result.errors.slice(0, 50).map((x: any, i: number) => (
                          <div key={i} className='flex gap-3'>
                            <span className='text-zinc-500 shrink-0 select-none'>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div>
                              <span className='text-red-400 font-bold'>
                                Line {x.row}:
                              </span>
                              <span className='ml-2 text-zinc-300'>
                                {x.error}
                              </span>
                              <div className='mt-1 text-zinc-500'>
                                {JSON.stringify(x.data)}
                              </div>
                            </div>
                          </div>
                        ))}
                        {result.errors.length > 50 && (
                          <div className='text-zinc-500 italic pt-2'>
                            ... {result.errors.length - 50} more errors hidden
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          {/* LEFT: Configuration Panel */}
          <Card className='lg:col-span-1 shadow-sm border-border/60 h-fit'>
            <CardHeader>
              <CardTitle className='text-lg'>Configuration</CardTitle>
              <CardDescription>Setup your import parameters</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-3'>
                <Label>Data Type</Label>
                <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='categories'>Menu Categories</SelectItem>
                    <SelectItem value='menu_items'>Menu Items</SelectItem>
                    <SelectItem value='ingredients'>Ingredients</SelectItem>
                    <SelectItem value='recipes'>Recipes</SelectItem>
                  </SelectContent>
                </Select>
                <div
                  className={cn(
                    'text-xs px-3 py-2 rounded-md border',
                    getTypeColor(kind)
                  )}
                >
                  Target:{' '}
                  <strong>{kind.replace('_', ' ').toUpperCase()}</strong> table
                </div>
              </div>

              <div className='flex items-center justify-between space-x-2 border rounded-lg p-3 bg-muted/20'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>Dry Run</Label>
                  <p className='text-xs text-muted-foreground'>
                    Simulate import without saving
                  </p>
                </div>
                <Switch checked={dryRun} onCheckedChange={setDryRun} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
