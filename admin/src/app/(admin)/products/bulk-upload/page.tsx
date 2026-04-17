'use client';
import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Download, FileUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { productService } from '@/services/product.service';

const CSV_TEMPLATE = `name,brand,category,description,shortDescription,price,originalPrice,stock,tags,isFeatured,isTrending,colors,warranty,images,thumbnail
"iPhone 15 Pro","BRAND_ID","CATEGORY_ID","Full description here","Short desc",134900,139900,50,"iphone,apple",true,false,"Black,White","1 Year","https://example.com/img1.jpg,https://example.com/img2.jpg","https://example.com/thumb.jpg"`;

function parseCSV(text: string): any[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const products: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    const product: any = {};
    headers.forEach((h, idx) => {
      const key = h.trim();
      const val = values[idx]?.trim();
      if (key === 'price' || key === 'originalPrice' || key === 'stock') {
        product[key] = Number(val) || 0;
      } else if (key === 'isFeatured' || key === 'isTrending') {
        product[key] = val === 'true';
      } else if (key === 'tags' || key === 'colors' || key === 'images') {
        product[key] = val ? val.split(',').map((s: string) => s.trim()) : [];
      } else if (key === 'specifications') {
        try { product[key] = JSON.parse(val); } catch { product[key] = {}; }
      } else {
        product[key] = val;
      }
    });
    products.push(product);
  }
  return products;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export default function BulkUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; errors: { row: number; name: string; error: string }[] } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          const arr = Array.isArray(json) ? json : json.products ?? [];
          setProducts(arr);
          toast.success(`Parsed ${arr.length} products from JSON`);
        } catch { toast.error('Invalid JSON file'); }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const parsed = parseCSV(ev.target?.result as string);
        setProducts(parsed);
        toast.success(`Parsed ${parsed.length} products from CSV`);
      };
      reader.readAsText(file);
    } else {
      toast.error('Only CSV or JSON files are supported');
    }
  };

  const handleUpload = async () => {
    if (products.length === 0) { toast.error('No products loaded'); return; }
    if (products.length > 100) { toast.error('Maximum 100 products per batch'); return; }
    setUploading(true);
    setResult(null);
    try {
      const res = await productService.bulkCreate(products);
      setResult(res);
      if (res.failed === 0) toast.success(`All ${res.created} products created!`);
      else toast(`${res.created} created, ${res.failed} failed`, { icon: '⚠️' });
    } catch { toast.error('Bulk upload failed'); }
    finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Bulk Product Upload" description="Upload products via CSV or JSON file">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" /> Download Template
        </Button>
      </PageHeader>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mb-6"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
        <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-lg font-medium">Drop CSV or JSON file here</p>
        <p className="text-sm text-muted-foreground mt-1">or click to browse. Max 100 products per batch.</p>
      </div>

      {/* Preview */}
      {products.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{products.length} Products Ready</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setProducts([]); setResult(null); }}>Clear</Button>
              <Button onClick={handleUpload} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload All'}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">#</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Stock</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Brand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.slice(0, 20).map((p, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">₹{p.price?.toLocaleString()}</td>
                    <td className="px-3 py-2">{p.stock ?? 0}</td>
                    <td className="px-3 py-2 text-muted-foreground truncate max-w-[120px]">{p.brand ?? '—'}</td>
                  </tr>
                ))}
                {products.length > 20 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-center text-muted-foreground">
                      ... and {products.length - 20} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Upload Results</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-lg font-bold">{result.created}</span>
              <span className="text-sm text-muted-foreground">Created</span>
            </div>
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="text-lg font-bold">{result.failed}</span>
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {result.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-medium">Row {e.row}</span> ({e.name}): {e.error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-4">
        <h3 className="font-semibold mb-2">CSV Format Guide</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li><strong>Required:</strong> name, price</li>
          <li><strong>Recommended:</strong> brand (ID), category (ID), description, stock, images, thumbnail</li>
          <li><strong>Lists:</strong> tags, colors, images — separate with commas within quotes</li>
          <li><strong>Booleans:</strong> isFeatured, isTrending — use &quot;true&quot; or &quot;false&quot;</li>
          <li><strong>JSON file:</strong> Array of product objects, or <code>{`{"products": [...]}`}</code></li>
        </ul>
      </div>
    </div>
  );
}
