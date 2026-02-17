'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { listSales } from '@/lib/sales';
import {
  Plus,
  Search,
  CreditCard,
  ArrowUpRight,
  Calendar as CalendarIcon,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownRight,
  FileText,
  FileDown,
  Globe,
  Banknote,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils'; // Ensure you have a utils file with clsx/tailwind-merge
import { CsvImporter } from '@/components/csv-importer';

type Sale = {
  id: number;
  total: string;
  created_at: string;
  payment_method: string;
  status: string;
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await listSales();
        setSales(data);
      } catch (error) {
        console.error('Failed to load sales:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Metrics Calculation ---
  const metrics = useMemo(() => {
    const totalRevenue = sales
      .filter((s) => s.status.toLowerCase() === 'paid')
      .reduce((sum, sale) => sum + parseFloat(sale.total || '0'), 0);
    const count = sales.length;
    const averageOrder = count > 0 ? totalRevenue / count : 0;

    // Calculate success rate based on 'completed' status
    const successful = sales.filter(
      (s) => s.status.toLowerCase() === 'paid'
    ).length;
    const successRate = count > 0 ? (successful / count) * 100 : 0;

    return { totalRevenue, count, averageOrder, successRate };
  }, [sales]);

  // --- Filtering ---
  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sales;
    return sales.filter(
      (s) =>
        s.id.toString().includes(q) ||
        s.payment_method.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
    );
  }, [sales, search]);

  // --- Formatters ---
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
    }).format(val);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'completed':
      case 'paid':
        return {
          color:
            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
          icon: CheckCircle2,
        };
      case 'draf':
        return {
          color:
            'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
          icon: Clock,
        };
      case 'void':
      case 'refunded':
        return {
          color:
            'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
          icon: XCircle,
        };
      default:
        return {
          color:
            'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
          icon: FileText,
        };
    }
  };

  return (
    <div className='flex flex-col gap-6 mx-auto w-full'>
      {/* 1. Header Section */}
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/40 pb-6'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Sales & Transactions
          </h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            Real-time insight into your revenue streams, transaction history,
            and payment performance.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' size='sm' className='h-9 gap-2'>
                <FileDown className='h-4 w-4' />
                Import
              </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-xl p-0 overflow-hidden'>
              <div className='border-b border-border bg-muted/30 px-6 py-4'>
                <DialogHeader className='space-y-1'>
                  <DialogTitle className='text-base font-semibold'>
                    Bulk Data Import
                  </DialogTitle>
                  <p className='text-xs text-muted-foreground'>
                    Upload a CSV file to import data. You can validate first
                    using Dry run.
                  </p>
                </DialogHeader>
              </div>

              <div className='px-6 py-5'>
                <CsvImporter
                  kind='sales'
                  // title='Import Sales'
                  // description='Imports sales from CSV. Does NOT deduct ingredients.'
                />
              </div>
            </DialogContent>
          </Dialog>
          <Link href='/sales/new'>
            <Button size='sm' className='h-9 gap-2 shadow-sm'>
              <Plus className='h-4 w-4' /> Create Order
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <MetricCard
          title='Total Revenue'
          value={formatCurrency(metrics.totalRevenue)}
          icon={DollarSign}
          trend='+12.5%'
          trendUp={true}
          description='vs. last month'
        />
        <MetricCard
          title='Transactions'
          value={metrics.count.toString()}
          icon={CreditCard}
          trend='+4.1%'
          trendUp={true}
          description='vs. last month'
        />
        <MetricCard
          title='Avg. Order Value'
          value={formatCurrency(metrics.averageOrder)}
          icon={ArrowUpRight}
          trend='-2.3%'
          trendUp={false}
          description='vs. last month'
        />
        <MetricCard
          title='Success Rate'
          value={`${metrics.successRate.toFixed(1)}%`}
          icon={CheckCircle2}
          trend='+1.2%'
          trendUp={true}
          description='Completion rate'
        />
      </div>

      {/* 3. Filter & Toolbar */}
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row gap-4 items-center justify-between p-1'>
          <div className='relative w-full sm:w-72'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search orders, IDs...'
              className='pl-9 h-9 bg-background'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <Button
              variant='outline'
              size='sm'
              className='h-9 gap-2 hidden sm:flex'
            >
              <Download className='h-4 w-4' /> Export
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-9 w-full sm:w-auto gap-2 text-muted-foreground hover:text-foreground'
            >
              <CalendarIcon className='h-4 w-4' />
              <span>Oct 1 - Oct 31</span>
            </Button>
            <Button variant='outline' size='sm' className='h-9 w-9 p-0'>
              <Filter className='h-4 w-4 text-muted-foreground' />
            </Button>
          </div>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className='rounded-md border bg-card shadow-sm overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead className='w-[120px] pl-6'>Order ID</TableHead>
              <TableHead className='w-[150px]'>Date</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right pr-8'>Amount</TableHead>
              <TableHead className='w-[50px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((s) => {
              const statusConfig = getStatusConfig(s.status);
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow
                  key={s.id}
                  className='hover:bg-muted/40 transition-colors group'
                >
                  <TableCell className='pl-6 font-medium'>
                    <Link
                      href={`/sales/${s.id}`}
                      className='inline-flex items-center gap-2 hover:underline underline-offset-4 decoration-primary/50'
                    >
                      <span className='font-mono text-xs text-muted-foreground'>
                        #
                      </span>
                      {s.id}
                    </Link>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    <div className='flex items-center gap-2'>
                      {formatDate(s.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2 text-sm font-medium'>
                      {(() => {
                        const getPaymentIcon = (method: string) => {
                          const m = method.toLowerCase();
                          if (m.includes('cash')) return Banknote;
                          if (m.includes('card')) return CreditCard;
                          if (m.includes('online')) return Globe;
                          return CreditCard;
                        };

                        const getPaymentColor = (method: string) => {
                          const m = method.toLowerCase();
                          if (m.includes('cash'))
                            return 'text-rose-500 dark:text-rose-400';
                          if (m.includes('card'))
                            return 'text-amber-500 dark:text-amber-400';
                          if (m.includes('online'))
                            return 'text-emerald-500 dark:text-emerald-400';
                          return 'text-slate-600 ';
                        };

                        const PaymentIcon = getPaymentIcon(s.payment_method);
                        const colorClass = getPaymentColor(s.payment_method);

                        return (
                          <>
                            <div className={cn('p-1 rounded', colorClass)}>
                              <PaymentIcon className='h-3 w-3' />
                            </div>
                            {s.payment_method}
                          </>
                        );
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={cn(
                        'gap-1.5 py-0.5 pl-1.5 pr-2.5 font-normal shadow-none',
                        statusConfig.color
                      )}
                    >
                      <StatusIcon className='h-3.5 w-3.5' />
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right pr-8'>
                    <span className='font-mono font-medium tabular-nums text-foreground'>
                      {formatCurrency(parseFloat(s.total))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-[160px]'>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/sales/${s.id}`}
                            className='cursor-pointer'
                          >
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer'>
                          Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive focus:text-destructive cursor-pointer'>
                          Refund Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}

            {!loading && filteredSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='h-64 text-center'>
                  <div className='flex flex-col items-center justify-center gap-3'>
                    <div className='rounded-full bg-muted p-4'>
                      <Search className='h-6 w-6 text-muted-foreground/50' />
                    </div>
                    <div className='space-y-1'>
                      <h3 className='font-semibold text-lg'>
                        No transactions found
                      </h3>
                      <p className='text-sm text-muted-foreground max-w-sm mx-auto'>
                        We couldn't find any sales matching your search
                        criteria. Try adjusting your filters.
                      </p>
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setSearch('')}
                      className='mt-2'
                    >
                      Clear Search
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- Sub-components for cleaner code ---

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  description,
}: any) {
  return (
    <Card className='shadow-sm border-border/60'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold tracking-tight'>{value}</div>
        <div className='flex items-center text-xs mt-1'>
          <span
            className={cn(
              'flex items-center font-medium',
              trendUp ? 'text-emerald-600' : 'text-rose-600'
            )}
          >
            {trendUp ? (
              <TrendingUp className='h-3 w-3 mr-1' />
            ) : (
              <ArrowDownRight className='h-3 w-3 mr-1' />
            )}
            {trend}
          </span>
          <span className='text-muted-foreground ml-2'>{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}
