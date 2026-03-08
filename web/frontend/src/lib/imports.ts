import { authFetch } from "@/lib/auth";

function extractErrorDetail(data: any, fallback: string) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) return data.detail.join(", ");
  if (typeof data?.error === "string") return data.error;
  return fallback;
}

// export async function importCsv(kind: "categories" | "menu_items" | "ingredients" | "recipes", file: File, dryRun = false) {
//   const fd = new FormData();
//   fd.append("kind", kind);
//   fd.append("dry_run", dryRun ? "true" : "false");
//   fd.append("file", file);

//   const res = await authFetch("/api/import/csv/", {
//     method: "POST",
//     body: fd,
//   });

//   const data = await res.json().catch(() => ({}));
//   if (!res.ok) throw data;
//   return data as { created: number; updated: number; errors: any[]; kind: string; dry_run: boolean };
// }
export async function importCsv(kind: string, file: File, dryRun = false) {
  const fd = new FormData();
  fd.append("kind", kind);
  fd.append("dry_run", dryRun ? "true" : "false");
  fd.append("file", file);

  const res = await authFetch("/api/import/csv/", {
    method: "POST",
    body: fd,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw {
      detail: extractErrorDetail(data, `Import failed (HTTP ${res.status})`),
      status: res.status,
      raw: data,
    };
  }
  return data;
}

export async function downloadImportTemplate(kind: string) {
  const res = await authFetch(
    `/api/import/template/?kind=${encodeURIComponent(kind)}`,
    {
      method: "GET",
    },
  );

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw {
      detail: extractErrorDetail(
        data,
        `Template download failed (HTTP ${res.status})`,
      ),
      status: res.status,
      raw: data,
    };
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `template_${kind}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
