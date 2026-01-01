"use client";

import { useState } from "react";
import { authFetch } from "@/lib/auth"; 
import { importCsv } from "@/lib/imports"; 

// Removed Card imports
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, FileUp, CheckCircle2, AlertCircle } from "lucide-react";

type Kind = "categories" | "menu_items" | "ingredients" | "recipes";

interface CsvImporterProps {
  kind: Kind;
  title?: string;
  description?: string;
}

export function CsvImporter({ kind, title, description }: CsvImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const defaultTitle = title || `Import ${kind.replace("_", " ")}`;

  async function downloadTemplate() {
    setDownloading(true);
    setErr(null);
    try {
      const response = await authFetch(`/api/import/template/?kind=${kind}`, {
        method: "GET",
      });

      if (!response.ok) {
        if (response.status === 403) {
            throw new Error("Permission denied. You must be Admin/Staff.");
        }
        throw new Error("Failed to download template");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_${kind}.csv`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      console.error(e);
      setErr(e.message || "Could not download template.");
    } finally {
      setDownloading(false);
    }
  }

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
    <div className="w-full space-y-6">
      
      {/* 1. Header Section (Title + Download Button) */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold leading-none tracking-tight">{defaultTitle}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={downloadTemplate} 
          disabled={downloading}
          className="shrink-0 gap-2 h-9"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Downloading..." : "Template"}
        </Button>
      </div>

      {/* 2. Form Inputs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload CSV</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center space-x-2">
           <input
            id={`dryrun-${kind}`}
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
          />
          <Label htmlFor={`dryrun-${kind}`} className="text-sm font-normal cursor-pointer text-muted-foreground">
            Dry run (Validate data without saving)
          </Label>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        <Button onClick={run} disabled={loading} className="w-full gap-2">
          <FileUp className="h-4 w-4" />
          {loading ? "Importing..." : "Run Import"}
        </Button>
      </div>

      {/* 3. Results Section */}
      {result && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Import Complete
            </h4>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {result.dry_run ? "Dry Run Mode" : "Live Mode"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-background rounded border p-2 text-center">
              <div className="text-lg font-bold text-green-600">{result.created}</div>
              <div className="text-[10px] uppercase text-muted-foreground font-medium">Created</div>
            </div>
            <div className="bg-background rounded border p-2 text-center">
              <div className="text-lg font-bold text-blue-600">{result.updated}</div>
              <div className="text-[10px] uppercase text-muted-foreground font-medium">Updated</div>
            </div>
            <div className="bg-background rounded border p-2 text-center">
              <div className={`text-lg font-bold ${result.errors?.length > 0 ? "text-red-600" : "text-gray-600"}`}>
                {result.errors?.length || 0}
              </div>
              <div className="text-[10px] uppercase text-muted-foreground font-medium">Errors</div>
            </div>
          </div>

          {(result.errors?.length || 0) > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-red-600">Error Log</p>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                {result.errors.slice(0, 50).map((x: any, i: number) => (
                  <div key={i} className="rounded bg-white border border-red-100 p-2 text-xs">
                    <span className="font-medium text-red-600 mr-1">Row {x.row}:</span>
                    <span className="text-gray-600">{x.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}