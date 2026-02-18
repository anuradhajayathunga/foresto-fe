import { authFetch, unwrapList } from "@/lib/auth";

export type Category = {
  id: number;
  name: string;
  slug?: string;
  is_active?: boolean;
};

export type MenuItem = {
  id: number;
  category: number;
  category_name?: string;
  name: string;
  slug: string;
  description?: string;
  price: string;
  is_available: boolean;
  image_url?: string;
  sort_order?: number;
};

export async function fetchCategories() {
  const res = await authFetch("/api/menu/categories/?is_active=true");
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<Category>(data);
}

export async function fetchItems(params?: Record<string, string>) {
  const qs = new URLSearchParams(params || {}).toString();
  const res = await authFetch(`/api/menu/items/${qs ? `?${qs}` : ""}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw data;
  return unwrapList<MenuItem>(data);
}

export async function fetchMenuItem(id: number) {
  const res = await authFetch(`/api/menu/items/${id}/`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as MenuItem;
}

export type CreateMenuItemPayload = {
  category: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  is_available?: boolean;
  image_url?: string;
  sort_order?: number;
};

export async function createMenuItem(payload: CreateMenuItemPayload) {
  const res = await authFetch("/api/menu/items/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as MenuItem;
}

export async function updateMenuItem(
  id: number,
  payload: Partial<CreateMenuItemPayload>,
) {
  const res = await authFetch(`/api/menu/items/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as MenuItem;
}

export async function deleteMenuItem(id: number) {
  const res = await authFetch(`/api/menu/items/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw data;
  }
  return true;
}

export async function createCategory(payload: {
  name: string;
  slug: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const res = await authFetch("/api/menu/categories/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as Category;
}
