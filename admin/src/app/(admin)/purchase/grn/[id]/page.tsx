'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { purchaseService } from '@/services/purchase.service';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useModulePermissions, MODULES } from '@/hooks/usePermissions';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

export default function GRNDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [grn, setGrn] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const { canCreate, canAccess } = useModulePermissions(MODULES.GRN);

  const loadGRN = useCallback(async () => {
    setLoading(true);
    try {
      // Find GRN from the list for now since there's no single GET by ID on frontend service
      const res = await purchaseService.getGRNs();
      const found = res?.find((g: any) => g.id === id);
      if (found) {
        setGrn(found);
      } else {
        toast.error('GRN not found');
        router.push('/purchase/grn');
      }
    } catch {
      toast.error('Failed to load GRN details');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (canAccess && id) loadGRN();
  }, [loadGRN, canAccess, id]);

  const handleVerify = async () => {
    if (!confirm('Verify this GRN? This will update inventory and complete the receiving process.')) return;
    setVerifying(true);
    try {
      await purchaseService.verifyGRN(id as string);
      toast.success('GRN verified and inventory updated');
      loadGRN();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify GRN');
    } finally {
      setVerifying(false);
    }
  };

  if (!canAccess) {
    return <div className="p-8 text-center text-muted-foreground">You do not have permission to view Goods Received Notes.</div>;
  }

  if (loading) {
    return <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!grn) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/purchase/grn')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader 
          title={`GRN Details: ${grn.grnNumber}`} 
          description={`Purchase Order: ${grn.purchaseOrder?.po_number || grn.poId}`}
        >
          {grn.status === 'pending' && canCreate && (
            <Button onClick={handleVerify} disabled={verifying}>
              {verifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Verify & Complete
            </Button>
          )}
        </PageHeader>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">General Information</h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Status</p>
              <Badge variant={grn.status === 'completed' ? 'success' : 'secondary'} className="uppercase">
                {grn.status}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Received Date</p>
              <p className="font-medium">{formatDate(grn.receivedDate || grn.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Supplier</p>
              <p className="font-medium">{grn.supplier?.name || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Invoice / Challan No</p>
              <p className="font-medium">{grn.invoiceChallanNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Warehouse Location</p>
              <p className="font-medium">{grn.warehouseLocation || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">Remarks & Notes</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {grn.notes || 'No remarks provided.'}
          </p>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Received Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Product ID</th>
                <th className="px-4 py-3 text-right font-medium">Ordered Qty</th>
                <th className="px-4 py-3 text-right font-medium">Received Qty</th>
                <th className="px-4 py-3 text-right font-medium text-red-500">Rejected Qty</th>
                <th className="px-4 py-3 text-right font-medium text-green-600">Accepted Qty</th>
                <th className="px-4 py-3 text-left font-medium">Rejection Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {grn.items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 truncate max-w-[200px]" title={item.products?.name || item.productId}>
                    {item.products?.name || item.product?.name || item.productId}
                  </td>
                  <td className="px-4 py-4 text-right">{item.orderedQty}</td>
                  <td className="px-4 py-4 text-right">{item.receivedQty}</td>
                  <td className="px-4 py-4 text-right text-red-500">{item.rejectedQty}</td>
                  <td className="px-4 py-4 text-right font-medium text-green-600">{item.acceptedQty}</td>
                  <td className="px-4 py-4">{item.rejectionReason || '-'}</td>
                </tr>
              ))}
              {(!grn.items || grn.items.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
