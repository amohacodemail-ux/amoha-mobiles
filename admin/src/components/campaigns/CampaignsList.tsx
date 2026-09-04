'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { campaignService, type Campaign } from '@/services/campaign.service';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export function CampaignsList() {
  const router = useRouter();
  const { canCreate, canEdit, canDelete } = usePermissions();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await campaignService.getCampaigns({ search });
      setCampaigns(result.campaigns || []);
    } catch {
      toast.error('Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await campaignService.deleteCampaign(deleteId);
      toast.success('Campaign archived successfully');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'scheduled': return 'info';
      case 'paused': return 'warning';
      case 'draft': return 'secondary';
      case 'completed': return 'default';
      default: return 'outline';
    }
  };

  const columns: Column<Campaign>[] = [
    {
      key: 'name', header: 'Campaign Name',
      render: (c) => (
        <div>
          <p className="font-semibold">{c.name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description || 'No description'}</p>
        </div>
      )
    },
    {
      key: 'target', header: 'Target',
      render: (c) => (
        <span className="text-sm">
          {c.targetType === 'all' ? 'All Customers' : `Segment: ${c.targetSegment?.toUpperCase()}`}
        </span>
      )
    },
    {
      key: 'dates', header: 'Schedule',
      render: (c) => (
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          <div>From: {formatDate(c.startDate)}</div>
          <div>To: {formatDate(c.endDate)}</div>
        </div>
      )
    },
    {
      key: 'coupon', header: 'Coupon',
      render: (c) => c.coupon ? (
        <Badge variant="outline" className="font-mono">{c.coupon.code}</Badge>
      ) : <span className="text-muted-foreground text-xs">None</span>
    },
    {
      key: 'status', header: 'Status',
      render: (c) => (
        <Badge variant={getStatusColor(c.status) as any} className="capitalize">
          {c.status}
        </Badge>
      )
    },
    {
      key: 'actions', header: 'Actions',
      render: (c) => (
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => router.push(`/campaigns/${c._id || c.id}`)}>
            {canEdit('campaigns') ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          {canDelete('campaigns') && (
            <Button variant="outline" size="icon-sm" className="hover:border-destructive hover:text-destructive" onClick={() => setDeleteId(c._id || c.id || null)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Campaigns" description={`${campaigns.length} total campaigns`}>
        {canCreate('campaigns') && (
          <Button onClick={() => router.push('/campaigns/new')}>
            <Plus className="h-4 w-4" />Create Campaign
          </Button>
        )}
      </PageHeader>

      <DataTable 
        columns={columns} 
        data={campaigns} 
        loading={loading} 
        searchValue={search} 
        onSearchChange={setSearch} 
        searchPlaceholder="Search campaigns..." 
        rowKey={(c) => c._id || c.id || Math.random().toString()} 
        emptyMessage="No campaigns created yet."
      />

      <ConfirmModal 
        open={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={handleDelete} 
        loading={deleting} 
        title="Archive Campaign?" 
        description="This will prevent the campaign from being active, but won't permanently delete it." 
        confirmLabel="Archive" 
      />
    </div>
  );
}
