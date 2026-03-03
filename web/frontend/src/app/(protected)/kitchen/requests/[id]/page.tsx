'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getKitchenPurchaseRequest,
  submitKitchenPurchaseRequest,
  convertKitchenPurchaseRequestToDraft,
  type KitchenPurchaseRequest,
} from '@/lib/kitchen';
import { listSuppliers, type Supplier } from '@/lib/purchases';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, AlertTriangle, ClipboardList } from 'lucide-react';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseError(error: any): string {
  if (!error) return 'Request failed.';
  if (typeof error === 'string') return error;
  if (error.detail) return String(error.detail);
  const firstKey = Object.keys(error)[0];
  const value = firstKey ? error[firstKey] : null;
  if (Array.isArray(value) && value.length) return String(value[0]);
  if (typeof value === 'string') return value;
  return 'Request failed.';
}

function fmtQty(v: string | number | null | undefined) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

export default function KitchenRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [requestData, setRequestData] = useState<KitchenPurchaseRequest | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [convertOpen, setConvertOpen] = useState(false);
  const [supplierId, setSupplierId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => todayISO());
  const [invoiceNo, setInvoiceNo] = useState('');
  const [note, setNote] = useState('');

  const requestId = Number(params.id);

  async function loadData() {
    if (!Number.isFinite(requestId)) {
      setErr('Invalid request id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      const [req, supplierRows] = await Promise.all([
        getKitchenPurchaseRequest(requestId),
        listSuppliers(),
      ]);

      setRequestData(req);
      setSuppliers(supplierRows);

      if (supplierRows.length && !supplierId) {
        setSupplierId(String(supplierRows[0].id));
      }
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const totalSuggested = useMemo(() => {
    return (requestData?.lines || []).reduce((acc, line) => acc + Number(line.suggested_purchase_qty || 0), 0);
  }, [requestData]);

  async function handleSubmit() {
    if (!requestData) return;
    setSaving(true);
    setErr(null);
    setSuccess(null);

    try {
      const updated = await submitKitchenPurchaseRequest(requestData.id);
      setRequestData(updated);
      setSuccess(`Request #${updated.id} submitted.`);
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (!requestData || !supplierId) return;

    setSaving(true);
    setErr(null);
    setSuccess(null);

    try {
      const invoice = await convertKitchenPurchaseRequestToDraft(requestData.id, {
        supplier: Number(supplierId),
        invoice_date: invoiceDate,
        invoice_no: invoiceNo,
        note,
      });

      setConvertOpen(false);
      setSuccess(`Request converted to purchase invoice #${invoice.id}.`);
      router.push(`/purchases/${invoice.id}`);
    } catch (e: any) {
      setErr(parseError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className='p-8 text-center text-muted-foreground'>Loading kitchen request...</div>;
  }

  if (!requestData) {
    return (
      <div className='space-y-4'>
        <div className='rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
          {err || 'Kitchen request not found.'}
        </div>
        <Button variant='outline' onClick={() => router.push('/kitchen')}>
          <ArrowLeft className='h-4 w-4 mr-2' /> Back to Kitchen
        </Button>
      </div>
    );
  }

  const canSubmit = requestData.status === 'DRAFT';
  const canConvert = requestData.status !== 'CANCELLED' && requestData.status !== 'CONVERTED';

  return (
    <div className='flex flex-col gap-6 mx-auto w-full max-w-6xl'>
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-1'>
          <Button variant='ghost' className='-ml-2 px-2' onClick={() => router.push('/kitchen')}>
            <ArrowLeft className='h-4 w-4 mr-2' /> Back to Kitchen
          </Button>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>Kitchen Request #{requestData.id}</h1>
          <p className='text-sm text-muted-foreground'>Review line items and convert to purchase draft invoice.</p>
        </div>
        <Badge variant={requestData.status === 'DRAFT' ? 'secondary' : 'outline'}>{requestData.status}</Badge>
      </div>

      {(err || success) && (
        <div className='space-y-2'>
          {err && (
            <div className='flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
              <AlertTriangle className='h-4 w-4' /> {err}
            </div>
          )}
          {success && (
            <div className='rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'>
              {success}
            </div>
          )}
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Request Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-semibold'>{requestData.request_date}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Source Plan Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-semibold'>{requestData.source_plan_date || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Suggested Purchase Qty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-xl font-semibold'>{fmtQty(totalSuggested)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ClipboardList className='h-4 w-4' /> Line Items
          </CardTitle>
          <CardDescription>Ingredients required from low-stock planning alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className='text-right'>Required</TableHead>
                  <TableHead className='text-right'>Current Stock</TableHead>
                  <TableHead className='text-right'>Reorder Level</TableHead>
                  <TableHead className='text-right'>Suggested Buy</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(requestData.lines || []).map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.item_name || line.item}</TableCell>
                    <TableCell className='text-right'>{fmtQty(line.required_qty)}</TableCell>
                    <TableCell className='text-right'>{fmtQty(line.current_stock)}</TableCell>
                    <TableCell className='text-right'>{fmtQty(line.reorder_level)}</TableCell>
                    <TableCell className='text-right'>{fmtQty(line.suggested_purchase_qty)}</TableCell>
                    <TableCell>{line.reason || '-'}</TableCell>
                  </TableRow>
                ))}
                {!(requestData.lines || []).length && (
                  <TableRow>
                    <TableCell colSpan={6} className='h-20 text-center text-muted-foreground'>No line items in this request.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          {requestData.note && <CardDescription>{requestData.note}</CardDescription>}
        </CardHeader>
        <CardContent className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={handleSubmit} disabled={!canSubmit || saving}>
            Submit Request
          </Button>
          <Button onClick={() => setConvertOpen(true)} disabled={!canConvert || saving}>
            Convert to Purchase Draft
          </Button>
        </CardContent>
      </Card>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Request #{requestData.id}</DialogTitle>
            <DialogDescription>Create a draft purchase invoice from this kitchen request.</DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-2'>
            <div className='grid gap-2'>
              <Label>Supplier</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select supplier' />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={String(supplier.id)}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label>Invoice Date</Label>
              <Input type='date' value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
            <div className='grid gap-2'>
              <Label>Invoice No</Label>
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} placeholder='Optional invoice reference' />
            </div>
            <div className='grid gap-2'>
              <Label>Note</Label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder='Optional note' />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button onClick={handleConvert} disabled={saving || !supplierId}>Convert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
