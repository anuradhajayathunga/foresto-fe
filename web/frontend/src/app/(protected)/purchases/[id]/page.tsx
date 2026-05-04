'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPurchaseInvoice, PurchaseInvoice, voidPurchaseInvoice } from '@/lib/purchases';
import { 
  ArrowLeft, 
  Printer, 
  Ban, 
  Calendar, 
  Building, 
  FileText,
  AlertCircle 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function PurchaseInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  
  const [inv, setInv] = useState<PurchaseInvoice | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Void Logic
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidErr, setVoidErr] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);

  // Formatters
  const formatCurrency = (val: number | string) => 
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(val));

  async function doVoid() {
    if (!inv) return;
    setVoidErr(null);
    setVoiding(true);
    try {
      const updated = await voidPurchaseInvoice(String(inv.id), voidReason);
      setInv(updated);
      setVoidOpen(false);
      setVoidReason('');
    } catch (e: any) {
      setVoidErr(e?.detail || e?.non_field_errors?.[0] || 'Void failed');
    } finally {
      setVoiding(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const data = await getPurchaseInvoice(params.id);
        setInv(data);
      } catch (e: any) {
        setErr(e?.detail || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading invoice details...</div>;
  
  if (err || !inv) {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-4 mt-2">
            <p>{err || 'Invoice not found'}</p>
            <Button variant='outline' className="w-fit bg-background text-foreground" onClick={() => router.push('/purchases')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
            </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const isVoid = inv.status === 'VOID';

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      
      {/* Header & Navigation */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className="flex items-center gap-3">
             <Button variant='ghost' size="icon" onClick={() => router.push('/purchases')}>
                <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
                <h1 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
                    Invoice #{inv.id}
                    {isVoid && <Badge variant="destructive">VOIDED</Badge>}
                </h1>
                <p className='text-sm text-muted-foreground'>
                   Created on {new Date(inv.invoice_date).toLocaleDateString()}
                </p>
             </div>
        </div>

        <div className='flex items-center gap-2'>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
            </Button>

            <Dialog open={voidOpen} onOpenChange={(v) => { setVoidOpen(v); if (!v) setVoidErr(null); }}>
                <DialogTrigger asChild>
                    <Button 
                        variant='destructive' 
                        className="gap-2"
                        disabled={isVoid}
                        onClick={() => setVoidOpen(true)}
                    >
                        <Ban className="h-4 w-4" /> 
                        {isVoid ? 'Voided' : 'Void Invoice'}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Void Invoice #{inv.id}</DialogTitle>
                        <DialogDescription>
                            Are you sure? This will reverse stock levels. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='space-y-4 py-4'>
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                            <strong>Warning:</strong> Stock items from this invoice will be deducted from inventory.
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason for voiding</label>
                            <Textarea
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                placeholder='e.g., Wrong items received, Duplicate entry...'
                            />
                        </div>

                        {voidErr && <p className='text-sm text-destructive font-medium'>{voidErr}</p>}
                    </div>

                    <DialogFooter>
                        <Button variant='ghost' onClick={() => setVoidOpen(false)}>Cancel</Button>
                        <Button variant='destructive' onClick={doVoid} disabled={voiding}>
                            {voiding ? 'Processing...' : 'Confirm Void'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {isVoid && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <Ban className="h-4 w-4" />
            <AlertTitle>This invoice has been voided</AlertTitle>
            <AlertDescription>
                Stock levels have been reversed. No further actions can be performed on this record.
            </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* MAIN CONTENT: Items & Totals */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle className="text-base">Line Items</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50%]">Item Description</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inv.lines.map((l) => (
                                <TableRow key={l.id}>
                                    <TableCell className="font-medium">
                                        {l.item_name}
                                        {/* <div className="text-xs text-muted-foreground">SKU: {l.item_sku}</div> */}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">{l.qty}</TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground">
                                        {Number(l.unit_cost).toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                        {Number(l.line_total).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {inv.lines.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No items recorded.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Financial Summary */}
            <div className="flex justify-start">
                <Card className="min-w-full sm:w-80">
                    <CardContent className="pt-6 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrency(inv.subtotal)}</span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Discount</span>
                            <span className="text-green-600">
                                {Number(inv.discount) > 0 ? '-' : ''} {formatCurrency(inv.discount)}
                            </span>
                        </div>
                         <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax</span>
                            <span className="text-red-600">+ {formatCurrency(inv.tax)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-end">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-2xl">{formatCurrency(inv.total)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* SIDEBAR: Metadata */}
        <div className="space-y-6">
            
            {/* Supplier Info */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Building className="h-4 w-4" /> Supplier
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-semibold">{inv.supplier_name}</div>
                    {/* Placeholder for future contact details */}
                    <div className="text-sm text-muted-foreground mt-1">
                        Supplier ID: #{inv.supplier}
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
                <CardHeader className="pb-3">
                     <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 text-sm">
                        <span className="text-muted-foreground col-span-1 py-1">Ref No:</span>
                        <span className="font-mono col-span-2 py-1 text-right">{inv.invoice_no || '—'}</span>
                        
                        <span className="text-muted-foreground col-span-1 py-1">Date:</span>
                        <span className="col-span-2 py-1 text-right">{inv.invoice_date}</span>

                        <span className="text-muted-foreground col-span-1 py-1">System ID:</span>
                        <span className="font-mono col-span-2 py-1 text-right">#{inv.id}</span>
                    </div>

                    {inv.note && (
                        <>
                            <Separator />
                            <div>
                                <span className="text-xs font-semibold block mb-1">Note:</span>
                                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-2 rounded">
                                    {inv.note}
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}