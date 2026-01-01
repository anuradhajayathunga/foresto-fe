import { authFetch } from "@/lib/auth";

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
  if (!res.ok) throw data;
  return data;
}
