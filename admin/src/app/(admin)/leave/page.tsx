'use client';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CalendarOff, Plus, Clock, CheckCircle2, XCircle, FileText, Users, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/shared/pagination';
import { leaveService, type LeaveRequest } from '@/services/sales.service';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';

const LIMIT = 10;

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'other', label: 'Other' },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
  cancelled: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: CalendarOff, label: 'Cancelled' },
};

function getDayCount(from: string, to: string): number {
  if (!from || !to) return 0;
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

function AdminLeaveView() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [approveModal, setApproveModal] = useState<{ leave: LeaveRequest; action: 'approved' | 'rejected' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.getAll({ page, limit: LIMIT, status: statusFilter || undefined });
      setLeaves(res.leaves || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load leave requests');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const openApprove = (leave: LeaveRequest, action: 'approved' | 'rejected') => {
    setApproveModal({ leave, action });
    setRemarks('');
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    if (approveModal.action === 'rejected' && !remarks.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      await leaveService.approve(approveModal.leave._id, approveModal.action, remarks);
      toast.success(`Leave ${approveModal.action} successfully`);
      setApproveModal(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;

  return (
    <div>
      <PageHeader title="Leave Management" description="Review and manage all salesperson leave requests" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Requests', value: total, color: 'text-blue-600' },
          { label: 'Pending Review', value: pendingCount, color: 'text-amber-600' },
          { label: 'Approved', value: approvedCount, color: 'text-emerald-600' },
          { label: 'Rejected', value: leaves.filter(l => l.status === 'rejected').length, color: 'text-red-600' },
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
          <SelectTrigger className="w-40" id="leave-status-filter"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            All Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-1/3" />
                    <div className="h-3 bg-secondary rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaves.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No leave requests found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusFilter ? `No ${statusFilter} leave requests` : 'No leave requests submitted yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaves.map(leave => {
                const cfg = statusConfig[leave.status] || statusConfig.pending;
                const CfgIcon = cfg.icon;
                const leaveTypeLabel = LEAVE_TYPES.find(t => t.value === leave.leaveType)?.label || leave.leaveType;
                const days = getDayCount(leave.fromDate, leave.toDate);
                const salesperson = leave.user;
                return (
                  <div key={leave._id} className="p-4 flex items-start gap-4 hover:bg-secondary/30 transition-colors">
                    <div className={`p-2.5 rounded-full border ${cfg.color} shrink-0`}>
                      <CfgIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {salesperson && (
                        <p className="text-xs font-semibold text-primary mb-0.5">
                          {salesperson.name || salesperson.email}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{leaveTypeLabel}</span>
                        {leave.halfDay && (
                          <Badge variant="outline" className="text-[10px]">Half Day</Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] border ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(leave.fromDate)}
                        {leave.fromDate !== leave.toDate && ` → ${formatDate(leave.toDate)}`}
                        {' '}· {days} day{days !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </p>
                      {leave.remarks && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          Remarks: {leave.remarks}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right space-y-2">
                      <p className="text-xs text-muted-foreground">{formatDate(leave.createdAt)}</p>
                      {leave.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                            onClick={() => openApprove(leave, 'approved')}
                            id={`approve-leave-${leave._id}`}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs"
                            onClick={() => openApprove(leave, 'rejected')}
                            id={`reject-leave-${leave._id}`}
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

      {/* Approve/Reject Modal */}
      <Dialog open={!!approveModal} onOpenChange={() => setApproveModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${approveModal?.action === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
              {approveModal?.action === 'approved'
                ? <><CheckCircle2 className="h-4 w-4" /> Approve Leave Request</>
                : <><XCircle className="h-4 w-4" /> Reject Leave Request</>
              }
            </DialogTitle>
          </DialogHeader>
          {approveModal && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><strong>Employee:</strong> {approveModal.leave.user?.name || approveModal.leave.user?.email || '—'}</p>
                <p><strong>Type:</strong> {LEAVE_TYPES.find(t => t.value === approveModal.leave.leaveType)?.label}</p>
                <p><strong>Duration:</strong> {formatDate(approveModal.leave.fromDate)} → {formatDate(approveModal.leave.toDate)} ({getDayCount(approveModal.leave.fromDate, approveModal.leave.toDate)} days)</p>
                <p><strong>Reason:</strong> {approveModal.leave.reason}</p>
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
                  id="leave-remarks-input"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveModal(null)}>Cancel</Button>
                <Button
                  onClick={handleApprove}
                  loading={submitting}
                  className={approveModal.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                  id="confirm-leave-action-btn"
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

function SalesLeaveView() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { canCreate } = useModulePermissions(MODULES.LEAVE);

  const [form, setForm] = useState({
    fromDate: '',
    toDate: '',
    leaveType: 'casual',
    reason: '',
    halfDay: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.getAll({ page, limit: LIMIT });
      setLeaves(res.leaves || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load leave requests');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openApply = () => {
    const today = new Date().toISOString().split('T')[0];
    setForm({ fromDate: today, toDate: today, leaveType: 'casual', reason: '', halfDay: false });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromDate || !form.toDate) { toast.error('Please select leave dates'); return; }
    if (!form.reason.trim()) { toast.error('Please provide a reason'); return; }
    if (new Date(form.toDate) < new Date(form.fromDate)) { toast.error('To date must be on or after from date'); return; }
    setSubmitting(true);
    try {
      await leaveService.apply({
        fromDate: form.fromDate,
        toDate: form.toDate,
        leaveType: form.leaveType,
        reason: form.reason,
        halfDay: form.halfDay,
      });
      toast.success('Leave application submitted!');
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const totalLeaveDays = approved > 0
    ? leaves.filter(l => l.status === 'approved').reduce((s, l) => s + getDayCount(l.fromDate, l.toDate), 0)
    : 0;

  return (
    <div>
      <PageHeader title="Leave Management" description="Apply for and track your leave requests">
        {canCreate && (
          <Button onClick={openApply} id="apply-leave-btn">
            <Plus className="h-4 w-4" /> Apply Leave
          </Button>
        )}
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applications', value: total, color: 'text-blue-600' },
          { label: 'Pending', value: pending, color: 'text-amber-600' },
          { label: 'Approved', value: approved, color: 'text-emerald-600' },
          { label: 'Total Days Availed', value: `${totalLeaveDays} days`, color: 'text-violet-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 flex gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-secondary shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-1/2" />
                    <div className="h-3 bg-secondary rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaves.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarOff className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No leave requests</p>
              <p className="text-xs text-muted-foreground mt-1">Apply for leave when needed</p>
              {canCreate && (
                <Button className="mt-4" size="sm" onClick={openApply}>
                  <Plus className="h-4 w-4" /> Apply Leave
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaves.map(leave => {
                const cfg = statusConfig[leave.status] || statusConfig.pending;
                const CfgIcon = cfg.icon;
                const leaveTypeLabel = LEAVE_TYPES.find(t => t.value === leave.leaveType)?.label || leave.leaveType;
                const days = getDayCount(leave.fromDate, leave.toDate);
                return (
                  <div key={leave._id} className="p-4 flex items-start gap-4 hover:bg-secondary/30 transition-colors">
                    <div className={`p-2.5 rounded-full border ${cfg.color} shrink-0`}>
                      <CfgIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{leaveTypeLabel}</span>
                        {leave.halfDay && (
                          <Badge variant="outline" className="text-[10px]">Half Day</Badge>
                        )}
                        <Badge variant="outline" className={`text-[10px] border ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(leave.fromDate)}
                        {leave.fromDate !== leave.toDate && ` → ${formatDate(leave.toDate)}`}
                        {' '}· {days} day{days !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        <span className="font-medium">Reason:</span> {leave.reason}
                      </p>
                      {leave.remarks && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          Manager: {leave.remarks}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDate(leave.createdAt)}
                    </p>
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

      {/* Apply Leave Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Apply for Leave
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Leave Type</label>
              <Select value={form.leaveType} onValueChange={v => setForm(p => ({ ...p, leaveType: v }))}>
                <SelectTrigger id="leave-type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="From Date"
                value={form.fromDate}
                onChange={e => setForm(p => ({ ...p, fromDate: e.target.value, toDate: e.target.value > p.toDate ? e.target.value : p.toDate }))}
                required
              />
              <Input
                type="date"
                label="To Date"
                value={form.toDate}
                min={form.fromDate}
                onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))}
                required
              />
            </div>
            {form.fromDate && form.toDate && (
              <p className="text-xs text-muted-foreground">
                Duration: <strong>{getDayCount(form.fromDate, form.toDate)} day{getDayCount(form.fromDate, form.toDate) !== 1 ? 's' : ''}</strong>
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="half-day"
                checked={form.halfDay}
                onChange={e => setForm(p => ({ ...p, halfDay: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="half-day" className="text-sm font-medium cursor-pointer">Half Day</label>
            </div>
            <Textarea
              label="Reason *"
              placeholder="Please provide reason for leave..."
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              required
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              📋 Your leave application will be reviewed by your manager.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting} id="submit-leave-btn">Submit Application</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function LeavePage() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminLeaveView /> : <SalesLeaveView />;
}
