'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CouponsList } from '@/components/coupons/CouponsList';
import { CampaignsList } from '@/components/campaigns/CampaignsList';
import { cn } from '@/lib/utils';

export default function CouponsMainPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') === 'campaigns' ? 'campaigns' : 'coupons';
  const [activeTab, setActiveTab] = useState<'coupons' | 'campaigns'>(defaultTab);

  // Sync state if URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'campaigns' || tab === 'coupons') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'coupons' | 'campaigns') => {
    setActiveTab(tab);
    router.replace(`/coupons${tab === 'campaigns' ? '?tab=campaigns' : ''}`);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <div className="flex space-x-8">
          <button
            onClick={() => handleTabChange('coupons')}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeTab === 'coupons' 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Coupons
          </button>
          <button
            onClick={() => handleTabChange('campaigns')}
            className={cn(
              "pb-3 text-sm font-medium transition-colors relative",
              activeTab === 'campaigns' 
                ? "text-primary border-b-2 border-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Campaigns
          </button>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'coupons' ? <CouponsList /> : <CampaignsList />}
      </div>
    </div>
  );
}
