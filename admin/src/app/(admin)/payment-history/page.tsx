'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { paymentHistoryService, PaymentTransaction, PaymentSummary } from '@/services/payment-history.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth.store';

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSummary();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTransactions();
    }
  }, [page, status, user]);

  const fetchSummary = async () => {
    try {
      const res = await paymentHistoryService.getSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await paymentHistoryService.getHistory({
        page,
        limit: 20,
        search: search || undefined,
        status: status !== 'all' ? status : undefined
      });
      if (res.success) {
        setTransactions(res.data.transactions);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const openDetails = (tx: PaymentTransaction) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payment History</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalTransactions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.successfulCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary?.failedCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summary?.pendingCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Success Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{formatCurrency(summary?.totalSuccessfulAmount || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Refunded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">{formatCurrency(summary?.totalRefundedAmount || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <Input 
            placeholder="Search by Payment ID, Order ID, Customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80"
          />
          <Button type="submit" variant="secondary"><Search className="h-4 w-4 mr-2" /> Search</Button>
        </form>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.razorpay_payment_id || 'N/A'}</TableCell>
                    <TableCell>{tx.orders?.order_number || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{tx.customer_name || tx.users?.name || 'Guest'}</div>
                      <div className="text-xs text-muted-foreground">{tx.customer_phone || tx.users?.phone}</div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell className="capitalize">{tx.payment_method || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(tx.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(tx)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button 
            variant="outline" 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center px-4 font-medium">
            Page {page} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Transaction Info</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-muted-foreground">ID:</div>
                  <div className="col-span-2 font-mono">{selectedTx.id}</div>
                  <div className="text-muted-foreground">Razorpay Payment ID:</div>
                  <div className="col-span-2 font-mono">{selectedTx.razorpay_payment_id || 'N/A'}</div>
                  <div className="text-muted-foreground">Razorpay Order ID:</div>
                  <div className="col-span-2 font-mono">{selectedTx.razorpay_order_id}</div>
                  <div className="text-muted-foreground">Amount:</div>
                  <div className="col-span-2 font-semibold">{formatCurrency(selectedTx.amount)}</div>
                  <div className="text-muted-foreground">Method:</div>
                  <div className="col-span-2 capitalize">{selectedTx.payment_method || 'Unknown'}</div>
                  <div className="text-muted-foreground">Status:</div>
                  <div className="col-span-2">
                    <Badge variant="outline" className={getStatusColor(selectedTx.status)}>
                      {selectedTx.status}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">Date:</div>
                  <div className="col-span-2">{new Date(selectedTx.created_at).toLocaleString('en-IN')}</div>
                  {selectedTx.failure_reason && (
                    <>
                      <div className="text-muted-foreground text-red-600">Error:</div>
                      <div className="col-span-2 text-red-600">{selectedTx.failure_reason}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Customer & Order Info</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-muted-foreground">Customer:</div>
                  <div className="col-span-2">{selectedTx.users?.name || selectedTx.customer_name || 'N/A'}</div>
                  <div className="text-muted-foreground">Email:</div>
                  <div className="col-span-2">{selectedTx.users?.email || selectedTx.customer_email || 'N/A'}</div>
                  <div className="text-muted-foreground">Phone:</div>
                  <div className="col-span-2">{selectedTx.users?.phone || selectedTx.customer_phone || 'N/A'}</div>
                  <div className="text-muted-foreground mt-4">Order ID:</div>
                  <div className="col-span-2 mt-4 font-mono">{selectedTx.orders?.order_number || 'N/A'}</div>
                  <div className="text-muted-foreground">Order Total:</div>
                  <div className="col-span-2">{selectedTx.orders ? formatCurrency(selectedTx.orders.total) : 'N/A'}</div>
                  <div className="text-muted-foreground">Order Status:</div>
                  <div className="col-span-2 capitalize">{selectedTx.orders?.status || 'N/A'}</div>
                </div>
              </div>

              {(selectedTx.refund_id || selectedTx.status === 'refunded') && (
                <div className="space-y-4 col-span-2">
                  <h3 className="font-semibold text-lg border-b pb-2">Refund Info</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
                    <div className="text-muted-foreground">Refund ID:</div>
                    <div className="col-span-2 font-mono">{selectedTx.refund_id || 'N/A'}</div>
                    <div className="text-muted-foreground">Refund Amount:</div>
                    <div className="col-span-2 font-semibold">{selectedTx.refund_amount ? formatCurrency(selectedTx.refund_amount) : 'N/A'}</div>
                    <div className="text-muted-foreground">Status:</div>
                    <div className="col-span-2 capitalize">{selectedTx.refund_status || 'N/A'}</div>
                    <div className="text-muted-foreground">Date:</div>
                    <div className="col-span-2">{selectedTx.refund_date ? new Date(selectedTx.refund_date).toLocaleString('en-IN') : 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
