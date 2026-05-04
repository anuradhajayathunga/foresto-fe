'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
// You will need to ensure these exist in your lib file
import {
  fetchMenuItem,
  updateMenuItem,
  fetchCategories,
  Category,
  MenuItem,
  deleteMenuItem,
} from '@/lib/menu';
import { getMe } from '@/lib/auth';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Save,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function EditMenuItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = Number(params.id);

  const [role, setRole] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({
    category: '',
    name: '',
    slug: '',
    description: '',
    price: '',
    is_available: true,
  });

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = role === 'ADMIN' || role === 'MANAGER' || role === 'OWNER';

  // --- 1. Initial Data Fetch ---
  useEffect(() => {
    const init = async () => {
      try {
        const [me, cats, itemData] = await Promise.all([
          getMe(),
          fetchCategories(),
          fetchMenuItem(itemId), // Ensure this API function exists
        ]);

        setRole(me.role || null);
        setCategories(cats);

        // Populate Form
        setForm({
          category: String(itemData.category), // Adjust based on your API response structure
          name: itemData.name,
          slug: itemData.slug,
          description: itemData.description || '',
          price: String(itemData.price),
          is_available: itemData.is_available,
        });
      } catch (error) {
        console.error('Failed to load data:', error);
        setErr('Could not load item details. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    if (itemId) init();
  }, [itemId]);

  // --- 2. Handlers ---

  const handleRegenerateSlug = () => {
    if (!form.name) return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
  };

  async function onSubmit() {
    setErr(null);
    setOk(null);

    if (!canEdit) {
      setErr("You don't have permission to update menu items.");
      return;
    }

    setSaving(true);

    try {
      await updateMenuItem(itemId, {
        category: Number(form.category),
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        price: form.price,
        is_available: form.is_available,
      });

      setOk('Item updated successfully.');
      setTimeout(() => router.push('/menu'), 1000); // Redirect after success
    } catch (e: any) {
      const msg = e?.detail || 'Failed to update menu item';
      setErr(msg);
      setSaving(false);
    }
  }

  async function onDelete() {
    setIsDeleting(true);
    try {
      await deleteMenuItem(itemId);
      // Redirect immediately on success
      router.push('/menu');
    } catch (e: any) {
      setErr(e.detail || 'Failed to delete item');
      setIsDeleting(false); // Stop loading only if error
    }
  }

  // Helper for Preview
  const getCategoryName = (id: string) =>
    categories.find((c) => String(c.id) === id)?.name || 'Uncategorized';

  // --- 3. Loading State (Skeleton) ---
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
    <div className='p-6 md:p-8 w-full max-w-[1600px] mx-auto'>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-border/40 pb-6'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => router.push('/menu')}
              className='bg-background shadow-sm'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Edit Item</h1>
              <p className='text-sm text-muted-foreground'>
                Update details for{' '}
                <span className='font-medium text-foreground'>{form.name}</span>
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='ghost'
                  className='text-destructive hover:text-destructive hover:bg-destructive/10'
                  disabled={isDeleting || saving} // Disable if any action is in progress
                >
                  {isDeleting ? (
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  ) : (
                    <Trash2 className='h-4 w-4 mr-2' />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    <span className='font-semibold text-foreground'>
                      {' '}
                      "{form.name}"{' '}
                    </span>
                    from your menu and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault(); // Prevent auto-closing to show loading state if needed
                      onDelete();
                    }}
                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Item'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className='w-px h-6 bg-border mx-2' />
            <Button
              onClick={onSubmit}
              className='min-w-[120px]'
              disabled={saving}
            >
              {saving ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <Save className='h-4 w-4 mr-2' />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

        </div>

        {!canEdit && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Read-only mode. You cannot save changes.
            </AlertDescription>
          </Alert>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* LEFT: Editor */}
          <div className='lg:col-span-2 space-y-6'>
            {/* General Info */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base font-semibold'>
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Item Name</Label>
                  <Input
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
                    <Label className='flex items-center justify-between'>
                      Slug
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-5 text-[10px] px-1.5 text-muted-foreground'
                        onClick={handleRegenerateSlug}
                        title='Regenerate from name'
                      >
                        <RefreshCw className='h-3 w-3 mr-1' /> Auto
                      </Button>
                    </Label>
                    <Input
                      className='font-mono text-sm bg-muted/30'
                      value={form.slug}
                      onChange={(e) =>
                        setForm({ ...form, slug: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Description</Label>
                  <Textarea
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
                  <CardTitle className='text-base font-semibold'>
                    Pricing & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-5'>
                  <div className='space-y-2'>
                    <Label>Price (LKR)</Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium'>
                        LKR
                      </span>
                      <Input
                        type='number'
                        className='pl-11'
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className='flex items-center justify-between rounded-lg border p-3 bg-muted/20'>
                    <div className='space-y-0.5'>
                      <Label className='text-sm'>Availability</Label>
                      <p className='text-xs text-muted-foreground'>
                        Show on menu
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
                  <CardTitle className='text-base font-semibold'>
                    Media
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='border-2 border-dashed border-border/60 rounded-lg flex flex-col items-center justify-center h-44 bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer'>
                    <div className='bg-background p-3 rounded-full shadow-sm mb-3'>
                      <UploadCloud className='h-5 w-5 text-muted-foreground' />
                    </div>
                    <p className='text-sm font-medium'>
                      Click to replace image
                    </p>
                    <p className='text-xs text-muted-foreground mt-1'>
                      Max 5MB (Coming Soon)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div className='space-y-6'>
            <div className='sticky top-6'>
              <h3 className='text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider'>
                Live Preview
              </h3>

              {/* Preview Card */}
              <Card className='overflow-hidden shadow-lg border-border/60'>
                <div className='relative h-48 bg-muted flex items-center justify-center text-muted-foreground/30'>
                  <ImageIcon className='h-16 w-16' />
                  <div className='absolute top-3 right-3'>
                    <div
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        form.is_available
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}
                    >
                      {form.is_available ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                <CardContent className='p-5 space-y-4'>
                  <div>
                    <h3 className='font-bold text-xl leading-tight'>
                      {form.name || 'Untitled Item'}
                    </h3>
                    <p className='text-sm text-muted-foreground mt-1.5 line-clamp-2'>
                      {form.description || 'No description...'}
                    </p>
                  </div>

                  <div className='pt-4 border-t flex items-center justify-between'>
                    <div>
                      <p className='text-[10px] text-muted-foreground uppercase font-bold tracking-wider'>
                        Price
                      </p>
                      <p className='font-bold text-xl'>
                        LKR {Number(form.price).toFixed(2)}
                      </p>
                    </div>
                    <Badge variant='outline'>
                      {form.category
                        ? getCategoryName(form.category)
                        : 'Uncategorized'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Messages */}
              <div className='mt-6 space-y-3'>
                {err && (
                  <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}
                {ok && (
                  <Alert className='border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'>
                    <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
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
