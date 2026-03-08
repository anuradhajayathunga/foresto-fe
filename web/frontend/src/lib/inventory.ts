import { authFetch, unwrapList } from "@/lib/auth";

export type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  current_stock: string;
  reorder_level: string;
  buffer_size: string;
  cost_per_unit?: string;
  is_active: boolean;
};

export type StockMovement = {
  id: number;
  item: number;
  item_name?: string;
  movement_type: "IN" | "OUT" | "ADJUST";
  quantity: string;
  reason: string;
  note?: string;
  created_by?: number;
  created_by_email?: string;
  created_at?: string;
};

export type BufferPreviewItem = {
  ingredient_id: number;
  ingredient_name: string;
  old_buffer_size: string;
  target_buffer_size: string;
  new_buffer_size: string;
  avg_daily_waste_equiv: string;
};

export type BufferPreviewResponse = {
  restaurant_id: number;
  start_date: string;
  end_date: string;
  lookback_days: number;
  buffer_days: number;
  alpha: string;
  updated: number;
  items: BufferPreviewItem[];
};

export async function listInventoryItems() {
  const res = await authFetch("/api/inventory/items/?ordering=name");
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<InventoryItem>(data);
}

export async function createInventoryItem(payload: {
  name: string;
  sku: string;
  unit: string;
  current_stock?: string;
  reorder_level?: string;
  buffer_size?: string;
  cost_per_unit?: string;
  is_active?: boolean;
}) {
  const res = await authFetch("/api/inventory/items/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as InventoryItem;
}

export async function createStockMovement(payload: {
  item: number;
  movement_type: "IN" | "OUT" | "ADJUST";
  quantity: string;
  reason: string;
  note?: string;
}) {
  const res = await authFetch("/api/inventory/movements/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as StockMovement;
}

export async function listStockMovements(itemId?: number) {
  const qs = itemId
    ? `?item=${itemId}&ordering=-created_at`
    : "?ordering=-created_at";
  const res = await authFetch(`/api/inventory/movements/${qs}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<StockMovement>(data);
}

export async function getLowStockItems() {
  const res = await authFetch("/api/inventory/items/low_stock/");
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<InventoryItem>(data);
}

export async function getBufferPreview(params?: {
  lookback_days?: number;
  buffer_days?: number;
  alpha?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.lookback_days != null) {
    searchParams.set("lookback_days", String(params.lookback_days));
  }
  if (params?.buffer_days != null) {
    searchParams.set("buffer_days", String(params.buffer_days));
  }
  if (params?.alpha != null) {
    searchParams.set("alpha", String(params.alpha));
  }

  const qs = searchParams.toString();
  const path = qs
    ? `/api/inventory/items/buffer-preview/?${qs}`
    : "/api/inventory/items/buffer-preview/";

  const res = await authFetch(path);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as BufferPreviewResponse;
}
