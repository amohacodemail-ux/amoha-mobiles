'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Package, Edit, Trash2, Loader2, IndianRupee } from 'lucide-react';
import { supplierService } from '@/services/supplier.service';
import { SupplierCatalogueForm } from '@/components/supplier/SupplierCatalogueForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { ConfirmModal } from '@/components/shared/confirm-modal';

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteProduct, setDeleteProduct] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getMyCatalogue();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (product?: any) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingProduct) {
        await supplierService.updateCatalogueItem(editingProduct.id, data);
        toast.success('Product updated successfully');
      } else {
        await supplierService.createCatalogueItem(data);
        toast.success('Product added successfully');
      }
      handleCloseForm();
      fetchProducts();
    } catch (error) {
      toast.error(editingProduct ? 'Failed to update product' : 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    try {
      setIsDeleting(true);
      await supplierService.deleteCatalogueItem(deleteProduct.id);
      toast.success('Product deleted');
      setDeleteProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Product Catalogue" 
        description="Manage your products, pricing, and stock"
      >
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-64 text-center p-6 border-dashed">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No products yet</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Add your products to the catalogue so purchase teams can discover and order from you.
          </p>
          <Button onClick={() => handleOpenForm()}>Add Your First Product</Button>
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
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="shadow-sm font-medium px-2 py-0">
                    {product.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-3.5 flex-1 flex flex-col">
                <div className="mb-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-sm">
                    {product.category || 'Uncategorized'}
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
                
                <div className="flex gap-2 pt-3 border-t border-border/40 mt-auto">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 h-7 text-xs bg-primary/5 hover:bg-primary/10 transition-colors font-medium"
                    onClick={() => handleOpenForm(product)}
                  >
                    <Edit className="h-3 w-3 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 w-7 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => setDeleteProduct(product)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <SupplierCatalogueForm 
            initialData={editingProduct} 
            onSubmit={handleSubmit} 
            onCancel={handleCloseForm}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <ConfirmModal 
        open={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you absolutely sure you want to delete the product "${deleteProduct?.productName}" from your catalogue? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
