'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Crown, TrendingUp, UserCheck, UserPlus,
  ShoppingBag, DollarSign, BarChart2, Trash2, Plus,
  Phone, Mail, Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { crmService, CrmCustomerProfile, CrmNote } from '@/services/crm.service';
import { formatCurrency, formatDate, formatDateTime, getInitials } from '@/lib/utils';

const SEGMENT_ICON: Record<string, React.ElementType> = {
  vip: Crown,
  loyal: TrendingUp,
  regular: UserCheck,
  new: UserPlus,
};

const SEGMENT_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  vip: 'default',
  loyal: 'success',
  regular: 'warning',
  new: 'secondary',
};

const NOTE_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'follow_up', label: 'Follow-up' },
];

const NOTE_TYPE_COLORS: Record<string, string> = {
  note: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  call: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  meeting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  follow_up: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function CrmCustomerPage({ params }: { params: { customerId: string } }) {
  const router = useRouter();
  const [profile, setProfile] = useState<CrmCustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);
  const [noteType, setNoteType] = useState('note');
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await crmService.getCustomerProfile(params.customerId);
      setProfile(data);
    } catch {
      toast.error('Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  }, [params.customerId]);

  useEffect(() => { load(); }, [load]);

  const handleAddNote = async () => {
    if (!noteContent.trim()) { toast.error('Note content is required'); return; }
    setSubmittingNote(true);
    try {
      await crmService.addNote(params.customerId, { type: noteType, content: noteContent.trim() });
      toast.success('Note added');
      setNoteContent('');
      setNoteType('note');
      setAddingNote(false);
      load();
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    try {
      await crmService.deleteNote(noteId);
      toast.success('Note deleted');
      load();
    } catch {
      toast.error('Failed to delete note');
    } finally {
      setDeletingNoteId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const { customer, stats, recentOrders, notes } = profile;
  const SegmentIcon = SEGMENT_ICON[stats.segment] || UserPlus;
  const segmentVariant = SEGMENT_VARIANT[stats.segment] || 'secondary';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={customer.name}
          description={customer.email}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Customer info */}
          <Card>
            <CardHeader><CardTitle>Customer Info</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                  {getInitials(customer.name)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <Badge variant={segmentVariant} className="flex items-center gap-1">
                  <SegmentIcon className="h-3 w-3" />
                  {stats.segment.charAt(0).toUpperCase() + stats.segment.slice(1)}
                </Badge>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Customer since {formatDate(customer.createdAt)}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-xl font-bold">{stats.totalOrders}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lifetime Value</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalSpent)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BarChart2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg. Order Value</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.avgOrderValue)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent orders */}
          <Card>
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="flex items-center justify-between py-3">
                      <div>
                        <Link
                          href={`/orders/${order._id}`}
                          className="font-medium text-sm text-primary hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(order.totalAmount)}</p>
                        <Badge variant="secondary" className="text-xs">{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CRM Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interaction Notes</CardTitle>
                <Button size="sm" onClick={() => setAddingNote((v) => !v)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {addingNote && (
                <div className="mb-4 p-4 border border-border rounded-lg space-y-3 bg-muted/30">
                  <Select value={noteType} onValueChange={setNoteType}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <textarea
                    className="w-full min-h-[100px] p-3 text-sm border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Write your note here..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddNote} disabled={submittingNote}>
                      {submittingNote ? 'Saving...' : 'Save Note'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingNote(false); setNoteContent(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              {notes.length === 0 && !addingNote ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet. Add the first one.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note._id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${NOTE_TYPE_COLORS[note.type] || NOTE_TYPE_COLORS.note}`}>
                            {NOTE_TYPES.find((t) => t.value === note.type)?.label ?? note.type}
                          </span>
                          <span className="text-xs text-muted-foreground">by {note.author?.name ?? 'Admin'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-6 w-6 hover:text-destructive"
                            disabled={deletingNoteId === note._id}
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
