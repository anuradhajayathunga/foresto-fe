'use client';

import { useEffect, useMemo, useState } from 'react';
import { getIngredientPlan } from '@/lib/forecasting';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useRouter } from 'next/navigation';
import {
  createPurchaseDraftFromForecast,
  listedSuppliers,
} from '@/lib/purchases';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ForecastIngredientsPage() {
  const [scope, setScope] = useState<'tomorrow' | 'next7'>('next7');
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const [draftOpen, setDraftOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>(
    []
  );
  const [supplierId, setSupplierId] = useState<string>('none');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setSuppliers(await listedSuppliers());
      } catch {}
    })();
  }, []);

  async function createDraft() {
    setCreating(true);
    setErr(null);
    try {
      const res = await createPurchaseDraftFromForecast({
        scope,
        horizon_days: 7,
        top_n: 200,
        include_ok: false,
        supplier: supplierId === 'none' ? undefined : Number(supplierId),
        note: `Auto draft from forecast scope=${scope}`,
      });
      setDraftOpen(false);
      router.push(`/purchases/${res.id}`);
    } catch (e: any) {
      setErr(e?.detail || 'Failed to create purchase draft');
    } finally {
      setCreating(false);
    }
  }

  async function load() {
    setErr(null);
    try {
      setData(await getIngredientPlan(scope, 7, 200));
    } catch (e: any) {
      setErr(e?.detail || 'Failed to load ingredient plan');
    }
  }

  useEffect(() => {
    load();
  }, [scope]);

  const summary = useMemo(() => {
    const ings = data?.ingredients || [];
    const out = ings.filter((x: any) => x.status === 'OUT').length;
    const low = ings.filter((x: any) => x.status === 'LOW').length;
    return { out, low, total: ings.length };
  }, [data]);

  function statusBadge(s: string) {
    if (s === 'OUT') return <Badge variant='destructive'>OUT</Badge>;
    if (s === 'LOW') return <Badge variant='secondary'>LOW</Badge>;
    return <Badge>OK</Badge>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-end justify-between'>
        <div>
          <h1 className='text-2xl font-semibold'>Ingredient Suggestions</h1>
          <p className='text-sm text-muted-foreground'>
            Based on predicted sales ({scope}) starting{' '}
            {data?.start_date || '—'}
          </p>
        </div>

        <div className='flex gap-2'>
          <Button
            variant={scope === 'tomorrow' ? 'default' : 'outline'}
            onClick={() => setScope('tomorrow')}
          >
            Tomorrow
          </Button>
          <Button
            variant={scope === 'next7' ? 'default' : 'outline'}
            onClick={() => setScope('next7')}
          >
            Next 7 Days
          </Button>
          <Button variant='outline' onClick={load}>
            Refresh
          </Button>
          <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
            <DialogTrigger asChild>
              <Button>Create Purchase Draft</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Purchase Invoice Draft</DialogTitle>
              </DialogHeader>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Supplier (optional)</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select supplier' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>No supplier</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className='text-sm text-muted-foreground'>
                  Draft invoice lines will be created using suggested purchase
                  quantities from the forecast.
                </p>

                <div className='flex justify-end gap-2'>
                  <Button variant='outline' onClick={() => setDraftOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDraft} disabled={creating}>
                    {creating ? 'Creating...' : 'Create Draft'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {err && <p className='text-sm text-destructive'>{err}</p>}

      <div className='grid gap-4 sm:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>Ingredients Checked</CardTitle>
          </CardHeader>
          <CardContent className='text-2xl font-semibold'>
            {summary.total}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>LOW</CardTitle>
          </CardHeader>
          <CardContent className='text-2xl font-semibold'>
            {summary.low}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm'>OUT</CardTitle>
          </CardHeader>
          <CardContent className='text-2xl font-semibold'>
            {summary.out}
          </CardContent>
        </Card>
      </div>

      {data?.items_missing_recipes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Missing Recipes</CardTitle>
            <CardDescription>
              These menu items have predicted demand but no recipe lines, so
              ingredient needs can’t be calculated.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-sm'>
            <ul className='list-disc pl-5 space-y-1'>
              {data.items_missing_recipes.map((x: any) => (
                <li key={x.menu_item_id}>{x.menu_item_name}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Purchase Suggestions</CardTitle>
          <CardDescription>
            Suggested purchase keeps projected remaining stock at least the
            reorder level.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0 border rounded-lg'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Current</TableHead>
                <TableHead className='text-right'>Required</TableHead>
                <TableHead className='text-right'>Projected</TableHead>
                <TableHead className='text-right'>Reorder</TableHead>
                <TableHead className='text-right'>Suggest Buy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.ingredients?.map((x: any) => (
                <TableRow key={x.ingredient_id}>
                  <TableCell className='font-medium'>
                    {x.ingredient_name}{' '}
                    <span className='text-xs text-muted-foreground'>
                      ({x.unit})
                    </span>
                  </TableCell>
                  <TableCell>{x.sku}</TableCell>
                  <TableCell>{statusBadge(x.status)}</TableCell>
                  <TableCell className='text-right'>
                    {x.current_stock}
                  </TableCell>
                  <TableCell className='text-right'>{x.required_qty}</TableCell>
                  <TableCell className='text-right'>
                    {x.projected_remaining}
                  </TableCell>
                  <TableCell className='text-right'>
                    {x.reorder_level}
                  </TableCell>
                  <TableCell className='text-right font-semibold'>
                    {x.suggested_purchase_qty}
                  </TableCell>
                </TableRow>
              ))}

              {!data?.ingredients?.length && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className='text-sm text-muted-foreground'
                  >
                    No ingredient plan available (need recipes + inventory
                    items).
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
