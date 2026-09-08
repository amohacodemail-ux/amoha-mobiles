'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supplierService } from '@/services/supplier.service';
import { productService } from '@/services/product.service';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AddToPOModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddToPOModal({ product, isOpen, onClose, onSuccess }: AddToPOModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mapping state
  const [masterProducts, setMasterProducts] = useState<any[]>([]);
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');

  // PO state
  const [quantity, setQuantity] = useState<number>(product?.moq || 1);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(product.moq || 1);
      if (!product.mappedProductId) {
        setStep(1);
        fetchMasterProducts();
      } else {
        setStep(2);
      }
    }
  }, [isOpen, product]);

  const fetchMasterProducts = async () => {
    try {
      // Just fetching a few for selection, ideally with search
      const data = await productService.getAll({ page: 1, limit: 100 });
      setMasterProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load master products', error);
    }
  };

  const handleMapProduct = async () => {
    if (!selectedMasterId) {
      toast.error('Please select a master product to map to');
      return;
    }
    
    try {
      setIsProcessing(true);
      await supplierService.mapCatalogueToMaster(product.id, selectedMasterId);
      toast.success('Successfully mapped to master product');
      // Update local product object
      product.mappedProductId = selectedMasterId;
      setStep(2);
      onSuccess(); // Refresh list to get updated mapping
    } catch (error) {
      toast.error('Failed to map product');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePO = async () => {
    if (quantity < product.moq) {
      toast.error(`Minimum order quantity is ${product.moq}`);
      return;
    }

    try {
      setIsProcessing(true);
      
      const payload = {
        supplierId: product.supplierId,
        status: 'draft',
        items: [
          {
            productId: product.mappedProductId,
            quantity: quantity,
            unitCost: product.supplierPrice
          }
        ],
        notes: `Auto-generated PO from Supplier Catalogue for ${product.productName}`
      };

      const newPO = await supplierService.createPurchaseOrder(payload);
      toast.success('Purchase Order created successfully!');
      
      onClose();
      // Redirect to PO view or list
      router.push('/purchase/orders');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create Purchase Order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add to Purchase Order</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm">
              This supplier product is not yet mapped to your main Product Master. Please map it to continue creating a Purchase Order.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Supplier Product</label>
              <div className="font-semibold">{product.productName}</div>
              <div className="text-sm text-muted-foreground">Category: {product.category || 'N/A'}</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Select Master Product</label>
              <Select value={selectedMasterId} onValueChange={setSelectedMasterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a matching product..." />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {masterProducts.map(mp => (
                    <SelectItem key={mp.id} value={mp.id}>
                      {mp.name} (SKU: {mp.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
              <Button onClick={handleMapProduct} disabled={!selectedMasterId || isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Map & Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
              {product.imageUrl && (
                <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                  <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-lg">{product.productName}</h4>
                <p className="text-sm text-muted-foreground">Supplier: {product.supplier?.name || product.supplier?.companyName}</p>
                <p className="font-medium text-primary mt-1">{formatCurrency(product.supplierPrice)} / {product.unit || 'unit'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Quantity</label>
                <Input 
                  type="number" 
                  min={product.moq} 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                />
                <p className="text-xs text-muted-foreground">MOQ: {product.moq}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Total Cost</label>
                <div className="h-10 flex items-center font-bold text-lg">
                  {formatCurrency(quantity * product.supplierPrice)}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
              <Button onClick={handleCreatePO} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Draft PO
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
