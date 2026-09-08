'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Package, PlusCircle, Loader2 } from 'lucide-react';
import { supplierService } from '@/services/supplier.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddToPOModal } from '@/components/purchase/AddToPOModal';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [supplierIdFilter, setSupplierIdFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [supplierIdFilter, categoryFilter]);

  const fetchSuppliers = async () => {
    try {
      const data = await supplierService.getAll({ limit: 100 });
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error('Failed to load suppliers', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      if (supplierIdFilter && supplierIdFilter !== 'all') filters.supplierId = supplierIdFilter;
      if (categoryFilter) filters.category = categoryFilter;
      
      const data = await supplierService.getAllCatalogues(filters);
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load supplier products');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Supplier Catalogues" 
        description="Browse and order products directly from suppliers."
      />

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1">
          <Select 
            value={supplierIdFilter} 
            onValueChange={setSupplierIdFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a supplier..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map(sup => (
                <SelectItem key={sup.id} value={sup.id}>{sup.name || sup.companyName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-64">
          <Input 
            placeholder="Filter by category..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64 text-center p-6 border-dashed">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No products found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-muted/60 bg-card">
              <div className="aspect-[4/3] bg-muted/20 relative overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.productName} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                    <Package className="h-10 w-10" />
                  </div>
                )}
                {product.mappedProductId && (
                  <div className="absolute top-2.5 right-2.5">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-sm font-medium px-2 py-0">Mapped</Badge>
                  </div>
                )}
              </div>
              
              <div className="p-3.5 flex-1 flex flex-col">
                <div className="mb-1.5 flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-sm">
                    {product.category || 'Uncategorized'}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[100px]" title={product.supplier?.name || product.supplier?.companyName}>
                    By {product.supplier?.name || product.supplier?.companyName}
                  </span>
                </div>
                
                <h3 className="font-semibold text-sm leading-tight line-clamp-1 mb-1.5 text-foreground/90" title={product.productName}>
                  {product.productName}
                </h3>
                
                <div className="flex items-baseline text-primary font-bold mb-3">
                  <span className="text-base tracking-tight">{formatCurrency(product.supplierPrice)}</span>
                  {product.unit && <span className="text-muted-foreground text-[10px] font-medium ml-1">/ {product.unit}</span>}
                </div>

                <div className="flex flex-wrap gap-1.5 text-[10px] mb-3 flex-1">
                  <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded text-muted-foreground border border-border/50">
                    <span className="font-semibold text-foreground/80">MOQ:</span> {product.moq}
                  </div>
                  <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded text-muted-foreground border border-border/50">
                    <span className="font-semibold text-foreground/80">Stock:</span> {product.availableStock}
                  </div>
                  {product.deliveryTimeDays && (
                    <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded text-muted-foreground border border-border/50">
                      <span className="font-semibold text-foreground/80">Delivers:</span> {product.deliveryTimeDays}d
                    </div>
                  )}
                </div>
                
                <Button 
                  className="w-full mt-auto h-8 text-xs font-medium"
                  onClick={() => setSelectedProduct(product)}
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                  Add to PO
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedProduct && (
        <AddToPOModal 
          isOpen={!!selectedProduct}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => {
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
