'use client';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { settingsService } from '@/services/settings.service';

const policyFields = [
  { key: 'termsAndConditions', label: 'Terms & Conditions', placeholder: 'Enter your terms and conditions...' },
  { key: 'privacyPolicy', label: 'Privacy Policy', placeholder: 'Enter your privacy policy...' },
  { key: 'returnPolicy', label: 'Return Policy', placeholder: 'Enter your return/exchange policy...' },
  { key: 'shippingPolicy', label: 'Shipping Policy', placeholder: 'Enter your shipping policy...' },
  { key: 'refundPolicy', label: 'Refund Policy', placeholder: 'Enter your refund policy...' },
] as const;

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Record<string, string>>({
    termsAndConditions: '',
    privacyPolicy: '',
    returnPolicy: '',
    shippingPolicy: '',
    refundPolicy: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    settingsService.get().then((settings) => {
      if (settings.policies) {
        setPolicies({
          termsAndConditions: settings.policies.termsAndConditions || '',
          privacyPolicy: settings.policies.privacyPolicy || '',
          returnPolicy: settings.policies.returnPolicy || '',
          shippingPolicy: settings.policies.shippingPolicy || '',
          refundPolicy: settings.policies.refundPolicy || '',
        });
      }
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load policies');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.update({ policies } as any);
      toast.success('Policies updated successfully');
    } catch {
      toast.error('Failed to save policies');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Policies" description="Manage store terms and policy pages" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Policies" description="Manage store terms, conditions and policy pages">
        <Button onClick={handleSave} loading={saving}><Save className="h-4 w-4" />Save All Policies</Button>
      </PageHeader>

      <div className="space-y-6">
        {policyFields.map((field) => (
          <Card key={field.key}>
            <CardHeader>
              <CardTitle>{field.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={policies[field.key]}
                onChange={(e) => setPolicies((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {policies[field.key].length} characters
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
