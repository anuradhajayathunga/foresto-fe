'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSale } from "@/lib/sales";
import { 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  User, 
  Printer,
  Download,
  Share2,
  FileText,
  CheckCircle2,
  Clock
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// --- Types ---
type SaleItem = {
  id: number;
  name: string;
  qty: number;
  line_total: string;
  unit_price?: string;
};

type Sale = {
  id: number;
  created_at: string;
  customer_name?: string;
  payment_method: string;
  status: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  items: SaleItem[];
};

export default function SaleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSale(params.id);
        setSale(data);
      } catch (error) {
        console.error('Failed to load sale:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  // --- Formatters ---
  const formatCurrency = (val: string | number) => 
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(Number(val));

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-GB', { 
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const getStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'paid') return { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 };
    if (s === 'pending') return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
    if (s === 'cancelled') return { color: 'bg-red-100 text-red-700 border-red-200', icon: FileText };
    return { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText };
  };

  // --- Loading State ---
  if (loading) return (
    <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 border-r-transparent"/>
            <p className="text-sm text-muted-foreground">Retrieving transaction...</p>
        </div>
    </div>
  );

  if (!sale) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Sale Not Found</h1>
        <Button onClick={() => router.push('/sales')}>Return to Sales</Button>
    </div>
  );

  const StatusIcon = getStatusStyles(sale.status).icon;

  return (
    <div className="p-0">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* 1. HEADER & ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.push('/sales')} className="bg-white">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Sale #{sale.id}</h1>
                        <Badge variant="outline" className={`gap-1.5 pl-1.5 pr-2.5 py-0.5 ${getStatusStyles(sale.status).color}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {sale.status}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Processed on {formatDate(sale.created_at)}
                    </p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button variant="outline" className="bg-white shadow-sm gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print
                </Button>
                <Button variant="outline" className="bg-white shadow-sm gap-2">
                    <Download className="h-4 w-4" /> Invoice
                </Button>
                <Button className="gap-2 bg-gray-900 text-white">
                    <Share2 className="h-4 w-4" /> Share
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 2. LEFT COLUMN: INVOICE DETAILS */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                    <CardHeader className="border-b pb-4">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            Order Summary
                        </CardTitle>
                    </CardHeader>
                    
                    <div className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[50%] pl-6">Item Description</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-center">Qty</TableHead>
                                    <TableHead className="text-right pr-6">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sale.items.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                        <TableCell className="pl-6 font-medium ">
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground font-mono">
                                            {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {item.qty}
                                        </TableCell>
                                        <TableCell className="text-right pr-6 font-medium font-mono">
                                            {formatCurrency(item.line_total)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t">
                        <div className="flex flex-col gap-3 ml-auto max-w-xs">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(sale.subtotal)}</span>
                            </div>
                            
                            {Number(sale.discount) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="text-red-600">-{formatCurrency(sale.discount)}</span>
                                </div>
                            )}

                            {Number(sale.tax) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span className="">+{formatCurrency(sale.tax)}</span>
                                </div>
                            )}
                            
                            <Separator className="my-2" />
                            
                            <div className="flex justify-between items-end">
                                <span className="font-semibold ">Total Paid</span>
                                <span className="text-2xl font-bold tracking-tight">
                                    {formatCurrency(sale.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 3. RIGHT COLUMN: CONTEXT (SIDEBAR) */}
            <div className="space-y-6">
                
                {/* Customer Card */}
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Customer Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold ">
                                    {sale.customer_name || 'Walk-in Customer'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Standard Client
                                </p>
                            </div>
                        </div>
                        {/* Mock data placeholders for "Actual Value" look */}
                        {sale.customer_name && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-muted-foreground block">Last Visit</span>
                                    <span className="font-medium">2 days ago</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Total Spend</span>
                                    <span className="font-medium">LKR 45,200</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Card */}
                <Card className="shadow-sm border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Payment Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold ">
                                    {sale.payment_method}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Transaction Complete
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Reference ID</span>
                                <span className="font-mono ">TXN-{sale.id}-{new Date(sale.created_at).getTime().toString().slice(-4)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date</span>
                                <span className="">{formatDate(sale.created_at)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
      </div>
    </div>
  );
}