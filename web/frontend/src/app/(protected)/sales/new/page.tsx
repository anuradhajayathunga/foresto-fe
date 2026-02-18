'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchItems, MenuItem } from '@/lib/menu';
import { createSale } from '@/lib/sales';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  Banknote,
  Globe,
  UtensilsCrossed,
  Package,
  Loader2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CartLine = {
  id: number;
  name: string;
  price: number;
  qty: number;
  category?: string;
};

export default function NewSalePage() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Transaction State
  const [cart, setCart] = useState<CartLine[]>([]);
  const [payment, setPayment] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');

  // Submission State
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // --- Scroll Logic (kept from your original code) ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchItems();
        setItems(data);
      } catch (error) {
        console.error('Failed to load items:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Derive Categories ---
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category_name || 'Other'));
    return ['All', ...Array.from(cats)];
  }, [items]);

  // --- Filter Logic ---
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || i.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  // --- Calculations ---
  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.qty, 0),
    [cart]
  );
  const discountNum = Number(discount) || 0;
  const taxNum = Number(tax) || 0;
  const total = Math.max(0, subtotal - discountNum + taxNum);

  // --- Actions ---
  function addToCart(mi: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((x) => x.id === mi.id);
      if (existing) {
        return prev.map((x) => (x.id === mi.id ? { ...x, qty: x.qty + 1 } : x));
      }
      return [
        ...prev,
        {
          id: mi.id,
          name: mi.name,
          price: Number(mi.price),
          qty: 1,
          category: mi.category_name,
        },
      ];
    });
  }

  function updateQty(id: number, delta: number) {
    setCart((prev) =>
      prev
        .map((x) =>
          x.id === id ? { ...x, qty: Math.max(0, x.qty + delta) } : x
        )
        .filter((x) => x.qty > 0)
    );
  }

  async function handleCheckout() {
    setErr(null);
    if (cart.length === 0) return setErr('Cart is empty.');

    setSaving(true);
    try {
      const payload = {
        customer_name: customerName,
        payment_method: payment,
        discount: discountNum.toFixed(2),
        tax: taxNum.toFixed(2),
        items: cart.map((c) => ({ menu_item: c.id, qty: c.qty })),
        status: 'PAID',
      };
      const created = await createSale(payload);
      router.push(`/sales/${created.id}`);
    } catch (e: any) {
      setErr(e?.detail || 'Transaction failed.');
    } finally {
      setSaving(false);
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 300;
      container.scrollTo({
        left:
          direction === 'left'
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Helper for Currency
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);

  return (
    <div className='flex flex-col '>
      {/* 1. Top Navigation Bar */}
      <header className='flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b  sticky top-0 z-20 shadow-2xs'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push('/sales')}
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-xl font-bold tracking-tight'>New Sale</h1>
            <p className='text-xs text-muted-foreground flex items-center gap-2'>
              <span className='w-2 h-2 rounded-full bg-green-500 animate-pulse' />
              Terminal Active - {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className='flex-1 flex overflow-hidden'>
        {/* LEFT: Product Catalog */}
        <div className='flex-1 flex flex-col p-6 gap-6 overflow-hidden'>
          {/* Search & Categories */}
          <div className='flex flex-shrink-0 flex-col gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400' />
              <Input
                placeholder='Search items by name...'
                className='h-11 rounded-lgborder-zinc-200 bg-white pl-10 text-sm dark:bg-gray-700 dark:border-transparent'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className='relative group w-full lg:flex-1 max-w-5xl'>
              {showLeftArrow && (
                <div className='absolute inset-y-0 left-0 z-10 h-full flex items-center bg-gradient-to-r from-background to-transparent pr-4'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 rounded-full bg-background shadow-sm border'
                    onClick={() => scroll('left')}
                  >
                    <ChevronLeft className='h-3 w-3' />
                  </Button>
                </div>
              )}
              <div
                ref={scrollContainerRef}
                className='flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mask-linear-fade'
              >
                {categories.map((cat) => (
                  <FilterButton
                    key={cat}
                    active={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    label={cat}
                  />
                ))}
              </div>
              {showRightArrow && (
                <div className='absolute inset-y-0 right-0 z-10 h-full flex items-center bg-gradient-to-l from-background to-transparent pl-4'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6 rounded-full bg-background shadow-sm border'
                    onClick={() => scroll('right')}
                  >
                    <ChevronRight className='h-3 w-3' />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Grid Area */}
          <ScrollArea className='flex-1'>
            {loading ? (
              <div className='flex h-full items-center justify-center text-muted-foreground'>
                <Loader2 className='h-8 w-8 animate-spin' />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className='flex h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground opacity-60'>
                <div className='rounded-full bg-muted p-4'>
                  <Package className='h-8 w-8' />
                </div>
                <p className='font-medium'>No items found</p>
              </div>
            ) : (
              <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4  pb-20'>
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className='group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98] outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1'
                  >
                    <div className='aspect-[4/3] w-full bg-muted/20 p-4 flex items-center justify-center group-hover:bg-muted/30 transition-colors'>
                      {/* Placeholder Icon - Replace with <Image /> if you have URLs */}
                      <UtensilsCrossed className='h-10 w-10 text-muted-foreground/40 group-hover:text-primary/60 transition-colors' />
                    </div>

                    <div className='flex flex-1 flex-col p-4'>
                      <div className='mb-1 flex items-start justify-between gap-2'>
                        <span className='font-semibold text-sm leading-tight line-clamp-2'>
                          {item.name}
                        </span>
                      </div>
                      <span className='text-xs text-muted-foreground mb-3'>
                        {item.category_name}
                      </span>

                      <div className='mt-auto flex items-center justify-between'>
                        <span className='font-bold text-sm'>
                          {formatMoney(Number(item.price))}
                        </span>
                        <div className='h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                          <Plus className='h-4 w-4' />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* RIGHT: Transaction Panel */}
        <div className='w-[400px] bg-gray-50 dark:bg-gray-800 border-l flex flex-col h-full'>
          {/* Header */}
          <div className='p-5 border-b flex items-center justify-between'>
            <div className='flex items-center gap-2 font-semibold'>
              <ShoppingCart className='h-4 w-4' />
              <span>Current Order</span>
              <Badge
                variant='secondary'
                className='flex-initial ml-2 text-xs h-5 w-5 px-1.5 bg-gray-200 dark:text-white dark:bg-gray-700'
              >
                {cart.length}
              </Badge>
            </div>
            {cart.length > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setCart([])}
                className='h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10'
              >
                <Trash2 className='h-3 w-3 mr-1' /> Clear
              </Button>
            )}
          </div>

          {/* Cart Items List */}
          <ScrollArea className='flex-1 p-5'>
            <div className='space-y-4'>
              {cart.map((item) => (
                <div key={item.id} className='flex gap-3 group'>
                  <div className='flex-1 space-y-1'>
                    <div className='flex justify-between'>
                      <span className='font-medium text-sm'>{item.name}</span>
                      <span className='font-medium text-sm'>
                        {formatMoney(item.price * item.qty)}
                      </span>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {formatMoney(item.price)} per unit
                    </div>
                  </div>

                  {/* Qty Controls */}
                  <div className='flex items-center gap-3  rounded-md border h-8 px-2'>
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className='hover:text-destructive transition-colors'
                    >
                      <Minus className='h-3 w-3' />
                    </button>
                    <span className='text-sm font-medium w-4 text-center'>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className='hover:text-primary transition-colors'
                    >
                      <Plus className='h-3 w-3' />
                    </button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className='h-40 flex flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800'>
                  <ShoppingCart className='h-8 w-8 mb-2 opacity-20' />
                  Cart is empty
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Financials & Actions */}
          <div className='p-5 bg-gray-50 dark:bg-gray-800 border-t space-y-5'>
            {/* Inputs */}
            <div className='space-y-3'>
              <Input
                placeholder='Customer Name (Optional)'
                className=' h-9 text-sm'
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>
                    Discount
                  </Label>
                  <Input
                    type='number'
                    placeholder='0.00'
                    className=' h-8 text-sm'
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs text-muted-foreground'>Tax</Label>
                  <Input
                    type='number'
                    placeholder='0.00'
                    className=' h-8 text-sm'
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className='mb-4'>
              <Label className='mb-2 block text-[10px] uppercase tracking-wider text-zinc-500'>
                Payment Method
              </Label>
              <div className='grid grid-cols-3 gap-2'>
                {[
                  { id: 'CASH', icon: Banknote, label: 'Cash' },
                  { id: 'CARD', icon: CreditCard, label: 'Card' },
                  { id: 'ONLINE', icon: Globe, label: 'Online' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayment(m.id as any)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-medium transition-all',
                      payment === m.id
                        ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                        : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700'
                    )}
                  >
                    <m.icon className='h-4 w-4' />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className='space-y-1.5 text-sm'>
              <div className='flex justify-between text-muted-foreground'>
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {discountNum > 0 && (
                <div className='flex justify-between text-green-600'>
                  <span>Discount</span>
                  <span>-{formatMoney(discountNum)}</span>
                </div>
              )}
              {taxNum > 0 && (
                <div className='flex justify-between text-red-600'>
                  <span>Tax</span>
                  <span>+{formatMoney(taxNum)}</span>
                </div>
              )}
              <div className='flex justify-between font-bold text-lg pt-2 '>
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            {/* Submit */}
            <div className='space-y-3'>
              {err && (
                <Alert variant='destructive' className='py-2'>
                  <AlertDescription>{err}</AlertDescription>
                </Alert>
              )}
              <Button
                size='lg'
                className='w-full font-bold shadow-md'
                onClick={handleCheckout}
                disabled={saving || cart.length === 0}
              >
                {saving ? 'Processing...' : `Charge ${formatMoney(total)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function FilterButton({ active, onClick, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
      )}
    >
      {label}
    </button>
  );
}
