'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupplier, listSuppliers, Supplier } from '@/lib/purchases';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MoreHorizontal,
  Users,
  MapPin,
  CheckCircle2,
  Briefcase,
  Globe,
  Filter
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils'; // Ensure utils exists

export default function SuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setRows(await listSuppliers());
  }

  useEffect(() => {
    reload();
  }, []);

  // --- Metrics ---
  const metrics = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((r) => r.is_active).length,
      inactive: rows.filter((r) => !r.is_active).length,
    };
  }, [rows]);

  // --- Filtering ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  // --- Helpers ---
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  async function onCreate() {
    setErr(null);

    // Basic Validation
    if (!form.name.trim()) return setErr('Supplier name is required.');
    if (!form.email.trim()) return setErr('Email address is required.');
    if (!form.phone.trim()) return setErr('Phone number is required.');

    setSaving(true);
    try {
      await createSupplier({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      setOpen(false);
      setForm({ name: '', email: '', phone: '', address: '' });
      await reload();
    } catch (e: any) {
      setErr(e?.name?.[0] || e?.detail || 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 mx-auto w-full">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Suppliers
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Manage your vendor database, track contact details, and monitor partnership status.
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErr(null); }}>
            <DialogTrigger asChild>
                <Button className="shadow-sm gap-2">
                    <Plus className="h-4 w-4" />
                    Add Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Supplier</DialogTitle>
                    <DialogDescription>
                        Create a new vendor profile. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Company Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Acme Industries"
                            className="bg-muted/5"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                            <Input
                                id="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="contact@acme.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                            <Input
                                id="phone"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            placeholder="123 Business Blvd, City"
                        />
                    </div>

                    {err && (
                        <Alert variant="destructive" className="py-2 text-sm bg-destructive/10 text-destructive border-destructive/20">
                            <AlertDescription>{err}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={onCreate} disabled={saving}>
                        {saving ? 'Creating...' : 'Create Supplier'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {/* 2. Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard 
            title="Total Vendors" 
            value={metrics.total} 
            sub="Registered suppliers" 
            icon={Building2} 
        />
        <MetricCard 
            title="Active Partners" 
            value={metrics.active} 
            sub="Currently active" 
            icon={CheckCircle2} 
            active 
        />
        <MetricCard 
            title="Inactive / Archived" 
            value={metrics.inactive} 
            sub="Requires review" 
            icon={Users} 
        />
      </div>

      {/* 3. Toolbar & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-1">
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search suppliers..."
                    className="pl-9 h-9 bg-background"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
        </div>
      </div>

      {/* 4. Data Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[300px] pl-6">Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[50px] pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} className="group hover:bg-muted/40 transition-colors">
                <TableCell className="pl-6 font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border/50 bg-background">
                      <AvatarFallback className="text-xs font-medium text-foreground/70 bg-muted/50">
                        {getInitials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{s.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">ID: {s.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {s.email ? (
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {s.email}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No email</span>
                    )}

                    {s.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 opacity-70" />
                        {s.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {s.address ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate max-w-[180px]">{s.address}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("gap-1.5 font-normal py-0.5 px-2", 
                        s.is_active 
                            ? "border-emerald-200 text-emerald-700 bg-emerald-50/50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/20" 
                            : "text-muted-foreground bg-muted/50 border-border"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", s.is_active ? "bg-emerald-500" : "bg-muted-foreground/50")} />
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">Edit Supplier</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">View Order History</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-[350px] text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <Search className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">No suppliers found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            We couldn't find any suppliers matching "{search}". Try adjusting your search or add a new one.
                        </p>
                    </div>
                    {search && (
                      <Button variant="outline" size="sm" onClick={() => setSearch('')} className="mt-4">
                        Clear Search
                      </Button>
                    )}
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

// --- Clean Metric Card Component ---
function MetricCard({ title, value, sub, icon: Icon, active }: any) {
    return (
        <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={cn("h-4 w-4", active ? "text-emerald-500" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
        </Card>
    )
}