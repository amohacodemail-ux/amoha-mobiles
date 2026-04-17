'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import {
  Users, UserCheck, UserX, AlertTriangle, Shield, Search,
  ChevronLeft, ChevronRight, Tag, StickyNote, Eye, Zap,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { customerMgmtService } from '@/services/customer-mgmt.service';
import { formatDate } from '@/lib/utils';
import type { CustomerProfile, CustomerDashboardStats, FraudFlag } from '@/types';

const LIMIT = 15;

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

const segmentColors: Record<string, string> = {
  vip: 'bg-purple-50 text-purple-700 border-purple-200',
  frequent: 'bg-blue-50 text-blue-700 border-blue-200',
  regular: 'bg-gray-50 text-gray-700 border-gray-200',
  inactive: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  new: 'bg-green-50 text-green-700 border-green-200',
};

const severityColors: Record<string, string> = {
  low: 'bg-gray-50 text-gray-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-orange-50 text-orange-700',
  critical: 'bg-red-50 text-red-700',
};

type Tab = 'customers' | 'fraud' | 'segments';

export default function CustomersPage() {
  const [tab, setTab] = useState<Tab>('customers');
  const [stats, setStats] = useState<CustomerDashboardStats | null>(null);

  // Customers
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [segmentFilter, setSegmentFilter] = useState('');

  // Customer detail dialog
  const [detailCustomer, setDetailCustomer] = useState<CustomerProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Note form
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteUserId, setNoteUserId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('note');
  const [noteSaving, setNoteSaving] = useState(false);

  // Tag form
  const [tagOpen, setTagOpen] = useState(false);
  const [tagUserId, setTagUserId] = useState('');
  const [tagText, setTagText] = useState('');

  // Fraud
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudPage, setFraudPage] = useState(1);
  const [fraudTotalPages, setFraudTotalPages] = useState(1);

  const loadStats = async () => {
    try {
      const data = await customerMgmtService.getDashboardStats();
      setStats(data);
    } catch { /* ignore */ }
  };

  const debouncedSearch = useDebouncedValue(search, 350);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await customerMgmtService.getAll({ page, limit: LIMIT, search: debouncedSearch, segment: segmentFilter });
      setCustomers(result.customers || []);
      setTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, segmentFilter]);

  const loadFraudFlags = useCallback(async () => {
    setFraudLoading(true);
    try {
      const result = await customerMgmtService.getFraudFlags({ page: fraudPage, limit: LIMIT });
      setFraudFlags(result.flags || []);
      setFraudTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load fraud flags'); }
    finally { setFraudLoading(false); }
  }, [fraudPage]);

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === 'customers') loadCustomers(); }, [tab, loadCustomers]);
  useEffect(() => { if (tab === 'fraud') loadFraudFlags(); }, [tab, loadFraudFlags]);

  const viewCustomerDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const detail = await customerMgmtService.getDetail(id);
      setDetailCustomer(detail);
    } catch { toast.error('Failed to load customer detail'); }
    finally { setDetailLoading(false); }
  };

  const handleUpdateSegment = async (userId: string, segment: string) => {
    try {
      await customerMgmtService.updateSegment(userId, segment);
      toast.success('Segment updated');
      loadCustomers();
      loadStats();
      if (detailCustomer && detailCustomer._id === userId) {
        setDetailCustomer({ ...detailCustomer, segment: segment as any });
      }
    } catch { toast.error('Failed to update segment'); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return toast.error('Note is required');
    setNoteSaving(true);
    try {
      await customerMgmtService.addNote(noteUserId, { note: noteText, type: noteType });
      toast.success('Note added');
      setNoteOpen(false);
      setNoteText('');
      if (detailCustomer && detailCustomer._id === noteUserId) viewCustomerDetail(noteUserId);
    } catch { toast.error('Failed to add note'); }
    finally { setNoteSaving(false); }
  };

  const handleAddTag = async () => {
    if (!tagText.trim()) return toast.error('Tag is required');
    try {
      await customerMgmtService.addTag(tagUserId, tagText.trim());
      toast.success('Tag added');
      setTagOpen(false);
      setTagText('');
      if (detailCustomer && detailCustomer._id === tagUserId) viewCustomerDetail(tagUserId);
    } catch { toast.error('Failed to add tag'); }
  };

  const handleAutoSegment = async () => {
    try {
      const result = await customerMgmtService.autoSegment();
      toast.success(`Processed ${result.totalProcessed} customers, updated ${result.updated}`);
      loadCustomers();
      loadStats();
    } catch { toast.error('Failed to run auto-segmentation'); }
  };

  const handleRunFraudDetection = async () => {
    try {
      const result = await customerMgmtService.runFraudDetection();
      toast.success(`Fraud detection complete: ${result.flagsCreated} new flags`);
      loadFraudFlags();
      loadStats();
    } catch { toast.error('Failed to run fraud detection'); }
  };

  const handleResolveFraud = async (flagId: string) => {
    const note = prompt('Enter resolution note:');
    if (!note) return;
    try {
      await customerMgmtService.resolveFraudFlag(flagId, note);
      toast.success('Flag resolved');
      loadFraudFlags();
      loadStats();
    } catch { toast.error('Failed to resolve flag'); }
  };

  const customerColumns: Column<CustomerProfile>[] = [
    {
      key: 'name', header: 'Customer', sortable: true,
      render: (c) => (
        <div>
          <p className="font-medium text-foreground">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.email}</p>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (c) => <span className="text-sm">{c.phone}</span> },
    {
      key: 'segment', header: 'Segment',
      render: (c) => (
        <select value={c.segment} onChange={e => handleUpdateSegment(c._id, e.target.value)}
          className={`text-xs px-2 py-1 rounded border font-medium ${segmentColors[c.segment] || ''}`}>
          <option value="vip">VIP</option>
          <option value="frequent">Frequent</option>
          <option value="regular">Regular</option>
          <option value="inactive">Inactive</option>
          <option value="new">New</option>
        </select>
      ),
    },
    { key: 'totalOrders', header: 'Orders', render: (c) => <span className="text-sm">{c.totalOrders}</span> },
    { key: 'totalSpent', header: 'Total Spent', render: (c) => <span className="text-sm font-medium">₹{(c.totalSpent || 0).toLocaleString()}</span> },
    {
      key: 'fraudFlagCount', header: 'Flags',
      render: (c) => c.fraudFlagCount > 0 ? <Badge variant="outline" className="bg-red-50 text-red-700">{c.fraudFlagCount}</Badge> : <span className="text-sm text-muted-foreground">0</span>,
    },
    {
      key: 'actions', header: '',
      render: (c) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => viewCustomerDetail(c._id)}><Eye className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setNoteUserId(c._id); setNoteOpen(true); }}><StickyNote className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { setTagUserId(c._id); setTagOpen(true); }}><Tag className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const fraudColumns: Column<FraudFlag>[] = [
    { key: 'user', header: 'Customer', render: (f) => <span className="text-sm font-medium">{f.user?.name || '-'}</span> },
    {
      key: 'flagType', header: 'Type',
      render: (f) => <Badge variant="outline">{f.flagType.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'severity', header: 'Severity',
      render: (f) => <Badge variant="outline" className={severityColors[f.severity]}>{f.severity}</Badge>,
    },
    { key: 'description', header: 'Description', render: (f) => <span className="text-sm text-muted-foreground line-clamp-1">{f.description}</span> },
    {
      key: 'status', header: 'Status',
      render: (f) => f.isResolved
        ? <Badge variant="outline" className="bg-green-50 text-green-700">Resolved</Badge>
        : <Badge variant="outline" className="bg-red-50 text-red-700">Open</Badge>,
    },
    {
      key: 'actions', header: '',
      render: (f) => !f.isResolved ? <Button variant="outline" size="sm" onClick={() => handleResolveFraud(f._id)}>Resolve</Button> : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Management" description="Customer profiles, segmentation, fraud detection, and notes" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="bg-blue-500" />
          <StatCard title="New This Month" value={stats.newThisMonth} icon={UserCheck} color="bg-green-500" />
          <StatCard title="VIP Customers" value={stats.segmentCounts?.vip || 0} icon={Shield} color="bg-purple-500" />
          <StatCard title="Fraud Flags" value={stats.activeFraudFlags} icon={AlertTriangle} color="bg-red-500" />
          <StatCard title="Blocked Users" value={stats.blockedUsers} icon={UserX} color="bg-gray-500" />
        </div>
      )}

      {/* Segment distribution */}
      {stats?.segmentCounts && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Segment Distribution</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.segmentCounts).map(([seg, count]) => (
              <div key={seg} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${segmentColors[seg] || ''}`}>
                {seg.toUpperCase()}: {count}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {(['customers', 'fraud', 'segments'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t === 'customers' ? 'All Customers' : t === 'fraud' ? 'Fraud Detection' : 'Segmentation'}
          </button>
        ))}
      </div>

      {/* Customers Tab */}
      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search customers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <select value={segmentFilter} onChange={e => { setSegmentFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">All Segments</option>
              <option value="vip">VIP</option>
              <option value="frequent">Frequent</option>
              <option value="regular">Regular</option>
              <option value="inactive">Inactive</option>
              <option value="new">New</option>
            </select>
          </div>
          <DataTable columns={customerColumns} data={customers} loading={loading} rowKey={(c) => c._id} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Fraud Tab */}
      {tab === 'fraud' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleRunFraudDetection}><Zap className="h-4 w-4 mr-2" /> Run Detection</Button>
          </div>
          <DataTable columns={fraudColumns} data={fraudFlags} loading={fraudLoading} rowKey={(f) => f._id} />
          {fraudTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setFraudPage(p => Math.max(1, p - 1))} disabled={fraudPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {fraudPage} of {fraudTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setFraudPage(p => Math.min(fraudTotalPages, p + 1))} disabled={fraudPage >= fraudTotalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Segments Tab */}
      {tab === 'segments' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleAutoSegment}><Zap className="h-4 w-4 mr-2" /> Auto-Segment All</Button>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Segmentation Rules</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><Badge variant="outline" className={segmentColors.vip}>VIP</Badge> Total spent &ge; &#8377;50,000 or 10+ orders</p>
              <p><Badge variant="outline" className={segmentColors.frequent}>Frequent</Badge> 5+ orders</p>
              <p><Badge variant="outline" className={segmentColors.regular}>Regular</Badge> Default segment</p>
              <p><Badge variant="outline" className={segmentColors.inactive}>Inactive</Badge> No orders in 90+ days</p>
              <p><Badge variant="outline" className={segmentColors.new}>New</Badge> No orders placed yet</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Detail</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading...</div>
          ) : detailCustomer && (
            <div className="space-y-6 py-4">
              {/* Profile */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {detailCustomer.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{detailCustomer.name}</h3>
                  <p className="text-sm text-muted-foreground">{detailCustomer.email} &middot; {detailCustomer.phone}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={segmentColors[detailCustomer.segment]}>{detailCustomer.segment}</Badge>
                    {detailCustomer.isBlocked && <Badge variant="outline" className="bg-red-50 text-red-700">Blocked</Badge>}
                    {detailCustomer.isVerified && <Badge variant="outline" className="bg-green-50 text-green-700">Verified</Badge>}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{detailCustomer.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">₹{(detailCustomer.totalSpent || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">₹{(detailCustomer.avgOrderValue || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Avg Order</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{detailCustomer.cancelledOrders}</p>
                  <p className="text-xs text-muted-foreground">Cancelled</p>
                </div>
              </div>

              {/* Tags */}
              {detailCustomer.tags && detailCustomer.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailCustomer.tags.map(t => (
                      <Badge key={t._id} variant="outline">{t.tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Fraud Flags */}
              {detailCustomer.fraudFlags && detailCustomer.fraudFlags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-red-600">Fraud Flags</h4>
                  <div className="space-y-2">
                    {detailCustomer.fraudFlags.map(f => (
                      <div key={f._id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg text-sm">
                        <div>
                          <span className="font-medium">{f.flagType.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground ml-2">{f.description}</span>
                        </div>
                        <Badge variant="outline" className={severityColors[f.severity]}>{f.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {detailCustomer.notes && detailCustomer.notes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Admin Notes</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detailCustomer.notes.map(n => (
                      <div key={n._id} className="p-2 bg-muted/30 rounded-lg text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{n.type}</Badge>
                          <span className="text-xs text-muted-foreground">{n.admin?.name || 'Admin'} &middot; {formatDate(n.createdAt)}</span>
                          {n.isPinned && <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">Pinned</Badge>}
                        </div>
                        <p>{n.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {detailCustomer.orders && detailCustomer.orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Recent Orders</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {detailCustomer.orders.slice(0, 10).map((o: any) => (
                      <div key={o._id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm">
                        <span className="font-mono">{o.orderNumber}</span>
                        <span>₹{Number(o.totalAmount).toLocaleString()}</span>
                        <Badge variant="outline">{o.orderStatus}</Badge>
                        <span className="text-muted-foreground text-xs">{formatDate(o.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Note</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={noteType} onChange={e => setNoteType(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="note">Note</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="follow_up">Follow Up</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Note *</label>
              <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} placeholder="Enter note..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={noteSaving}>{noteSaving ? 'Saving...' : 'Add Note'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={tagOpen} onOpenChange={setTagOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tag</DialogTitle></DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Tag *</label>
            <Input value={tagText} onChange={e => setTagText(e.target.value)} placeholder="e.g. high-value, needs-follow-up" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagOpen(false)}>Cancel</Button>
            <Button onClick={handleAddTag}>Add Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
