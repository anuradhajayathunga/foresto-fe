"use client";

import { useState } from "react";
import { importCsv } from "@/lib/imports";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Kind = "categories" | "menu_items" | "ingredients" | "recipes";

export default function ImportsPage() {
  const [kind, setKind] = useState<Kind>("categories");
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);

  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setErr(null);
    setResult(null);

    if (!file) {
      setErr("Please choose a CSV file.");
      return;
    }

    setLoading(true);
    try {
      const res = await importCsv(kind, file, dryRun);
      setResult(res);
    } catch (e: any) {
      setErr(e?.detail || "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">CSV Import</h1>
        <p className="text-sm text-muted-foreground">
          Import Categories, Menu Items, Ingredients, and Recipes safely (no stock movements triggered)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV</CardTitle>
          <CardDescription>Select type and upload file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Import Type</Label>
              <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="categories">Menu Categories</SelectItem>
                  <SelectItem value="menu_items">Menu Items</SelectItem>
                  <SelectItem value="ingredients">Ingredients (Inventory)</SelectItem>
                  <SelectItem value="recipes">Recipes (Menu → Ingredients)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="dryrun"
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            <Label htmlFor="dryrun">Dry run (validate only, don’t save)</Label>
          </div>

          {err && (
            <Alert>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}

          <Button onClick={run} disabled={loading}>
            {loading ? "Importing..." : "Run Import"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
            <CardDescription>
              {result.kind} • dry_run={String(result.dry_run)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              Created: <b>{result.created}</b> • Updated: <b>{result.updated}</b> • Errors: <b>{result.errors?.length || 0}</b>
            </div>

            {(result.errors?.length || 0) > 0 && (
              <div className="text-sm space-y-2">
                {result.errors.slice(0, 20).map((x: any, i: number) => (
                  <div key={i} className="rounded border p-2">
                    <div className="font-medium">Row {x.row}: {x.error}</div>
                    <pre className="text-xs text-muted-foreground overflow-auto">{JSON.stringify(x.data, null, 2)}</pre>
                  </div>
                ))}
                {result.errors.length > 20 && (
                  <p className="text-xs text-muted-foreground">Showing first 20 errors…</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
