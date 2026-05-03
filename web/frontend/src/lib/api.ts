export const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export const fetchAPI = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const res = await fetch(`${API}${endpoint}`);
      if (!res.ok) throw new Error("API Error");
      const data: T = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Unknown error" };
    }
  },

  post: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("API Error");
      const data: T = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Unknown error" };
    }
  },

  put: async <T>(endpoint: string, body: any): Promise<ApiResponse<T>> => {
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("API Error");
      const data: T = await res.json();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Unknown error" };
    }
  },

  delete: async <T = null>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const res = await fetch(`${API}${endpoint}`, { method: "DELETE" });
      if (!res.ok) throw new Error("API Error");
      const data: T = await res.json().catch(() => null);
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || "Unknown error" };
    }
  },
};

export default fetchAPI;