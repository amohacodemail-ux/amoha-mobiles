'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/page-header';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { campaignService, type Campaign } from '@/services/campaign.service';
import { usePermissions } from '@/hooks/usePermissions';

export default function EditCampaignPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { canEdit } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    campaignService.getCampaignById(params.id)
      .then(setCampaign)
      .catch(() => toast.error('Failed to load campaign'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (data: any) => {
    if (!canEdit('campaigns')) {
      toast.error('You do not have permission to edit campaigns');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...data };
      if (payload.couponId === 'none' || payload.couponId === '') {
        delete payload.couponId;
      }
      if (payload.categoryId === '') {
        delete payload.categoryId;
      }
      await campaignService.updateCampaign(params.id, payload);
      toast.success('Campaign updated successfully');
      router.push('/coupons?tab=campaigns');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update campaign');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!campaign) return <div>Campaign not found</div>;

  return (
    <div>
      <PageHeader title="Edit Campaign" description="Modify existing campaign settings." />
      <div className="mt-6">
        <CampaignForm initialData={campaign} onSubmit={handleSubmit} loading={submitting} />
      </div>
    </div>
  );
}
