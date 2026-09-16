'use client';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { DollarSign, Plus, Clock, CheckCircle2, XCircle, Upload, Users, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/shared/pagination';
import { expenseService, type Expense } from '@/services/sales.service';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';

const LIMIT = 10;
const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'food', label: 'Food & Meals' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'mobile', label: 'Mobile / Internet' },
  { value: 'stationary', label: 'Stationary' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'other', label: 'Other' },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
};

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

function AdminExpenseView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [approveModal, setApproveModal] = useState<{ expense: Expense; action: 'approved' | 'rejected' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseService.getAll({ page, limit: LIMIT, status: statusFilter || undefined });
      setExpenses(res.expenses || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!approveModal) return;
    if (approveModal.action === 'rejected' && !remarks.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      await expenseService.approve(approveModal.expense._id, approveModal.action, remarks);
      toast.success(`Expense ${approveModal.action} successfully`);
      setApproveModal(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const totalAmount = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader title="Expense Management" description="Review and approve team expense claims" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Claims', value: total, color: 'text-blue-600' },
          { label: 'Pending Review', value: pendingCount, color: 'text-amber-600' },
          { label: 'Approved Claims', value: expenses.filter(e => e.status === 'approved').length, color: 'text-emerald-600' },
          { label: 'Total Approved Amount', value: `₹${totalAmount.toLocaleString()}`, color: 'text-violet-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Team Expense Claims
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading claims...</div>
          ) : expenses.length === 0 ? (
            <div className="py-16 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No expenses found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusFilter ? `No ${statusFilter} claims found` : 'No expense claims submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {expenses.map(item => {
                const cfg = statusConfig[item.status] || statusConfig.pending;
                const CfgIcon = cfg.icon;
                const categoryLabel = CATEGORIES.find(c => c.value === item.category)?.label || item.category;
                const salesperson = item.user;

                return (
                  <div key={item._id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-full border ${cfg.color} shrink-0`}>
                        <CfgIcon className="h-4 w-4" />
                      </div>
                      <div>
                        {salesperson && (
                          <p className="text-sm font-semibold text-primary mb-0.5">
                            {salesperson.name || salesperson.email}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{categoryLabel}</span>
                          <Badge variant="outline" className={`text-[10px] bg-transparent ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.expenseDate)}
                        </p>
                        <p className="text-sm mt-1">{item.description}</p>
                        
                        {(item.travelMode || item.distanceKm) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.travelMode && <span className="capitalize mr-2">Mode: {item.travelMode}</span>}
                            {item.distanceKm ? <span>Dist: {item.distanceKm} km</span> : null}
                          </p>
                        )}

                        {item.remarks && (
                          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2 py-0.5 border-muted-foreground/30">
                            Notes: {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 min-w-[120px] space-y-2">
                      <p className="text-lg font-bold text-foreground">₹{item.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Sub: {formatDate(item.createdAt).split(' ')[0]}</p>
                      
                      {item.status === 'pending' && (
                        <div className="flex gap-1.5 justify-end mt-2">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2"
                            onClick={() => { setApproveModal({ expense: item, action: 'approved' }); setRemarks(''); }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                            onClick={() => { setApproveModal({ expense: item, action: 'rejected' }); setRemarks(''); }}
                          >
                            <XCircle className="h-3 w-3 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={LIMIT} />
      </div>

      {/* Admin Approval Modal */}
      <Dialog open={!!approveModal} onOpenChange={() => setApproveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${approveModal?.action === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
              {approveModal?.action === 'approved' 
                ? <><CheckCircle2 className="h-4 w-4" /> Approve Expense</>
                : <><XCircle className="h-4 w-4" /> Reject Expense</>
              }
            </DialogTitle>
          </DialogHeader>
          {approveModal && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><strong>Employee:</strong> {approveModal.expense.user?.name || approveModal.expense.user?.email || '—'}</p>
                <p><strong>Category:</strong> {CATEGORIES.find(c => c.value === approveModal.expense.category)?.label}</p>
                <p><strong>Date:</strong> {formatDate(approveModal.expense.expenseDate)}</p>
                <p><strong>Amount:</strong> ₹{approveModal.expense.amount.toLocaleString()}</p>
                <p><strong>Description:</strong> {approveModal.expense.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Remarks {approveModal.action === 'rejected' && <span className="text-red-500">*</span>}
                </label>
                <Textarea 
                  placeholder={approveModal.action === 'rejected' ? 'Reason for rejection (required)...' : 'Optional remarks...'}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveModal(null)}>Cancel</Button>
                <Button 
                  onClick={handleApprove} 
                  loading={submitting}
                  className={approveModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {approveModal.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SALES VIEW ──────────────────────────────────────────────────────────────

function SalesExpenseView() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { canCreate } = useModulePermissions(MODULES.EXPENSES);

  const [form, setForm] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'travel',
    amount: '',
    description: '',
    travelMode: '',
    distanceKm: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expenseService.getAll({ page, limit: LIMIT });
      setExpenses(res.expenses || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm({
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'travel',
      amount: '',
      description: '',
      travelMode: '',
      distanceKm: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSubmitting(true);
    try {
      await expenseService.create({
        expenseDate: form.expenseDate,
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description,
        travelMode: form.travelMode,
        distanceKm: parseFloat(form.distanceKm) || 0,
      });
      toast.success('Expense submitted for approval');
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit expense');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingAmount = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader title="My Expenses" description="Submit and track your field expenses">
        {canCreate && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        )}
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Claims', value: total, color: 'text-blue-600' },
          { label: 'Pending Review', value: expenses.filter(e => e.status === 'pending').length, color: 'text-amber-600' },
          { label: 'Pending Amount', value: `₹${pendingAmount.toLocaleString()}`, color: 'text-amber-600' },
          { label: 'Approved Amount', value: `₹${approvedAmount.toLocaleString()}`, color: 'text-emerald-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading...</div>
          ) : expenses.length === 0 ? (
            <div className="py-16 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No expenses recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Submit your field expenses here.</p>
              {canCreate && (
                <Button className="mt-4" size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4" /> Add Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {expenses.map(item => {
                const cfg = statusConfig[item.status] || statusConfig.pending;
                const CfgIcon = cfg.icon;
                const categoryLabel = CATEGORIES.find(c => c.value === item.category)?.label || item.category;

                return (
                  <div key={item._id} className="p-4 flex items-start justify-between gap-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-full border ${cfg.color} shrink-0`}>
                        <CfgIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{categoryLabel}</span>
                          <Badge variant="outline" className={`text-[10px] bg-transparent ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.expenseDate)}
                        </p>
                        <p className="text-sm mt-1">{item.description}</p>
                        
                        {(item.travelMode || item.distanceKm) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.travelMode && <span className="capitalize mr-2">Mode: {item.travelMode}</span>}
                            {item.distanceKm ? <span>Dist: {item.distanceKm} km</span> : null}
                          </p>
                        )}

                        {item.remarks && (
                          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2 py-0.5 border-muted-foreground/30">
                            Manager Remarks: {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-foreground">₹{item.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Sub: {formatDate(item.createdAt).split(' ')[0]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={LIMIT} />
      </div>

      {/* Add Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Date *"
                value={form.expenseDate}
                onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))}
                required
              />
              <div>
                <label className="text-sm font-medium block mb-1.5">Category *</label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Input
              type="number"
              label="Amount (₹) *"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
              required
            />

            {form.category === 'travel' && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Travel Mode"
                  value={form.travelMode}
                  onChange={e => setForm(p => ({ ...p, travelMode: e.target.value }))}
                  placeholder="Bus, Train, Cab..."
                />
                <Input
                  type="number"
                  label="Distance (km)"
                  min="0"
                  step="0.1"
                  value={form.distanceKm}
                  onChange={e => setForm(p => ({ ...p, distanceKm: e.target.value }))}
                />
              </div>
            )}

            <Textarea
              label="Description *"
              placeholder="Details about the expense..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              required
              rows={2}
            />

            <div className="p-3 bg-muted rounded-md border border-dashed flex items-center justify-center gap-2 cursor-pointer hover:bg-muted/80 text-muted-foreground text-sm">
              <Upload className="h-4 w-4" /> Upload Receipt (Optional)
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Submit Claim</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminExpenseView /> : <SalesExpenseView />;
}
