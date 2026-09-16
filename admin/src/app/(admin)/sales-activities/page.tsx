'use client';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Pencil, MapPin, Phone, TrendingUp, CheckCircle2, Clock, XCircle, Car, FileText, Users, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/shared/pagination';
import { dailyActivityService, type DailyActivity } from '@/services/sales.service';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';

const LIMIT = 10;

const VISIT_TYPES = [
  { value: 'productive', label: 'Productive Visit' },
  { value: 'non_productive', label: 'Non-Productive Visit' },
  { value: 'office', label: 'Office Work' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other' },
];

const visitTypeConfig: Record<string, { color: string; icon: React.ElementType }> = {
  productive: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  non_productive: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: XCircle },
  office: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CalendarDays },
  travel: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Car },
  other: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock },
};

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
};

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

function AdminActivityView() {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  
  const [approveModal, setApproveModal] = useState<{ activity: DailyActivity; action: 'approved' | 'rejected' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dailyActivityService.getAll({ page, limit: LIMIT, date: dateFilter || undefined });
      setActivities(res.activities || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!approveModal) return;
    if (approveModal.action === 'rejected' && !remarks.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      await dailyActivityService.approve(approveModal.activity._id, approveModal.action, remarks);
      toast.success(`Activity ${approveModal.action} successfully`);
      setApproveModal(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = activities.filter(a => a.approvalStatus === 'pending').length;

  return (
    <div>
      <PageHeader title="Daily Activities" description="Review salesperson daily activities and field reports" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Activities', value: total, color: 'text-blue-600' },
          { label: 'Pending Review', value: pendingCount, color: 'text-amber-600' },
          { label: 'Productive Visits', value: activities.filter(a => a.visitType === 'productive').length, color: 'text-emerald-600' },
          { label: 'Order Value', value: '₹' + activities.reduce((sum, a) => sum + (a.orderValue || 0), 0).toLocaleString(), color: 'text-violet-600' },
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
        <Input 
          type="date" 
          value={dateFilter} 
          onChange={e => { setDateFilter(e.target.value); setPage(1); }} 
          className="w-48 h-9" 
        />
        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFilter(''); setPage(1); }}>Clear</Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Field Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No activities found</p>
              <p className="text-xs text-muted-foreground mt-1">Sales team hasn't submitted reports yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map(item => {
                const cfg = visitTypeConfig[item.visitType] || visitTypeConfig.other;
                const CfgIcon = cfg.icon;
                const statusCfg = statusConfig[item.approvalStatus || 'pending'] || statusConfig.pending;
                const StatusIcon = statusCfg.icon;
                const salesperson = item.user;

                return (
                  <div key={item._id} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-secondary/30 transition-colors">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <CfgIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          {salesperson && (
                            <p className="text-sm font-semibold text-primary mb-1">
                              {salesperson.name || salesperson.email}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-foreground text-sm">
                              {item.customerName || VISIT_TYPES.find(v => v.value === item.visitType)?.label}
                            </span>
                            <Badge variant="outline" className={`text-[10px] ${cfg.color} bg-transparent`}>
                              {VISIT_TYPES.find(v => v.value === item.visitType)?.label}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${statusCfg.color} bg-transparent`}>
                              {statusCfg.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{formatDate(item.activityDate)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(item.createdAt).split(' ')[1]}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                        {item.location && (
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1.5" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                        {item.orderValue > 0 && (
                          <div className="flex items-center text-emerald-600 font-medium">
                            <TrendingUp className="h-3 w-3 mr-1.5" />
                            Order: ₹{item.orderValue.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          <span className="font-medium text-foreground">Notes: </span>{item.notes}
                        </p>
                      )}
                      
                      {item.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 italic">
                          Remarks: {item.rejectionReason}
                        </p>
                      )}
                      
                      {/* Admin Action Buttons */}
                      {(item.approvalStatus === 'pending' || !item.approvalStatus) && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2"
                            onClick={() => { setApproveModal({ activity: item, action: 'approved' }); setRemarks(''); }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                            onClick={() => { setApproveModal({ activity: item, action: 'rejected' }); setRemarks(''); }}
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
                ? <><CheckCircle2 className="h-4 w-4" /> Approve Activity</>
                : <><XCircle className="h-4 w-4" /> Reject Activity</>
              }
            </DialogTitle>
          </DialogHeader>
          {approveModal && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><strong>Salesperson:</strong> {approveModal.activity.user?.name || approveModal.activity.user?.email || '—'}</p>
                <p><strong>Customer:</strong> {approveModal.activity.customerName || '—'}</p>
                <p><strong>Date:</strong> {formatDate(approveModal.activity.activityDate)}</p>
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

function SalesActivityView() {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<DailyActivity | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { canCreate, canEdit } = useModulePermissions(MODULES.DAILY_ACTIVITY);

  const [form, setForm] = useState({
    activityDate: new Date().toISOString().split('T')[0],
    customerName: '',
    visitType: 'productive',
    location: '',
    notes: '',
    productsDemoed: '',
    orderValue: '',
    status: 'completed',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dailyActivityService.getAll({ page, limit: LIMIT });
      setActivities(res.activities || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      activityDate: new Date().toISOString().split('T')[0],
      customerName: '',
      visitType: 'productive',
      location: '',
      notes: '',
      productsDemoed: '',
      orderValue: '',
      status: 'completed',
    });
    setModalOpen(true);
  };

  const openEdit = (item: DailyActivity) => {
    setEditItem(item);
    setForm({
      activityDate: item.activityDate,
      customerName: item.customerName,
      visitType: item.visitType,
      location: item.location || '',
      notes: item.notes || '',
      productsDemoed: item.productsDemoed || '',
      orderValue: item.orderValue ? String(item.orderValue) : '',
      status: item.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.activityDate) { toast.error('Date is required'); return; }
    
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        orderValue: form.orderValue ? parseFloat(form.orderValue) : 0
      };

      if (editItem) {
        await dailyActivityService.update(editItem._id, payload);
        toast.success('Activity updated!');
      } else {
        await dailyActivityService.create(payload);
        toast.success('Activity logged!');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Daily Activities" description="Log and track your field visits and tasks">
        {canCreate && (
          <Button onClick={openAdd} id="add-activity-btn">
            <Plus className="h-4 w-4" /> Log Activity
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No activities logged</p>
              <p className="text-xs text-muted-foreground mt-1">Start by logging your first field visit.</p>
              {canCreate && (
                <Button className="mt-4" size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4" /> Log Activity
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {activities.map(item => {
                const cfg = visitTypeConfig[item.visitType] || visitTypeConfig.other;
                const CfgIcon = cfg.icon;
                const statusCfg = statusConfig[item.approvalStatus || 'pending'] || statusConfig.pending;
                
                return (
                  <div key={item._id} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-secondary/30 transition-colors">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <CfgIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">
                            {item.customerName || VISIT_TYPES.find(v => v.value === item.visitType)?.label}
                          </span>
                          <Badge variant="outline" className={`text-[10px] ${cfg.color} bg-transparent`}>
                            {VISIT_TYPES.find(v => v.value === item.visitType)?.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${statusCfg.color} bg-transparent`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{formatDate(item.activityDate)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                        {item.location && (
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1.5" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                        {item.orderValue > 0 && (
                          <div className="flex items-center text-emerald-600 font-medium">
                            <TrendingUp className="h-3 w-3 mr-1.5" />
                            Order: ₹{item.orderValue.toLocaleString()}
                          </div>
                        )}
                      </div>
                      
                      {item.rejectionReason && (
                        <p className="text-xs text-red-600 mt-2 italic">
                          Manager Remarks: {item.rejectionReason}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 justify-end sm:flex-col shrink-0">
                      {canEdit && (!item.approvalStatus || item.approvalStatus === 'pending') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
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

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Activity' : 'Log New Activity'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Date *"
                value={form.activityDate}
                onChange={e => setForm(p => ({ ...p, activityDate: e.target.value }))}
                required
              />
              <div>
                <label className="text-sm font-medium block mb-1.5">Visit Type *</label>
                <Select value={form.visitType} onValueChange={v => setForm(p => ({ ...p, visitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.visitType === 'productive' && (
              <>
                <Input
                  label="Customer/Shop Name *"
                  value={form.customerName}
                  onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                  required
                />
                <Input
                  label="Order Value (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.orderValue}
                  onChange={e => setForm(p => ({ ...p, orderValue: e.target.value }))}
                  placeholder="e.g. 50000"
                />
                <Input
                  label="Products Demoed"
                  value={form.productsDemoed}
                  onChange={e => setForm(p => ({ ...p, productsDemoed: e.target.value }))}
                  placeholder="e.g. AMOHA X1, Z5"
                />
              </>
            )}

            {form.visitType === 'non_productive' && (
              <Input
                label="Customer/Shop Name *"
                value={form.customerName}
                onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                required
              />
            )}

            <Input
              label="Location Area"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Anna Nagar, Chennai"
            />
            
            <Textarea
              label="Visit Notes"
              placeholder="Summary of the visit or tasks done..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save Activity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function DailyActivityPage() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminActivityView /> : <SalesActivityView />;
}
