'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/shared/page-header';
import { CampaignForm } from '@/components/campaigns/CampaignForm';
import { campaignService } from '@/services/campaign.service';

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (payload.couponId === 'none' || payload.couponId === '') {
        delete payload.couponId;
      }
      if (payload.categoryId === '') {
        delete payload.categoryId;
      }
      await campaignService.createCampaign(payload);
      toast.success('Campaign created successfully');
      router.push('/coupons?tab=campaigns');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Create Campaign" description="Configure a new promotional campaign." />
      <div className="mt-6">
        <CampaignForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
