'use client';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Route, Plus, Pencil, CheckCircle2, Clock, MapPin, Navigation, CalendarOff, Users, Filter, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/shared/pagination';
import { tourPlanService, type TourPlan } from '@/services/sales.service';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';

const LIMIT = 10;

const statusConfig: Record<string, { color: string; label: string }> = {
  planned: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Planned' },
  in_progress: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'In Progress' },
  completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Cancelled' },
};

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

function AdminTourPlanView() {
  const [plans, setPlans] = useState<TourPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tourPlanService.getAll({ page, limit: LIMIT });
      setPlans(res.plans || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load tour plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const activePlansCount = plans.filter(p => p.status === 'planned' || p.status === 'in_progress').length;
  const completedPlansCount = plans.filter(p => p.status === 'completed').length;

  return (
    <div>
      <PageHeader title="Tour Plans (My Day)" description="Review and track salesperson field plans" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Plans', value: total, color: 'text-blue-600' },
          { label: 'Active Plans', value: activePlansCount, color: 'text-amber-600' },
          { label: 'Completed', value: completedPlansCount, color: 'text-emerald-600' },
          { label: 'Visits Planned', value: plans.reduce((sum, p) => sum + (p.plannedVisits || 0), 0), color: 'text-violet-600' },
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
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            All Team Tour Plans
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="py-16 text-center">
              <Route className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No tour plans found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusFilter ? `No ${statusFilter} plans found` : 'Sales team has not submitted any plans.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {plans.map(item => {
                const cfg = statusConfig[item.status] || statusConfig.planned;
                const salesperson = item.user;

                return (
                  <Card key={item._id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          {salesperson && (
                            <p className="text-sm font-semibold text-primary mb-1">
                              {salesperson.name || salesperson.email}
                            </p>
                          )}
                          <h3 className="font-semibold text-foreground">{item.title || 'My Day Plan'}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.planDate)}</p>
                        </div>
                        <Badge variant="outline" className={`bg-transparent ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 mt-4 text-sm">
                        <div className="flex items-start text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5 text-blue-500" />
                          <span className="line-clamp-2">{item.areas || 'No specific areas mentioned'}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Navigation className="h-4 w-4 mr-2 shrink-0 text-amber-500" />
                          <span>{item.plannedVisits || 0} visits planned</span>
                        </div>
                        {item.notes && (
                          <div className="flex items-start text-muted-foreground pt-2 border-t mt-3">
                            <FileText className="h-4 w-4 mr-2 shrink-0 mt-0.5 text-gray-400" />
                            <span className="text-xs italic line-clamp-2">{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={LIMIT} />
      </div>
    </div>
  );
}

// ─── SALES VIEW ──────────────────────────────────────────────────────────────

function SalesTourPlanView() {
  const [plans, setPlans] = useState<TourPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TourPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { canCreate, canEdit } = useModulePermissions(MODULES.TOUR_PLAN);

  const [form, setForm] = useState({
    planDate: new Date().toISOString().split('T')[0],
    title: '',
    areas: '',
    plannedVisits: '',
    notes: '',
    status: 'planned',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tourPlanService.getAll({ page, limit: LIMIT });
      setPlans(res.plans || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load tour plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      planDate: new Date().toISOString().split('T')[0],
      title: '',
      areas: '',
      plannedVisits: '',
      notes: '',
      status: 'planned',
    });
    setModalOpen(true);
  };

  const openEdit = (item: TourPlan) => {
    setEditItem(item);
    setForm({
      planDate: item.planDate,
      title: item.title,
      areas: item.areas,
      plannedVisits: String(item.plannedVisits || ''),
      notes: item.notes,
      status: item.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.planDate) { toast.error('Plan date is required'); return; }
    setSubmitting(true);
    try {
      const payload = {
        planDate: form.planDate,
        title: form.title || 'My Day Plan',
        areas: form.areas,
        plannedVisits: parseInt(form.plannedVisits) || 0,
        notes: form.notes,
        status: form.status,
      };

      if (editItem) {
        await tourPlanService.update(editItem._id, payload as Partial<TourPlan>);
        toast.success('Tour plan updated!');
      } else {
        await tourPlanService.create(payload);
        toast.success('Tour plan created!');
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save tour plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Tour Plan" description="Plan your field visits and routes">
        {canCreate && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" /> Create Plan
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Plans</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="py-16 text-center">
              <Route className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No tour plans found</p>
              <p className="text-xs text-muted-foreground mt-1">Start by creating your daily route plan.</p>
              {canCreate && (
                <Button className="mt-4" size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4" /> Create Plan
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {plans.map(item => {
                const cfg = statusConfig[item.status] || statusConfig.planned;
                return (
                  <Card key={item._id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{item.title || 'My Day Plan'}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(item.planDate)}</p>
                        </div>
                        <Badge variant="outline" className={`bg-transparent ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </div>

                      <div className="space-y-2 mt-4 text-sm">
                        <div className="flex items-start text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 shrink-0 mt-0.5 text-blue-500" />
                          <span className="line-clamp-2">{item.areas || 'No specific areas mentioned'}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Navigation className="h-4 w-4 mr-2 shrink-0 text-amber-500" />
                          <span>{item.plannedVisits || 0} visits planned</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-[10px] text-muted-foreground">
                          Created {formatDate(item.createdAt).split(' ')[0]}
                        </p>
                        {canEdit && item.status !== 'completed' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => openEdit(item)}>
                            <Pencil className="h-3 w-3 mr-1" /> Update Status
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Update Tour Plan' : 'Create Tour Plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="date"
              label="Plan Date *"
              value={form.planDate}
              onChange={e => setForm(p => ({ ...p, planDate: e.target.value }))}
              required
            />
            
            <Input
              label="Plan Title"
              placeholder="e.g. North City Route"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            />

            <Textarea
              label="Areas to Visit *"
              placeholder="e.g. T Nagar, Nungambakkam..."
              value={form.areas}
              onChange={e => setForm(p => ({ ...p, areas: e.target.value }))}
              required
              rows={2}
            />

            <Input
              type="number"
              label="Planned Number of Visits"
              min="0"
              value={form.plannedVisits}
              onChange={e => setForm(p => ({ ...p, plannedVisits: e.target.value }))}
              placeholder="e.g. 15"
            />

            {editItem && (
              <div>
                <label className="text-sm font-medium block mb-1.5">Status</label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Textarea
              label="Additional Notes"
              placeholder="Any specific targets or tasks..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function TourPlanPage() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminTourPlanView /> : <SalesTourPlanView />;
}
