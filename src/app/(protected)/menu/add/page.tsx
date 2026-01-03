'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMenuItem, fetchCategories, Category } from '@/lib/menu';
import { getMe } from '@/lib/auth';

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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  Save,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AddMenuItemPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    category: '',
    name: '',
    slug: '',
    description: '',
    price: '',
    is_available: true,
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = role === 'ADMIN' || role === 'MANAGER';

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe();
        setRole(me.role || null);
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const autoSlug = useMemo(() => slugify(form.name), [form.name]);

  useEffect(() => {
    setForm((prev) => {
      const shouldAuto = !slugTouched || prev.slug.trim() === '';
      if (!shouldAuto) return prev;
      if (prev.slug === autoSlug) return prev;
      return { ...prev, slug: autoSlug };
    });
  }, [autoSlug, slugTouched]);

  const redirectTimer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  async function onSubmit() {
    setErr(null);
    setOk(null);

    if (!canEdit) {
      setErr("You don't have permission to add menu items.");
      return;
    }

    setSaving(true);

    try {
      await createMenuItem({
        category: Number(form.category),
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        price: form.price.trim(),
        is_available: form.is_available,
      });

      setOk('Item added to menu successfully.');
      setForm((prev) => ({
        category: prev.category,
        name: '',
        slug: '',
        description: '',
        price: '',
        is_available: true,
      }));
      setSlugTouched(false);

      redirectTimer.current = window.setTimeout(
        () => router.push('/menu'),
        1500
      );
    } catch (e: any) {
      const msg =
        e?.detail ||
        e?.category?.[0] ||
        e?.name?.[0] ||
        e?.slug?.[0] ||
        e?.price?.[0] ||
        'Failed to create menu item';
      setErr(msg);
      setSaving(false); // Stop loading if error
    }
  }

  // Helper to find category name for preview
  const getCategoryName = (id: string) =>
    categories.find((c) => String(c.id) === id)?.name || 'Uncategorized';

  if (loading) {
    return (
      <div className='mx-auto max-w-6xl space-y-6 p-6'>
        <div className='flex justify-between items-center'>
          <Skeleton className='h-8 w-32' />
          <Skeleton className='h-10 w-24' />
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <Skeleton className='h-[300px] w-full rounded-xl' />
            <Skeleton className='h-[200px] w-full rounded-xl' />
          </div>
          <Skeleton className='h-[400px] w-full rounded-xl' />
        </div>
      </div>
    );
  }

  return (
    <div className=''>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* 1. Header */}
        <div className='flex items-center justify-between'>
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
              <h1 className='text-2xl font-bold tracking-tight'>Create Item</h1>
              <p className='text-sm text-gray-500'>
                Add a new dish to your catalog
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
              disabled={saving || !form.name || !form.price || !form.category}
            >
              {saving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Save className='h-4 w-4' />
              )}
              {saving ? 'Saving...' : 'Publish Item'}
            </Button>
          </div>
        </div>

        {!canEdit && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Permission denied. You cannot create items.
            </AlertDescription>
          </Alert>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* 2. LEFT COLUMN: Editor Form */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Basic Details */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Item Name</Label>
                  <Input
                    placeholder='e.g. Classic Beef Burger'
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className='grid sm:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select Category' />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <Label>Slug (URL Path)</Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'>
                        /
                      </span>
                      <Input
                        className='pl-6 font-mono text-sm bg-gray-50 dark:bg-gray-800'
                        placeholder='classic-beef-burger'
                        value={form.slug}
                        onChange={(e) => {
                          setForm({ ...form, slug: e.target.value });
                          setSlugTouched(e.target.value.trim() !== '');
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Description</Label>
                  <Textarea
                    placeholder='Ingredients, allergens, or special details...'
                    className='min-h-[120px] resize-none'
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Media */}
            <div className='grid sm:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Pricing & Stock</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Price (LKR)</Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm'>
                        LKR
                      </span>
                      <Input
                        type='number'
                        className='pl-10'
                        placeholder='0.00'
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className='flex items-center justify-between rounded-lg border p-3 bg-gray-50 dark:bg-gray-800'>
                    <div className='space-y-0.5'>
                      <Label className='text-sm'>Available for Sale</Label>
                      <p className='text-xs text-muted-foreground'>
                        Item can be ordered immediately
                      </p>
                    </div>
                    <Switch
                      checked={form.is_available}
                      onCheckedChange={(c) =>
                        setForm({ ...form, is_available: c })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center h-40 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors cursor-pointer group'>
                    <div className='bg-white p-2 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform'>
                      <UploadCloud className='h-5 w-5 text-gray-400' />
                    </div>
                    <p className='text-sm font-medium text-gray-600'>
                      Click to upload image
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      SVG, PNG, JPG or GIF
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3. RIGHT COLUMN: Live Preview */}
          <div className='space-y-6'>
            <div className='sticky top-6'>
              <h3 className='text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider'>
                Live Preview
              </h3>

              {/* The Card Component being Previewed */}
              <Card className='overflow-hidden shadow-md border-gray-200'>
                <div className='relative h-48 bg-gray-100 flex items-center justify-center text-gray-300'>
                  <ImageIcon className='h-12 w-12' />
                  {/* Mock Badge in Preview */}
                  <div className='absolute top-3 right-3'>
                    <Badge
                      variant='secondary'
                      className={
                        form.is_available
                          ? 'bg-white text-green-700'
                          : 'bg-white text-gray-500'
                      }
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full mr-2 ${
                          form.is_available ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      {form.is_available ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <CardContent className='p-4 space-y-3'>
                  <div>
                    <h3 className='font-semibold text-gray-900 text-lg line-clamp-1'>
                      {form.name || 'Item Name'}
                    </h3>
                    <p className='text-sm text-gray-500 mt-1 line-clamp-2'>
                      {form.description || 'No description provided yet...'}
                    </p>
                  </div>

                  <div className='pt-3 border-t flex items-center justify-between'>
                    <div>
                      <p className='text-xs text-gray-400 uppercase font-bold'>
                        Price
                      </p>
                      <p className='font-bold text-xl text-gray-900'>
                        LKR {Number(form.price).toFixed(2)}
                      </p>
                    </div>
                    <Badge variant='outline' className='border-gray-200'>
                      {form.category
                        ? getCategoryName(form.category)
                        : 'Category'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Messages */}
              <div className='mt-6 space-y-3'>
                {err && (
                  <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}
                {ok && (
                  <Alert className='border-green-200 bg-green-50 text-green-800'>
                    <CheckCircle2 className='h-4 w-4 text-green-600' />
                    <AlertDescription>{ok}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
