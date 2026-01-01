import { authFetch } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type MenuItem = {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  is_available: boolean;
};

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API}/api/menu/categories/?is_active=true`);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function fetchItems(categoryId?: number, search?: string): Promise<MenuItem[]> {
  const params = new URLSearchParams();
  params.set("is_available", "true");
  if (categoryId) params.set("category", String(categoryId));
  if (search) params.set("search", search);

  const res = await fetch(`${API}/api/menu/items/?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load items");
  return res.json();
}

// staff/admin create item
export async function createMenuItem(payload: {
  category: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  is_available?: boolean;
}) {
  const res = await authFetch("/api/menu/items/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export async function createCategory(payload: {
  name: string;
  slug: string;
  sort_order?: number;
  is_active?: boolean;
}) {
  const res = await authFetch("/api/menu/categories/", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      sort_order: payload.sort_order ?? 0,
      is_active: payload.is_active ?? true,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}
