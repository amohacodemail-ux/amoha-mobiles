'use client';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Ruler, Plus, Camera, CheckCircle2, Clock, XCircle, Loader2, Filter, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/shared/pagination';
import { PageHeader } from '@/components/shared/page-header';
import { ImageUploader } from '@/components/shared/image-uploader';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface DistanceEntry {
  _id: string;
  expenseDate: string;
  description: string;
  travelMode: string;
  distanceKm: number;
  speedometerStart: number;
  speedometerEnd: number;
  speedometerPhotoUrl: string;
  amount: number;
  status: string;
  remarks?: string;
  user?: { _id: string; name: string; email: string };
}

const TRAVEL_MODES = ['bike', 'car', 'auto', 'bus', 'train', 'other'];
const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Pending', icon: Clock },
  approved: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved', icon: CheckCircle2 },
  rejected: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Rejected', icon: XCircle },
};

const LIMIT = 10;

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

function AdminDistanceView() {
  const [entries, setEntries] = useState<DistanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [approveModal, setApproveModal] = useState<{ entry: DistanceEntry; action: 'approved' | 'rejected' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/sales/distance-entries?page=${page}&limit=${LIMIT}`);
      const res = (data as any).data;
      setEntries(res.entries || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load distance entries');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async () => {
    if (!approveModal) return;
    if (approveModal.action === 'rejected' && !remarks.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.patch(`/sales/expenses/${approveModal.entry._id}/approve`, {
        approvalStatus: approveModal.action,
        rejectionReason: remarks
      });
      toast.success(`Distance claim ${approveModal.action} successfully`);
      setApproveModal(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Distance Allowances" description="Review and approve speedometer-based travel claims" />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Team Travel Claims
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading claims...</div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <Ruler className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No distance entries found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map(item => {
                const cfg = statusConfig[item.status] || statusConfig.pending;
                const Icon = cfg.icon;

                return (
                  <div key={item._id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2.5 rounded-full border ${cfg.color} shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="w-full">
                        {item.user && (
                          <p className="text-sm font-semibold text-primary mb-0.5">
                            {item.user.name || item.user.email}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground capitalize">{item.travelMode}</span>
                          <Badge variant="outline" className={`text-[10px] bg-transparent ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.expenseDate)}
                        </p>
                        <p className="text-sm mt-1">{item.description}</p>
                        
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border rounded-md p-2 bg-background w-full max-w-md">
                          <div><span className="text-muted-foreground block mb-0.5">Start</span>{item.speedometerStart}</div>
                          <div><span className="text-muted-foreground block mb-0.5">End</span>{item.speedometerEnd}</div>
                          <div><span className="text-muted-foreground block mb-0.5">Total Dist</span>{item.speedometerEnd - item.speedometerStart} km</div>
                        </div>

                        {item.remarks && (
                          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2 py-0.5 border-muted-foreground/30">
                            Notes: {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0 min-w-[120px] space-y-2 flex flex-col items-end sm:items-end w-full sm:w-auto">
                      <p className="text-lg font-bold text-foreground">₹{item.amount.toLocaleString()}</p>
                      {item.speedometerPhotoUrl && (
                        <a href={item.speedometerPhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center">
                          <Camera className="h-3 w-3 mr-1" /> View Photo
                        </a>
                      )}
                      
                      {item.status === 'pending' && (
                        <div className="flex gap-1.5 justify-end mt-2">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs px-2"
                            onClick={() => { setApproveModal({ entry: item, action: 'approved' }); setRemarks(''); }}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                            onClick={() => { setApproveModal({ entry: item, action: 'rejected' }); setRemarks(''); }}
                          >
                            Reject
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
                ? <><CheckCircle2 className="h-4 w-4" /> Approve Allowance</>
                : <><XCircle className="h-4 w-4" /> Reject Allowance</>
              }
            </DialogTitle>
          </DialogHeader>
          {approveModal && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p><strong>Employee:</strong> {approveModal.entry.user?.name || approveModal.entry.user?.email || '—'}</p>
                <p><strong>Distance:</strong> {approveModal.entry.speedometerEnd - approveModal.entry.speedometerStart} km</p>
                <p><strong>Amount:</strong> ₹{approveModal.entry.amount.toLocaleString()}</p>
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

function SalesDistanceView() {
  const { canCreate } = useModulePermissions(MODULES.DISTANCE_CALCULATION);
  const [entries, setEntries] = useState<DistanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    travelMode: 'bike',
    speedometerStart: '',
    speedometerEnd: '',
    amount: '',
    description: '',
    speedometerPhotoUrl: '',
  });

  const computedDistance = () => {
    const s = parseInt(form.speedometerStart);
    const e = parseInt(form.speedometerEnd);
    if (!isNaN(s) && !isNaN(e) && e >= s) return e - s;
    return null;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/sales/distance-entries?page=${page}&limit=${LIMIT}`);
      const res = (data as any).data;
      setEntries(res.entries || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load distance entries');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.speedometerStart || !form.speedometerEnd) {
      toast.error('Both speedometer readings are required');
      return;
    }
    const start = parseInt(form.speedometerStart);
    const end = parseInt(form.speedometerEnd);
    if (end < start) {
      toast.error('End reading cannot be less than start reading');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/sales/distance-entries', {
        expenseDate: form.expenseDate,
        travelMode: form.travelMode,
        speedometerStart: start,
        speedometerEnd: end,
        amount: parseFloat(form.amount) || 0,
        description: form.description,
        speedometerPhotoUrl: form.speedometerPhotoUrl,
      });
      toast.success('Distance entry submitted for approval');
      setModalOpen(false);
      setForm({ ...form, speedometerStart: '', speedometerEnd: '', amount: '', description: '', speedometerPhotoUrl: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit distance entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Distance Calculation" description="Log your daily travel using speedometer readings">
        {canCreate && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Log Travel
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Travel Logs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="py-16 text-center">
              <Ruler className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No travel logs found</p>
              <p className="text-xs text-muted-foreground mt-1">Start recording your field travel distances.</p>
              {canCreate && (
                <Button className="mt-4" size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Log Travel
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map(item => {
                const cfg = statusConfig[item.status] || statusConfig.pending;
                const Icon = cfg.icon || Clock;

                return (
                  <div key={item._id} className="p-4 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-full border ${cfg.color} shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground capitalize">{item.travelMode}</span>
                          <Badge variant="outline" className={`text-[10px] bg-transparent ${cfg.color}`}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.expenseDate)}
                        </p>
                        <p className="text-sm mt-1">{item.description}</p>
                        
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border rounded-md p-2 bg-background w-full max-w-md">
                          <div><span className="text-muted-foreground block mb-0.5">Start</span>{item.speedometerStart}</div>
                          <div><span className="text-muted-foreground block mb-0.5">End</span>{item.speedometerEnd}</div>
                          <div><span className="text-muted-foreground block mb-0.5">Total Dist</span>{item.speedometerEnd - item.speedometerStart} km</div>
                        </div>

                        {item.remarks && (
                          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2 py-0.5 border-muted-foreground/30">
                            Manager: {item.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 pl-14 sm:pl-0">
                      <p className="text-lg font-bold text-foreground">₹{item.amount.toLocaleString()}</p>
                      {item.speedometerPhotoUrl && (
                        <a href={item.speedometerPhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center sm:justify-end mt-1">
                          <Camera className="h-3 w-3 mr-1" /> Photo attached
                        </a>
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Speedometer Travel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date *"
                type="date"
                value={form.expenseDate}
                onChange={e => setForm(p => ({ ...p, expenseDate: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium block mb-1.5">Travel Mode *</label>
                <Select value={form.travelMode} onValueChange={v => setForm(p => ({ ...p, travelMode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRAVEL_MODES.map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Reading *"
                type="number"
                min="0"
                value={form.speedometerStart}
                onChange={e => setForm(p => ({ ...p, speedometerStart: e.target.value }))}
                placeholder="0"
              />
              <Input
                label="End Reading *"
                type="number"
                min="0"
                value={form.speedometerEnd}
                onChange={e => setForm(p => ({ ...p, speedometerEnd: e.target.value }))}
                placeholder="0"
              />
            </div>

            {computedDistance() !== null && (
              <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium text-center">
                Total Distance: {computedDistance()} km
              </div>
            )}

            <Input
              label="Claim Amount (₹) *"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              placeholder="0.00"
            />

            <Input
              label="Description *"
              placeholder="e.g. Visited North Branch retailers..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />

            <ImageUploader
              label="Speedometer Photo"
              folder="distance"
              value={form.speedometerPhotoUrl}
              onChange={url => setForm(p => ({ ...p, speedometerPhotoUrl: url }))}
            />

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} loading={submitting}>Submit Log</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function DistanceCalculationPage() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminDistanceView /> : <SalesDistanceView />;
}
