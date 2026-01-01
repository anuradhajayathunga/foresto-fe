'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchCategories, fetchItems, Category, MenuItem } from '@/lib/menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  MoreHorizontal,
  Utensils,
  Layers,
  FileDown,
  LayoutGrid,
  LayoutList,
  Filter,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { CsvImporter } from '@/components/csv-importer';
import { cn } from '@/lib/utils'; // Ensure you have this utility

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // New: View Mode State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [stockStatus, setStockStatus] = useState<Record<number, boolean>>({});

  // --- Scroll Logic (kept from your original code) ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (container) container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

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

  // --- Data Fetching ---
  useEffect(() => {
    (async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Failed categories:', error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchItems(
          selectedCategory ?? undefined,
          search.trim() || undefined
        );
        setItems(data);
        const initialStock: Record<number, boolean> = {};
        data.forEach((i) => (initialStock[i.id] = true));
        setStockStatus((prev) => ({ ...initialStock, ...prev }));
      } catch (error) {
        console.error('Failed items:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCategory, search]);

  // --- Metrics ---
  const metrics = useMemo(() => {
    const total = items.length;
    const avg =
      total > 0
        ? items.reduce((acc, curr) => acc + Number(curr.price), 0) / total
        : 0;
    return {
      totalItems: total,
      activeCategories: categories.length,
      avgPrice: avg,
    };
  }, [items, categories]);

  const toggleStock = (id: number) => {
    setStockStatus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className='flex flex-col gap-6 p-6 md:p-8 max-w-[1600px] mx-auto w-full'>
      {/* 1. Header Section */}
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/40 pb-6'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Menu Management
          </h1>
          <p className='text-sm text-muted-foreground max-w-2xl'>
            Manage your food catalog, adjust pricing strategies, and control
            real-time availability.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' size='sm' className='h-9'>
                <FileDown className='h-4 w-4 mr-2' />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-xl'>
              <DialogHeader>
                <DialogTitle>Bulk Data Import</DialogTitle>
              </DialogHeader>
              <DialogFooter className='py-2'>
                <CsvImporter
                  kind='menu_items'
                  title='Import Menu Items'
                  description='Upload CSV to bulk update.'
                />
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link href='/menu/add'>
            <Button size='sm' className='h-9 shadow-sm'>
              <Plus className='h-4 w-4 mr-2' />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Metrics (KPIs) */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <MetricCard
          title='Total Catalog'
          value={metrics.totalItems}
          icon={Utensils}
          sub='Active dishes'
        />
        <MetricCard
          title='Categories'
          value={metrics.activeCategories}
          icon={Layers}
          sub='Menu sections'
        />
        <MetricCard
          title='Avg. Price'
          value={`Rs. ${metrics.avgPrice.toFixed(0)}`}
          icon={TrendingUp}
          sub='Per item average'
        />
      </div>

      {/* 3. Controls Toolbar */}
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col lg:flex-row gap-4 items-center justify-between'>
          {/* Category Filter Pills */}
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
              <FilterButton
                active={selectedCategory === null}
                onClick={() => setSelectedCategory(null)}
                label='All Items'
              />
              {categories.map((c) => (
                <FilterButton
                  key={c.id}
                  active={selectedCategory === c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  label={c.name}
                />
              ))}
              <div className='w-px h-6 bg-border mx-1' />
              <Link href='/menu/category/add'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 text-xs rounded-full text-muted-foreground'
                >
                  <Plus className='h-3 w-3 mr-1' /> Category
                </Button>
              </Link>
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

          {/* Right Side: Search & View Toggle */}
          <div className='flex items-center gap-2 w-full lg:w-auto'>
            <div className='relative flex-1 lg:w-64'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search items...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-9 h-9 bg-background'
              />
            </div>
            <div className='flex items-center border rounded-md p-0.5 bg-muted/50'>
              <Button
                variant='ghost'
                size='sm'
                className={cn(
                  'h-7 w-7 p-0 rounded-sm',
                  viewMode === 'grid' && 'bg-background shadow-sm'
                )}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className='h-4 w-4 text-muted-foreground' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                className={cn(
                  'h-7 w-7 p-0 rounded-sm',
                  viewMode === 'list' && 'bg-background shadow-sm'
                )}
                onClick={() => setViewMode('list')}
              >
                <LayoutList className='h-4 w-4 text-muted-foreground' />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Content Area */}
      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[...Array(8)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : viewMode === 'grid' ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {items.map((item) => (
            <MenuGridItem
              key={item.id}
              item={item}
              inStock={stockStatus[item.id]}
              onToggleStock={() => toggleStock(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className='rounded-md border bg-card'>
          <Table>
            <TableHeader>
              <TableRow className='bg-muted/50'>
                <TableHead className='w-[80px]'>Image</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className='text-right'>Price</TableHead>
                <TableHead className='w-[100px] text-center'>Status</TableHead>
                <TableHead className='w-[50px]'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <MenuListItem
                  key={item.id}
                  item={item}
                  inStock={stockStatus[item.id]}
                  onToggleStock={() => toggleStock(item.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}

// --- Sub-Components for cleanliness ---

function MetricCard({ title, value, icon: Icon, sub }: any) {
  return (
    <Card className='shadow-sm border-border/60'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground mt-1'>{sub}</p>
      </CardContent>
    </Card>
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

function MenuGridItem({ item, inStock, onToggleStock }: any) {
  return (
    <Card className='group overflow-hidden border-border/60 hover:border-border/80 hover:shadow-md transition-all'>
      <div className='relative h-40 bg-muted/30'>
        <div className='absolute inset-0 flex items-center justify-center text-muted-foreground/20'>
          <ImageIcon className='h-12 w-12' />
        </div>
        <div className='absolute top-2 right-2'>
          <Badge
            variant={inStock ? 'secondary' : 'destructive'}
            className='backdrop-blur-md bg-background/80 shadow-sm'
          >
            {inStock ? 'In Stock' : 'Out'}
          </Badge>
        </div>
      </div>
      <CardContent className='p-4'>
        <div className='flex justify-between items-start mb-2'>
          <div className='space-y-1'>
            <h3
              className='font-semibold leading-none truncate pr-2'
              title={item.name}
            >
              {item.name}
            </h3>
            <p className='text-xs text-muted-foreground line-clamp-1'>
              {item.category_name}
            </p>
          </div>
          <MenuActions
            item={item}
            inStock={inStock}
            onToggleStock={onToggleStock}
          />
        </div>
        <div className='flex items-end justify-between mt-3'>
          <div className='text-lg font-bold'>
            Rs. {Number(item.price).toFixed(2)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MenuListItem({ item, inStock, onToggleStock }: any) {
  return (
    <TableRow>
      <TableCell>
        <div className='h-10 w-10 rounded bg-muted flex items-center justify-center'>
          <ImageIcon className='h-4 w-4 text-muted-foreground/50' />
        </div>
      </TableCell>
      <TableCell>
        <div className='font-medium'>{item.name}</div>
        <div className='text-xs text-muted-foreground line-clamp-1 max-w-[200px]'>
          {item.description}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant='outline' className='font-normal text-muted-foreground'>
          {item.category_name}
        </Badge>
      </TableCell>
      <TableCell className='text-right font-medium'>
        Rs. {Number(item.price).toFixed(2)}
      </TableCell>
      <TableCell className='text-center'>
        <div
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            inStock
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {inStock ? 'Active' : 'Inactive'}
        </div>
      </TableCell>
      <TableCell>
        <MenuActions
          item={item}
          inStock={inStock}
          onToggleStock={onToggleStock}
        />
      </TableCell>
    </TableRow>
  );
}

function MenuActions({ item, inStock, onToggleStock }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-muted-foreground hover:text-foreground'
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Edit Item</DropdownMenuItem>
        <DropdownMenuItem onClick={onToggleStock}>
          {inStock ? 'Mark Unavailable' : 'Mark Available'}
        </DropdownMenuItem>
        <DropdownMenuItem>View Recipe</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='text-destructive focus:text-destructive'>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SkeletonCard() {
  return <div className='h-64 bg-muted/20 rounded-xl animate-pulse' />;
}

function EmptyState() {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/5'>
      <div className='bg-muted p-4 rounded-full mb-4'>
        <Utensils className='h-8 w-8 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold'>No items found</h3>
      <p className='text-sm text-muted-foreground max-w-sm mt-2'>
        Try adjusting your search filters or add your first item to the menu.
      </p>
    </div>
  );
}
