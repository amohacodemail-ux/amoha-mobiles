'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Crown, TrendingUp, UserCheck, UserPlus, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { crmService, CrmCustomer, SegmentSummary, CreateCustomerPayload } from '@/services/crm.service';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';

const EMPTY_FORM: CreateCustomerPayload = {
  name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', notes: '', tags: '',
};

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: CrmCustomer) => void }) {
  const [form, setForm] = useState<CreateCustomerPayload>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateCustomerPayload, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k: keyof CreateCustomerPayload, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof CreateCustomerPayload, string>> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = 'Phone must be exactly 10 digits';
    if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Invalid email format';
    if (form.pincode?.trim() && !/^\d{6}$/.test(form.pincode.trim())) e.pincode = 'Pincode must be 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateCustomerPayload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        ...(form.email?.trim() && { email: form.email.trim() }),
        ...(form.address?.trim() && { address: form.address.trim() }),
        ...(form.city?.trim() && { city: form.city.trim() }),
        ...(form.state?.trim() && { state: form.state.trim() }),
        ...(form.pincode?.trim() && { pincode: form.pincode.trim() }),
        ...(form.notes?.trim() && { notes: form.notes.trim() }),
        ...(form.tags?.trim() && { tags: form.tags.trim() }),
      };
      const customer = await crmService.createCustomer(payload);
      toast.success(`Customer "${customer.name}" created successfully`);
      onCreated(customer);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create customer';
      if (msg.toLowerCase().includes('phone') && msg.toLowerCase().includes('exists')) {
        setErrors((prev) => ({ ...prev, phone: 'This phone number is already registered' }));
        toast.error('User with this phone already exists');
      } else if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exists')) {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered' }));
        toast.error('User with this email already exists');
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, field, type = 'text', placeholder, required }: { label: string; field: keyof CreateCustomerPayload; type?: string; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={(form[field] as string) || ''}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/40 transition ${errors[field] ? 'border-destructive' : 'border-input'}`}
      />
      {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add New Customer</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Field label="Full Name" field="name" placeholder="e.g. Ramesh Kumar" required /></div>
            <div className="col-span-2 md:col-span-1"><Field label="Phone Number" field="phone" placeholder="10-digit mobile number" required /></div>
            <div className="col-span-2 md:col-span-1"><Field label="Email" field="email" type="email" placeholder="optional" /></div>
          </div>
          <Field label="Address" field="address" placeholder="Street / Flat No." />
          <div className="grid grid-cols-3 gap-3">
            <Field label="City" field="city" placeholder="City" />
            <Field label="State" field="state" placeholder="State" />
            <Field label="Pincode" field="pincode" placeholder="6 digits" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Internal notes about this customer..."
              rows={2}
              className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
            />
          </div>
          <Field label="Tags / Segment" field="tags" placeholder="e.g. wholesale, walk-in" />
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LIMIT = 15;

const SEGMENT_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary'; icon: React.ElementType }> = {
  vip: { label: 'VIP', variant: 'default', icon: Crown },
  loyal: { label: 'Loyal', variant: 'success', icon: TrendingUp },
  regular: { label: 'Regular', variant: 'warning', icon: UserCheck },
  new: { label: 'New', variant: 'secondary', icon: UserPlus },
};

export default function CrmPage() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [segment, setSegment] = useState('all');
  const [segments, setSegments] = useState<SegmentSummary[]>([]);
  const [showModal, setShowModal] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmService.getCustomers({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        segment: segment !== 'all' ? segment : undefined,
      });
      setCustomers(Array.isArray(res.customers) ? res.customers : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.total);
    } catch {
      toast.error('Failed to load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, segment]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, segment]);

  useEffect(() => {
    crmService.getSegmentSummary().then(setSegments).catch(() => {});
  }, []);

  const handleCustomerCreated = (newCustomer: CrmCustomer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setTotalItems((n) => n + 1);
  };

  const getSegmentTotal = (seg: string) =>
    segments.find((s) => s.segment === seg)?.count ?? 0;
  const getSegmentRevenue = (seg: string) =>
    segments.find((s) => s.segment === seg)?.totalRevenue ?? 0;

  const columns: Column<CrmCustomer>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
            {getInitials(c.name)}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'segment',
      header: 'Segment',
      render: (c) => {
        const cfg = SEGMENT_CONFIG[c.segment] || SEGMENT_CONFIG.new;
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'totalOrders',
      header: 'Orders',
      render: (c) => <span className="font-medium">{c.totalOrders}</span>,
    },
    {
      key: 'totalSpent',
      header: 'Lifetime Value',
      render: (c) => <span className="font-semibold text-primary">{formatCurrency(c.totalSpent)}</span>,
    },
    {
      key: 'lastOrderDate',
      header: 'Last Order',
      render: (c) => (
        <span className="text-xs text-muted-foreground">
          {c.lastOrderDate ? formatDate(c.lastOrderDate) : '—'}
        </span>
      ),
    },
    {
      key: 'notesCount',
      header: 'Notes',
      render: (c) => (
        <span className="text-xs text-muted-foreground">{c.notesCount}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (c) => <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <Link href={`/crm/${c._id}`}>
          <Button variant="outline" size="sm">View Profile</Button>
        </Link>
      ),
    },
  ];

  return (
    <div>
      {showModal && <AddCustomerModal onClose={() => setShowModal(false)} onCreated={handleCustomerCreated} />}
      <PageHeader
        title="CRM"
        description="Customer relationship management and segmentation"
        action={<Button onClick={() => setShowModal(true)}><UserPlus className="h-4 w-4 mr-2" />Add Customer</Button>}
      />

      {/* Segment summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(SEGMENT_CONFIG).map(([seg, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card
              key={seg}
              className={`cursor-pointer transition-all ${segment === seg ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setSegment(segment === seg ? 'all' : seg)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">{getSegmentTotal(seg)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(getSegmentRevenue(seg))} revenue
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All segments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All customers</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="loyal">Loyal</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="new">New</SelectItem>
          </SelectContent>
        </Select>
        {segment !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setSegment('all')}>
            Clear filter
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
        rowKey={(c) => c._id}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        pageSize={LIMIT}
      />
    </div>
  );
}
