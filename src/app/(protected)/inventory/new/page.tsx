'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInventoryItem } from '@/lib/inventory';

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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Package, 
  Save, 
  AlertCircle, 
  Tag, 
  Scale, 
  Loader2 
} from 'lucide-react';

type Unit = 'PCS' | 'KG' | 'G' | 'L' | 'ML';

function makeSkuFromName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    sku: string;
    unit: Unit;
    reorder_level: string;
    cost_per_unit: string;
    is_active: boolean;
  }>({
    name: '',
    sku: '',
    unit: 'PCS',
    reorder_level: '10', // Smart default
    cost_per_unit: '',
    is_active: true,
  });

  const [err, setErr] = useState<string | null>(null);
  const [skuTouched, setSkuTouched] = useState(false);

  // Auto-generate SKU
  useEffect(() => {
    if (!skuTouched) {
      setForm((prev) => ({ ...prev, sku: makeSkuFromName(prev.name) }));
    }
  }, [form.name, skuTouched]);

  async function onSubmit() {
    setErr(null);
    if (!form.name) return setErr('Product name is required.');
    
    setLoading(true);
    try {
      await createInventoryItem({
        ...form,
        unit: form.unit,
        reorder_level: form.reorder_level || '0',
        cost_per_unit: form.cost_per_unit || '0',
      });
      router.push('/inventory');
    } catch (e: any) {
      setErr(e?.sku?.[0] || e?.name?.[0] || 'Failed to create item');
      setLoading(false);
    }
  }

  const unitOptions: Unit[] = useMemo(() => ['PCS', 'KG', 'G', 'L', 'ML'], []);

  return (
    <div className=''>
      <div className='mx-auto max-w-5xl space-y-6'>
        
        {/* 1. Header & Actions */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div className='flex items-center gap-4'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => router.push('/inventory')}
              className=''
            >
              <ArrowLeft className='h-6 w-6' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>New Product</h1>
              <p className='text-sm text-gray-500'>Add an item to your inventory tracking.</p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='ghost' onClick={() => router.push('/inventory')}>Discard</Button>
            <Button 
                onClick={onSubmit} 
                disabled={loading || !form.name}
                className='bg-gray-900 hover:bg-gray-800 text-white gap-2'
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 2. LEFT COLUMN: Main Details */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            Product Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className='space-y-2'>
                            <Label>Product Name</Label>
                            <Input
                                placeholder='e.g. Whole Milk, Fresh Tomatoes'
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="text-lg font-medium"
                            />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className='space-y-2'>
                                <Label className="flex items-center justify-between">
                                    SKU 
                                    <span className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">Unique ID</span>
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <Tag className="h-3.5 w-3.5" />
                                    </span>
                                    <Input
                                        value={form.sku}
                                        onChange={(e) => {
                                            setSkuTouched(true);
                                            setForm({ ...form, sku: e.target.value });
                                        }}
                                        className="pl-9 font-mono text-sm"
                                        placeholder="auto-generated"
                                    />
                                </div>
                            </div>

                            <div className='space-y-2'>
                                <Label className="flex items-center gap-2">
                                    Unit of Measure
                                </Label>
                                <Select
                                    value={form.unit}
                                    onValueChange={(v) => setForm({ ...form, unit: v as Unit })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitOptions.map((u) => (
                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pricing Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Scale className="h-4 w-4 text-muted-foreground" />
                            Valuation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2 max-w-sm'>
                            <Label>Cost per Unit (Estimate)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">Rs.</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-10"
                                    value={form.cost_per_unit}
                                    onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Used to calculate total inventory value. Can be updated later.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. RIGHT COLUMN: Settings & Status */}
            <div className="space-y-6">
                
                {/* Inventory Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Stock Control</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Reorder Level</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    className="font-mono"
                                    value={form.reorder_level}
                                    onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                                />
                                <div className="flex items-center px-3 border rounded-md text-sm text-gray-500 font-medium">
                                    {form.unit}
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-tight">
                                System will flag this item as "Low Stock" when quantity drops below this number.
                            </p>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm">Active Status</Label>
                                <p className="text-[11px] text-muted-foreground">Available for recipes</p>
                            </div>
                            <Switch
                                checked={form.is_active}
                                onCheckedChange={(c) => setForm({ ...form, is_active: c })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Badge */}
                <div className="flex justify-center">
                    <Badge variant="outline" className="text-xs  text-gray-400 border-dashed">
                        Preview: {form.name || "Product Name"} ({form.sku || "SKU"})
                    </Badge>
                </div>

                {err && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{err}</AlertDescription>
                    </Alert>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}