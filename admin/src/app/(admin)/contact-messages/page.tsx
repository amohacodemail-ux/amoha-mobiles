'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useDebouncedValue } from '@/lib/hooks';
import toast from 'react-hot-toast';
import { Trash2, Eye, MailOpen, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Pagination } from '@/components/shared/pagination';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  contactService,
  type ContactMessage,
} from '@/services/contact.service';
import { formatDate } from '@/lib/utils';

const LIMIT = 10;

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailMessage, setDetailMessage] = useState<ContactMessage | null>(null);

  const debouncedSearch = useDebouncedValue(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactService.getAll({ page, limit: LIMIT, search: debouncedSearch });
      setMessages(Array.isArray(res.messages) ? res.messages : []);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalMessages);
    } catch {
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await contactService.delete(deleteId);
      toast.success('Message deleted');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openDetail = async (msg: ContactMessage) => {
    setDetailMessage(msg);
    if (!msg.isRead) {
      try {
        await contactService.markRead(msg._id);
        setMessages((prev) =>
          prev.map((m) => (m._id === msg._id ? { ...m, isRead: true } : m)),
        );
      } catch {
        // silently fail
      }
    }
  };

  const columns: Column<ContactMessage>[] = [
    {
      key: 'name',
      header: 'From',
      render: (m) => (
        <div className="flex items-center gap-2">
          {!m.isRead && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />}
          <div>
            <p className={`text-sm ${m.isRead ? 'text-foreground' : 'font-semibold text-foreground'}`}>{m.name}</p>
            <p className="text-xs text-muted-foreground">{m.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (m) => (
        <span className={`text-sm ${m.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
          {m.subject}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <Badge variant={m.isRead ? 'secondary' : 'default'}>
          {m.isRead ? 'Read' : 'Unread'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (m) => <span className="text-sm text-muted-foreground">{formatDate(m.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (m) => (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => openDetail(m)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleteId(m._id)} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Contact Messages" description="View and manage customer messages" />

      <DataTable
        columns={columns}
        data={messages}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or subject..."
        emptyMessage="No messages found."
        rowKey={(m) => m._id}
      />
      <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteId}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />

      {/* Detail Modal */}
      {detailMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MailOpen className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">{detailMessage.subject}</h2>
                </div>
                <button onClick={() => setDetailMessage(null)} className="text-muted-foreground hover:text-foreground">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{detailMessage.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-foreground">{detailMessage.email}</p>
                </div>
                {detailMessage.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-foreground">{detailMessage.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-foreground">{formatDate(detailMessage.createdAt)}</p>
                </div>
              </div>
              <hr className="border-border" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Message</p>
                <p className="text-foreground whitespace-pre-wrap">{detailMessage.message}</p>
              </div>
            </div>
            <div className="border-t border-border p-5 flex justify-end">
              <Button variant="outline" onClick={() => setDetailMessage(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
