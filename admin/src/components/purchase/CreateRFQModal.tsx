import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Loader2, Calendar } from 'lucide-react';
import { purchaseService } from '@/services/purchase.service';
import toast from 'react-hot-toast';

interface CreateRFQModalProps {
  isOpen: boolean;
  selectedProducts: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRFQModal({ isOpen, selectedProducts, onClose, onSuccess }: CreateRFQModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Initialize items when modal opens
  useEffect(() => {
    if (isOpen && selectedProducts.length > 0) {
      setItems(
        selectedProducts.map(p => ({
          productId: p.mappedProductId || p.mapped_product_id || null, // Keep null if not mapped
          catalogueId: p.id,
          name: p.productName || p.product_name,
          sku: p.sku || '',
          quantity: p.moq || 1,
          unitPrice: p.supplierPrice || p.supplier_price || 0, // Used as est price
          remarks: ''
        }))
      );
    }
  }, [isOpen, selectedProducts]);

  const handleQuantityChange = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index].quantity = parseInt(val) || 0;
    setItems(newItems);
  };

  const handleRemarksChange = (index: number, val: string) => {
    const newItems = [...items];
    newItems[index].remarks = val;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    if (newItems.length === 0) {
      onClose(); // Close if empty
    }
  };

  const handleSubmit = async () => {
    if (items.some(i => i.quantity <= 0)) {
      toast.error('Quantity must be greater than 0 for all items');
      return;
    }

    try {
      setIsLoading(true);
      // All selected products must be from the same supplier due to previous validation
      const supplierId = selectedProducts[0]?.supplierId || selectedProducts[0]?.supplier_id;
      
      if (!supplierId) {
         toast.error('Supplier information is missing');
         return;
      }

      await purchaseService.createRFQ({
        supplierId,
        items,
        notes,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        deliveryAddress: deliveryAddress || undefined
      });
      
      toast.success('RFQ Created Successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Request For Quotation (RFQ)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Delivery Address (Optional)</Label>
              <Input
                placeholder="Enter delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes for Supplier</Label>
              <Input
                placeholder="Any special instructions or remarks for the entire RFQ..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="w-[120px]">Quantity</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.name}
                      {!item.productId && (
                        <div className="text-[10px] text-yellow-600 font-semibold block mt-1">Unmapped Product</div>
                      )}
                    </TableCell>
                    <TableCell>{item.sku || '-'}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        className="w-20"
                        value={item.quantity || ''}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Item specific notes..."
                        value={item.remarks}
                        onChange={(e) => handleRemarksChange(index, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || items.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create RFQ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
