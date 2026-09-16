'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, Star, Package, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';
import { productService } from '@/services/product.service';

interface Product {
  _id: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  mrp?: number;
  description?: string;
  images?: string[];
  sku?: string;
  specifications?: Record<string, string>;
  rating?: number;
}

export default function ProductDetailingPage() {
  const { canAccess } = useModulePermissions(MODULES.PRODUCT_DETAILING);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({ limit: 100 });
      setProducts((res as any).products || res || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = (p: Product) => {
    setSelected(p);
    setImgIndex(0);
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">You do not have access to this module.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Product Detailing</h1>
            <p className="text-muted-foreground text-sm">Browse product features and specifications for field presentation.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 w-64" placeholder="Search by name, brand, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Package className="h-12 w-12 opacity-30" />
          <p>{search ? 'No products match your search.' : 'No products available.'}</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{filtered.length} product(s)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(p => (
              <button key={p._id} onClick={() => openDetail(p)} className="group text-left rounded-xl border bg-card overflow-hidden hover:shadow-md hover:border-primary/40 transition-all duration-200">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-xs text-muted-foreground truncate">{p.brand || p.category || '-'}</p>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-sm font-bold text-primary">₹{(p.price || 0).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Product Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-background rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="aspect-square rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                  {selected.images?.[imgIndex] ? (
                    <img src={selected.images[imgIndex]} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground/40" />
                  )}
                </div>
                {(selected.images?.length || 0) > 1 && (
                  <div className="flex items-center justify-between">
                    <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} disabled={imgIndex === 0} className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-30 transition-colors">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex gap-1">
                      {selected.images!.map((_, i) => (
                        <button key={i} onClick={() => setImgIndex(i)} className={`w-2 h-2 rounded-full transition-colors ${i === imgIndex ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      ))}
                    </div>
                    <button onClick={() => setImgIndex(i => Math.min((selected.images?.length || 1) - 1, i + 1))} disabled={imgIndex >= (selected.images?.length || 1) - 1} className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-30 transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                {selected.brand && <Badge variant="outline">{selected.brand}</Badge>}
                {selected.sku && <p className="text-xs text-muted-foreground font-mono">SKU: {selected.sku}</p>}
                <div>
                  <p className="text-3xl font-bold text-primary">₹{(selected.price || 0).toLocaleString()}</p>
                  {selected.mrp && selected.mrp > selected.price && (
                    <p className="text-sm text-muted-foreground line-through">MRP: ₹{selected.mrp.toLocaleString()}</p>
                  )}
                </div>
                {selected.description && (
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">{selected.description}</p>
                  </div>
                )}
                {selected.specifications && Object.keys(selected.specifications).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Specifications</p>
                    <div className="divide-y border rounded-lg overflow-hidden">
                      {Object.entries(selected.specifications).map(([k, v]) => (
                        <div key={k} className="flex py-2 px-3 text-sm">
                          <span className="font-medium w-2/5 text-muted-foreground">{k}</span>
                          <span className="w-3/5">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}