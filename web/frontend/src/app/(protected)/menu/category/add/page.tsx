'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCategory } from '@/lib/menu';
import {
  ArrowLeft,
  Save,
  Layers,
  Globe,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AddCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const autoSlug = useMemo(() => slugify(name), [name]);

  // Sync slug until manually touched
  useMemo(() => {
    if (!slugTouched) {
      setSlug(autoSlug);
    }
  }, [autoSlug, slugTouched]);

  async function onSubmit() {
    setError(null);
    setOk(null);
    setLoading(true);

    if (!name.trim()) {
      setError('Category name is required');
      setLoading(false);
      return;
    }

    try {
      const finalSlug = (slug.trim() || autoSlug).trim();
      await createCategory({
        name: name.trim(),
        slug: finalSlug,
        sort_order: Number(sortOrder || 0),
        is_active: isActive,
      });

      setOk('Category published successfully!');
      // Reset form
      setName('');
      setSlug('');
      setSortOrder('0');
      setSlugTouched(false);

      // Optional: Redirect after short delay
      setTimeout(() => router.push('/menu'), 1500);
    } catch (e: any) {
      const msg = e?.name?.[0] || e?.slug?.[0] || e?.detail || 'Create failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className=' p-4 md:p-8'>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* 1. Header & Actions */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => router.push('/menu')}
              className='bg-white'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight '>
                New Category
              </h1>
              <p className='text-sm text-gray-500'>
                Define a new section for your menu
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' onClick={() => router.push('/menu')}>
              Discard
            </Button>
            <Button
              onClick={onSubmit}
              className='bg-gray-900 hover:bg-gray-800 text-white gap-2'
              disabled={loading || !name}
            >
              {loading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Save className='h-4 w-4' />
              )}
              {loading ? 'Saving...' : 'Publish Category'}
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* 2. LEFT COLUMN: Editor */}
          <div className='lg:col-span-2 space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>General Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Category Name</Label>
                  <Input
                    placeholder='e.g. Signature Burgers'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='text-lg font-medium'
                  />
                </div>

                <div className='space-y-2'>
                  <Label className='flex items-center gap-2'>
                    <Globe className='h-3.5 w-3.5 text-gray-500' />
                    URL Slug
                  </Label>
                  <div className='flex items-center rounded-md border border-input px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'>
                    <span className='text-sm text-muted-foreground mr-1 whitespace-nowrap'>
                      yoursite.com/menu/
                    </span>
                    <input
                      className='flex h-10 w-full rounded-md bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-muted-foreground font-mono'
                      placeholder='signature-burgers'
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugTouched(true);
                      }}
                    />
                  </div>
                  <p className='text-[11px] text-muted-foreground'>
                    This is the user-friendly link for this category.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Configuration</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Sort Order</Label>
                    <Input
                      type='number'
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className='w-full'
                    />
                    <p className='text-[11px] text-muted-foreground'>
                      Lower numbers appear first (e.g. 0 is top).
                    </p>
                  </div>

                  <div className='flex flex-col justify-end'>
                    <div className='flex items-center justify-between rounded-lg border p-3 bg-gray-50 dark:bg-gray-800'>
                      <div className='space-y-0.5'>
                        <Label className='text-sm'>Visibility</Label>
                        <p className='text-xs text-muted-foreground'>
                          Show in menu immediately
                        </p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {ok && (
              <Alert className='border-green-200 bg-green-50 text-green-800'>
                <CheckCircle2 className='h-4 w-4 text-green-600' />
                <AlertDescription>{ok}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* 3. RIGHT COLUMN: Preview & Context */}
          <div className='space-y-6'>
            <div className='sticky top-6 space-y-6'>
              {/* Visual Preview */}
              <div className='space-y-2'>
                <h3 className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  Live Preview
                </h3>
                <Card className='bg-white border-dashed shadow-sm'>
                  <CardContent className='p-6 flex flex-col items-center justify-center text-center space-y-3'>
                    <p className='text-sm text-gray-400'>
                      How it looks to customers:
                    </p>

                    <div className='flex flex-wrap gap-2 justify-center opacity-50'>
                      <div className='px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-sm border'>
                        Appetizers
                      </div>
                      <div className='px-4 py-2 rounded-full bg-gray-100 text-gray-400 text-sm border'>
                        Drinks
                      </div>
                    </div>

                    {/* The Active Preview */}
                    <div
                      className={`px-5 py-2.5 rounded-full text-sm font-medium border shadow-sm transition-all ${
                        isActive
                          ? 'bg-gray-900 text-white border-gray-900 transform scale-105'
                          : 'bg-gray-50 text-gray-400 border-gray-200 border-dashed'
                      }`}
                    >
                      {name || 'Category Name'}
                    </div>

                    {!isActive && (
                      <Badge variant='secondary' className='mt-2 text-[10px]'>
                        Hidden
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Guidelines */}
              <Card className=' bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm  flex items-center gap-2'>
                    <Layers className='h-4 w-4' />
                    Organizing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className='text-xs  space-y-2'>
                  <p>
                    • Keep names short and descriptive (e.g., "Main Course" vs
                    "Our Delicious Main Courses").
                  </p>
                  <p>
                    • Use the <strong>Sort Order</strong> to control flow. We
                    recommend increments of 10 (10, 20, 30) so you can insert
                    new categories in between later.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
