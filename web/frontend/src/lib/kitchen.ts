import { authFetch, unwrapList } from '@/lib/auth';

export type KitchenProduction = {
  id: number;
  date: string;
  menu_item: number;
  menu_item_name?: string;
  category_name?: string;
  suggested_qty: string;
  suggestion_basis?: string;
  planned_qty: string;
  prepared_qty: string;
  note?: string;
  created_at?: string;
  updated_at?: string;
};

export type KitchenWaste = {
  id: number;
  date: string;
  menu_item: number;
  menu_item_name?: string;
  category_name?: string;
  waste_qty: string;
  reason?: 'UNSOLD' | 'BURNT' | 'RETURNED' | 'EXPIRED' | '';
  note?: string;
};

export type KitchenPlanRow = {
  menu_item_id: number;
  planned_qty: string;
};

export type KitchenIngredientAlert = {
  item_id: number;
  item_name: string;
  unit?: string;
  required_qty: string;
  current_stock: string;
  reorder_level: string;
  projected_remaining?: string;
  shortage_to_meet_plan?: string;
  suggested_purchase_qty: string;
  severity: 'LOW' | 'CRITICAL' | string;
};

export type KitchenAlertData = {
  ingredient_alerts: KitchenIngredientAlert[];
  summary?: {
    total_required?: string;
    total_shortage?: string;
  };
};

export type KitchenPurchaseRequestLine = {
  id: number;
  item: number;
  item_name?: string;
  unit?: string;
  required_qty: string;
  current_stock: string;
  reorder_level: string;
  suggested_purchase_qty: string;
  reason?: string;
  note?: string;
};

export type KitchenPurchaseRequest = {
  id: number;
  request_date: string;
  source_plan_date?: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CONVERTED' | 'CANCELLED' | string;
  note?: string;
  created_by?: number;
  created_at?: string;
  lines: KitchenPurchaseRequestLine[];
};

export type UpsertProductionPayload = {
  date: string;
  menu_item: number;
  planned_qty?: string;
  prepared_qty?: string;
  suggested_qty?: string;
  suggestion_basis?: string;
  note?: string;
  create_purchase_request?: boolean;
  auto_create_purchase_draft?: boolean;
  supplier?: number;
  purchase_invoice_date?: string;
  purchase_invoice_no?: string;
  purchase_note?: string;
};

export type UpsertProductionResponse = {
  production: KitchenProduction;
  low_stock_alerts?: KitchenAlertData;
  purchase_request?: KitchenPurchaseRequest | null;
  purchase_invoice?: { id: number } | null;
};

export async function listProductions(params?: {
  date_from?: string;
  date_to?: string;
  menu_item?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  if (typeof params?.menu_item === 'number') qs.set('menu_item', String(params.menu_item));

  const res = await authFetch(`/api/kitchen/productions/${qs.toString() ? `?${qs.toString()}` : ''}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<KitchenProduction>(data);
}

export async function upsertProduction(payload: UpsertProductionPayload) {
  const res = await authFetch('/api/kitchen/productions/upsert/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as UpsertProductionResponse;
}

export async function bulkUpsertProductions(payload: {
  date: string;
  rows: Array<{
    menu_item: number;
    planned_qty: string;
    prepared_qty?: string;
    suggested_qty?: string;
    suggestion_basis?: string;
    note?: string;
  }>;
  return_alerts?: boolean;
  create_purchase_request?: boolean;
  purchase_request_note?: string;
  auto_create_purchase_draft?: boolean;
  supplier?: number;
  purchase_invoice_date?: string;
  purchase_invoice_no?: string;
  purchase_note?: string;
}) {
  const res = await authFetch('/api/kitchen/productions/bulk-upsert/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    date: string;
    count: number;
    results: KitchenProduction[];
    alerts?: KitchenAlertData;
    purchase_request?: KitchenPurchaseRequest | null;
    purchase_invoice?: { id: number } | null;
  };
}

export async function forecastSuggestProductions(payload: {
  date: string;
  save_to_production?: boolean;
}) {
  const res = await authFetch('/api/kitchen/productions/forecast-suggest/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    date: string;
    count: number;
    save_to_production: boolean;
    results: KitchenProduction[];
  };
}

export async function checkPlanAlerts(payload: {
  date?: string;
  rows: KitchenPlanRow[];
  create_purchase_request?: boolean;
  note?: string;
  auto_create_purchase_draft?: boolean;
  supplier?: number;
  purchase_invoice_date?: string;
  purchase_invoice_no?: string;
}) {
  const res = await authFetch('/api/kitchen/productions/plan-alerts/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    alerts: KitchenAlertData;
    purchase_request?: KitchenPurchaseRequest | null;
    purchase_invoice?: { id: number } | null;
  };
}

export async function listWastes(params?: {
  date_from?: string;
  date_to?: string;
  menu_item?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  if (typeof params?.menu_item === 'number') qs.set('menu_item', String(params.menu_item));

  const res = await authFetch(`/api/kitchen/wastes/${qs.toString() ? `?${qs.toString()}` : ''}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<KitchenWaste>(data);
}

export async function upsertWaste(payload: {
  date: string;
  menu_item: number;
  waste_qty?: string;
  reason?: 'UNSOLD' | 'BURNT' | 'RETURNED' | 'EXPIRED' | '';
  note?: string;
}) {
  const res = await authFetch('/api/kitchen/wastes/upsert/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as KitchenWaste;
}

export async function getWasteSummary(params?: {
  date_from?: string;
  date_to?: string;
  menu_item?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.date_from) qs.set('date_from', params.date_from);
  if (params?.date_to) qs.set('date_to', params.date_to);
  if (typeof params?.menu_item === 'number') qs.set('menu_item', String(params.menu_item));

  const res = await authFetch(`/api/kitchen/wastes/summary/${qs.toString() ? `?${qs.toString()}` : ''}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    total_waste: string;
    by_reason: Array<{ reason: string; total_waste: string }>;
  };
}

export async function getWasteVsSales(payload: { date_from: string; date_to: string }) {
  const qs = new URLSearchParams(payload as Record<string, string>);
  const res = await authFetch(`/api/kitchen/wastes/waste-vs-sales/?${qs.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as {
    count: number;
    results: Array<{
      menu_item_id: number;
      menu_item_name: string;
      sold_qty: string;
      waste_qty: string;
      waste_rate_pct: number;
    }>;
  };
}

export async function listKitchenPurchaseRequests() {
  const res = await authFetch('/api/kitchen/purchase-requests/');
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<KitchenPurchaseRequest>(data);
}

export async function getKitchenPurchaseRequest(id: number) {
  const res = await authFetch(`/api/kitchen/purchase-requests/${id}/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as KitchenPurchaseRequest;
}

export async function submitKitchenPurchaseRequest(id: number) {
  const res = await authFetch(`/api/kitchen/purchase-requests/${id}/submit/`, {
    method: 'POST',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as KitchenPurchaseRequest;
}

export async function convertKitchenPurchaseRequestToDraft(
  id: number,
  payload: {
    supplier: number;
    invoice_date?: string;
    invoice_no?: string;
    note?: string;
  }
) {
  const res = await authFetch(`/api/kitchen/purchase-requests/${id}/convert-to-purchase-draft/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as { id: number };
}
