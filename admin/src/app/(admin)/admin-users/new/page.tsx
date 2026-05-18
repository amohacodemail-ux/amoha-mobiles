'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions, getRoleDisplayName, type UserRole } from '@/hooks/usePermissions';
import apiClient from '@/lib/api-client';

export default function NewAdminUserPage() {
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'sales' as UserRole,
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await apiClient.post('/admin/admin-users', formData);
      setMessage('Employee created successfully!');
      setTimeout(() => {
        router.push('/admin-users');
      }, 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!isAdmin()) return null;

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin-users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Employee</h1>
          <p className="text-muted-foreground">Create a new employee with role-based access</p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded ${message.includes('success') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Employee Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@amoha.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                required
                minLength={10}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1">10 digit phone number</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
                required
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="sales">Sales (Orders, Billing, POS)</option>
                <option value="purchase">Purchase (Products, Inventory, Suppliers)</option>
                <option value="marketing">Marketing (Coupons, Banners, CRM)</option>
                <option value="logistics">Logistics (Order Tracking)</option>
                <option value="supplier">Supplier (Portal Only)</option>
                <option value="service_engineer">Service Engineer (Service Requests)</option>
                <option value="digital_marketing">Digital Marketing (Legacy Marketing)</option>
                <option value="purchase_inventory">Purchase & Inventory (Legacy Purchase)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.role === 'admin' && 'Full access to all modules and user management'}
                {formData.role === 'sales' && 'Access to: Orders, Billing, POS, Returns, Wallets, Reports'}
                {formData.role === 'purchase' && 'Access to: Products, Categories, Brands, Inventory, Suppliers, RFQ, Reports'}
                {formData.role === 'marketing' && 'Access to: Coupons, Banners, Reviews, CRM, User Activity, Reports'}
                {formData.role === 'logistics' && 'Access to: Dashboard, Orders (view only)'}
                {formData.role === 'supplier' && 'Access to: Supplier portal only'}
                {formData.role === 'service_engineer' && 'Access to: Service Requests (view and update)'}
                {formData.role === 'digital_marketing' && 'Access to: Same as Marketing (legacy role)'}
                {formData.role === 'purchase_inventory' && 'Access to: Same as Purchase (legacy role)'}
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/admin-users" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Employee'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Role Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Role Quick Reference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <strong>Administrator</strong>: All modules + user management
            </div>
            <div className="p-2 bg-blue-50 rounded">
              <strong>Sales</strong>: Orders, Billing, POS, Returns
            </div>
            <div className="p-2 bg-green-50 rounded">
              <strong>Purchase</strong>: Products, Inventory, Suppliers
            </div>
            <div className="p-2 bg-purple-50 rounded">
              <strong>Marketing</strong>: Coupons, Banners, Reviews, CRM
            </div>
            <div className="p-2 bg-orange-50 rounded">
              <strong>Logistics</strong>: Order tracking only
            </div>
            <div className="p-2 bg-cyan-50 rounded">
              <strong>Service Engineer</strong>: Service requests
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <strong>Supplier</strong>: Supplier portal
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
