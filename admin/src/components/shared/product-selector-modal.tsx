'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productService } from '@/services/product.service';
import type { Product } from '@/types';
import { Search, Loader2 } from 'lucide-react';

interface ProductSelectorModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onConfirm: (ids: string[], products: Product[]) => void;
}

export function ProductSelectorModal({ open, onClose, selectedIds, onConfirm }: ProductSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSelectedIds, setCurrentSelectedIds] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (open) {
      setCurrentSelectedIds(selectedIds);
      loadProducts();
    }
  }, [open]);

  const loadProducts = async (searchQuery = '') => {
    setLoading(true);
    try {
      const response = await productService.getAll({ search: searchQuery, limit: 50 });
      setProducts(response.products || []);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (open) {
        loadProducts(search);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const toggleSelect = (product: Product) => {
    setCurrentSelectedIds(prev => {
      const isSelected = prev.includes(product._id);
      if (isSelected) {
        setSelectedProducts(sp => sp.filter(p => p._id !== product._id));
        return prev.filter(id => id !== product._id);
      } else {
        setSelectedProducts(sp => {
          if (!sp.find(p => p._id === product._id)) return [...sp, product];
          return sp;
        });
        return [...prev, product._id];
      }
    });
  };
  
  const handleConfirm = () => {
    // We should ideally pass all selected products, but if we don't have the full product object for initially selected ones, 
    // the parent might only care about IDs anyway.
    onConfirm(currentSelectedIds, selectedProducts);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Products</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[300px] border rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No products found.
            </div>
          ) : (
            <div className="divide-y">
              {products.map(product => (
                <div 
                  key={product._id} 
                  className="flex items-center gap-4 p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleSelect(product)}
                >
                  <input 
                    type="checkbox" 
                    checked={currentSelectedIds.includes(product._id)}
                    onChange={() => {}} 
                    className="h-4 w-4 rounded border-input cursor-pointer"
                  />
                  <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                    {product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="font-medium text-sm">
                    ₹{product.price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {currentSelectedIds.length} product(s) selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm Selection</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
