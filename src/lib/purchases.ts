import { authFetch } from '@/lib/auth';

export type Supplier = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
};
export type PurchaseLineInput = {
  item: number;
  quantity: string;
  unit_price: string;
};
export type PurchaseInvoice = {
  id: number;
  supplier: number;
  supplier_name: string;
  invoice_no: string;
  invoice_date: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  note: string;
  status: string;
  lines: Array<{
    id: number;
    item: number;
    item_name: string;
    item_sku?: string;
    qty: string;
    unit_cost: string;
    line_total: string;
  }>;
};

export async function listSuppliers() {
  const res = await authFetch('/api/purchases/suppliers/?ordering=name');
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return data as Supplier[];
}

export async function createSupplier(payload: Partial<Supplier>) {
  const res = await authFetch('/api/purchases/suppliers/', {
    method: 'POST',
    body: JSON.stringify({ ...payload, is_active: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as Supplier;
}

export async function listPurchaseInvoices() {
  const res = await authFetch(
    '/api/purchases/invoices/?ordering=-invoice_date'
  );
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return data as PurchaseInvoice[];
}

export async function createPurchaseInvoice(payload: {
  supplier: number;
  invoice_no?: string;
  invoice_date: string;
  discount?: string;
  status?: 'DRAFT' | 'POSTED' | 'VOID';
  tax?: string;
  note?: string;
  lines: PurchaseLineInput[];
}) {
  const res = await authFetch('/api/purchases/invoices/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as PurchaseInvoice;
}

export async function getPurchaseInvoice(id: string) {
  const res = await authFetch(`/api/purchases/invoices/${id}/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as PurchaseInvoice;
}

export async function exportPurchasesCsv(params: {
  from: string;
  to: string;
  mode: 'invoices' | 'lines';
}) {
  const qs = new URLSearchParams(params as any).toString();
  const res = await authFetch(`/api/purchases/invoices/export-csv/?${qs}`, {
    method: 'GET',
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Export failed');
    throw new Error(err);
  }

  const blob = await res.blob();
  return blob;
}

export async function voidPurchaseInvoice(id: string, reason?: string) {
  const res = await authFetch(`/api/purchases/invoices/${id}/void/`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || '' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as PurchaseInvoice;
}
export async function createPurchaseDraftFromForecast(payload: {
  supplier: number;
  scope: "tomorrow" | "next7";
  horizon_days?: number;
  top_n?: number;
  include_ok?: boolean;
  invoice_date?: string; // YYYY-MM-DD
  note?: string;
}) {
  const res = await authFetch("/api/purchases/invoices/from-forecast/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as { id: number };
}