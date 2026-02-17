'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listSuppliers,
  createPurchaseInvoice,
  Supplier,
} from '@/lib/purchases';
import { listInventoryItems, InventoryItem } from '@/lib/inventory';
import {
  ArrowLeft,
  Calendar,
  Hash,
  Plus,
  Save,
  Trash2,
  User,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

type Line = {
  itemId: string;
  qty: string;
  unitCost: string;
};

// Utility for safe number parsing
function n(v: string) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function generateReferenceNumber() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // 20231025
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `PUR-${dateStr}-${random}`;
}

export default function NewPurchaseInvoicePage() {
  const router = useRouter();

  // --- Data State ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);

  // --- Form State ---
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState(() => generateReferenceNumber());
  const [invoiceDate, setInvoiceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { itemId: '', qty: '1', unitCost: '0' },
  ]);

  // --- UI State ---
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load Data
  useEffect(() => {
    (async () => {
      const [sups, inv] = await Promise.all([
        listSuppliers(),
        listInventoryItems(),
      ]);
      setSuppliers(sups);
      setItems(inv);
    })();
  }, []);

  // --- Calculations ---
  const itemMap = useMemo(() => {
    const m = new Map<number, InventoryItem>();
    items.forEach((it) => m.set(it.id, it));
    return m;
  }, [items]);

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + n(l.qty) * n(l.unitCost), 0),
    [lines]
  );

  const total = useMemo(() => {
    const t = subtotal - n(discount) + n(tax);
    return t < 0 ? 0 : t;
  }, [subtotal, discount, tax]);

  // --- Actions ---
  function addLine() {
    setLines((prev) => [...prev, { itemId: '', qty: '1', unitCost: '0' }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    );
  }

  function validate(): string | null {
    if (!supplierId) return 'Please select a supplier.';
    if (!invoiceDate) return 'Invoice date is required.';
    if (lines.length === 0) return 'At least one line item is required.';

    for (const [i, l] of lines.entries()) {
      if (!l.itemId) return `Row ${i + 1}: Please select an item.`;
      if (n(l.qty) <= 0)
        return `Row ${i + 1}: Quantity must be greater than 0.`;
      if (n(l.unitCost) < 0)
        return `Row ${i + 1}: Unit cost cannot be negative.`;
    }
    return null;
  }

  async function onSubmit() {
    setErr(null);
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplier: Number(supplierId),
        invoice_no: invoiceNo.trim(),
        invoice_date: invoiceDate,
        discount: n(discount).toFixed(2),
        tax: n(tax).toFixed(2),
        note: note.trim(),
        lines: lines.map((l) => ({
          item: Number(l.itemId),
          qty: n(l.qty).toFixed(2),
          unit_cost: n(l.unitCost).toFixed(2),
        })),
      };

      await createPurchaseInvoice(payload);
      router.push('/purchases');
    } catch (e: any) {
      setErr(
        e?.detail || 'Failed to create invoice. Please check your inputs.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      {/* Top Navigation */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' onClick={() => router.back()}>
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              New Purchase Invoice
            </h1>
            <p className='text-sm text-muted-foreground'>
              Record incoming stock and expenses.
            </p>
          </div>
        </div>
      </div>

      {err && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      )}

      <div className='grid gap-6 md:grid-cols-12'>
        {/* LEFT COL: Invoice Metadata */}
        <div className='md:col-span-12 lg:col-span-12 space-y-6'>
          <Card>
            <CardHeader className='pb-4'>
              <CardTitle className='text-base font-medium flex items-center gap-2'>
                <User className='h-4 w-4 text-muted-foreground' />
                Supplier Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-6 sm:grid-cols-3'>
                <div className='space-y-2'>
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger
                      className={!supplierId ? 'text-muted-foreground' : ''}
                    >
                      <SelectValue placeholder='Select supplier...' />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Invoice Date</Label>
                  <div className='relative'>
                    <Input
                      type='date'
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className='pl-9'
                    />
                    <Calendar className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label>Reference No</Label>
                    <span
                      className='text-[10px] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary flex items-center gap-1'
                      onClick={() => setInvoiceNo(generateReferenceNumber())}
                    >
                      <RefreshCw className='h-3 w-3' /> Auto-Generate
                    </span>
                  </div>

                  <div className='relative'>
                    <Input
                      placeholder='e.g. INV-2024-001'
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      className='pr-8 font-mono uppercase' // Monospace font looks more like an ID
                    />
                    {/* Optional: Inline reset button */}
                    <button
                      onClick={() => setInvoiceNo(generateReferenceNumber())}
                      className='absolute right-2 top-2.5 text-muted-foreground hover:text-foreground transition-colors'
                      title='Regenerate Reference ID'
                    >
                      <RefreshCw className='h-4 w-4' />
                    </button>
                  </div>
                  <p className='text-[0.8rem] text-muted-foreground'>
                    Internal tracking ID or Supplier Invoice #
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LINE ITEMS SECTION */}
          <Card className='overflow-hidden'>
            <CardHeader className='bg-muted/30 pb-4 border-b'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base font-medium'>
                  Items & Cost
                </CardTitle>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={addLine}
                  className='h-8 gap-1'
                >
                  <Plus className='h-3.5 w-3.5' /> Add Item
                </Button>
              </div>
            </CardHeader>

            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[40%] min-w-[200px]'>
                      Item
                    </TableHead>
                    <TableHead className='w-[15%]'>Stock Info</TableHead>
                    <TableHead className='w-[15%]'>Quantity</TableHead>
                    <TableHead className='w-[15%]'>Unit Cost</TableHead>
                    <TableHead className='w-[10%] text-right'>Total</TableHead>
                    <TableHead className='w-[5%]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, idx) => {
                    const selectedItem = l.itemId
                      ? itemMap.get(Number(l.itemId))
                      : null;
                    const lineTotal = n(l.qty) * n(l.unitCost);

                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select
                            value={l.itemId}
                            onValueChange={(v) =>
                              updateLine(idx, { itemId: v })
                            }
                          >
                            <SelectTrigger className='border-0 shadow-none focus:ring-0 px-0 h-auto font-medium'>
                              <SelectValue placeholder='Select an item' />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map((it) => (
                                <SelectItem key={it.id} value={String(it.id)}>
                                  {it.name}{' '}
                                  <span className='text-muted-foreground text-xs ml-2'>
                                    ({it.sku})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {selectedItem ? (
                            <Badge
                              variant='outline'
                              className={
                                Number(selectedItem.current_stock) < 10
                                  ? 'text-amber-600 border-amber-200 bg-amber-50'
                                  : 'text-muted-foreground'
                              }
                            >
                              {selectedItem.current_stock} {selectedItem.unit}
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground text-xs'>
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type='number'
                            className='h-8 w-full min-w-[80px]'
                            min='0'
                            step='any'
                            value={l.qty}
                            onChange={(e) =>
                              updateLine(idx, { qty: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type='number'
                            className='h-8 w-full min-w-[80px]'
                            min='0'
                            step='any'
                            value={l.unitCost}
                            onChange={(e) =>
                              updateLine(idx, { unitCost: e.target.value })
                            }
                          />
                        </TableCell>
                        <TableCell className='text-right font-medium'>
                          {lineTotal.toLocaleString('en-LK', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          {lines.length > 1 && (
                            <Button
                              variant='ghost'
                              size='icon'
                              className='h-8 w-8 text-muted-foreground hover:text-destructive'
                              onClick={() => removeLine(idx)}
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {lines.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-center h-24 text-muted-foreground'
                      >
                        No items added. Click "Add Item" to start.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* FOOTER SUMMARY */}
            <div className='p-6 bg-muted/10 border-t flex flex-col md:flex-row gap-8 justify-between items-start '>
              <div className='w-full md:w-1/2'>
                <Label className='mb-2 block'>Internal Notes</Label>
                <Textarea
                  placeholder='Add notes about this purchase...'
                  className='resize-none bg-background'
                  rows={5}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className='w-full md:w-1/3 space-y-3'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>Subtotal</span>
                  <span>LKR {subtotal.toFixed(2)}</span>
                </div>

                <div className='flex items-center justify-between text-sm gap-4'>
                  <span className='text-muted-foreground'>Discount</span>
                  <div className='flex items-center gap-2 w-[120px]'>
                    <span className='text-muted-foreground'>-</span>
                    <Input
                      type='number'
                      className='h-7 text-right'
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                </div>

                <div className='flex items-center justify-between text-sm gap-4'>
                  <span className='text-muted-foreground'>Tax</span>
                  <div className='flex items-center gap-2 w-[120px]'>
                    <span className='text-muted-foreground'>+</span>
                    <Input
                      type='number'
                      className='h-7 text-right'
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className='flex justify-between items-center pt-1'>
                  <span className='text-base font-semibold'>Total Payable</span>
                  <span className='text-xl font-bold'>
                    LKR{' '}
                    {total.toLocaleString('en-LK', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className='flex justify-end gap-4 pt-4'>
        <Button variant='outline' size='lg' onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          size='lg'
          onClick={onSubmit}
          disabled={saving}
          className='min-w-[150px]'
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' /> Save Invoice
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
