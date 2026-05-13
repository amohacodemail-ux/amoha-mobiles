'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, UserCog, Shield, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions, getRoleBadgeColor, getRoleDisplayName, type UserRole } from '@/hooks/usePermissions';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import apiClient from '@/lib/api-client';
import Cookies from 'js-cookie';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  is_blocked: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [message, setMessage] = useState('');

  // Delete state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
      setMessage('Only administrators can access this page');
    }
  }, [isAdmin, router]);

  // Fetch admin users
  useEffect(() => {
    if (!isAdmin()) return;
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const response = await apiClient.get(`/admin/admin-users?${params.toString()}`);
      setUsers(response.data.data.users || []);
    } catch (error) {
      setMessage('Failed to fetch admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      setMessage(`User role updated to ${getRoleDisplayName(newRole)}`);
      fetchUsers();
    } catch (error) {
      setMessage('Failed to update user role');
    }
  };

  const openDelete = (user: AdminUser) => {
    setDeleteUserId(user.id);
    setDeleteUserName(user.name);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    try {
      console.log('Deleting user:', deleteUserId);
      console.log('Token exists:', !!Cookies.get('admin_token'));
      await apiClient.delete(`/admin/users/${deleteUserId}`);
      setMessage('User deleted successfully');
      setDeleteUserId(null);
      setUsers((prev) => prev.filter((u) => u.id !== deleteUserId));
    } catch (error: any) {
      console.error('Delete error:', error);
      console.error('Error response:', error?.response?.data);
      setMessage(error?.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin()) return null;

  return (
    <div className="space-y-6 p-6">
      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground">Manage employees and their roles</p>
        </div>
        <Link href="/admin-users/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Employees with Admin Panel Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="sales">Sales</option>
              <option value="purchase">Purchase</option>
              <option value="marketing">Marketing</option>
              <option value="logistics">Logistics</option>
              <option value="supplier">Supplier</option>
            </select>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No admin users found
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCog className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      {user.is_blocked ? (
                        <Badge variant="destructive" className="ml-2">Blocked</Badge>
                      ) : (
                        <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      <option value="admin">Administrator</option>
                      <option value="sales">Sales</option>
                      <option value="purchase">Purchase</option>
                      <option value="marketing">Marketing</option>
                      <option value="logistics">Logistics</option>
                      <option value="supplier">Supplier</option>
                    </select>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:border-destructive hover:text-destructive"
                      onClick={() => openDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2">Administrator</Badge>
              <p className="text-sm text-muted-foreground">Full access to all modules and user management</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-blue-100 text-blue-800">Sales</Badge>
              <p className="text-sm text-muted-foreground">Orders, Billing, POS, Returns, Wallets</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-green-100 text-green-800">Purchase</Badge>
              <p className="text-sm text-muted-foreground">Products, Inventory, Suppliers, RFQ</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-purple-100 text-purple-800">Marketing</Badge>
              <p className="text-sm text-muted-foreground">Coupons, Banners, Reviews, CRM</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-orange-100 text-orange-800">Logistics</Badge>
              <p className="text-sm text-muted-foreground">Order tracking and shipping only</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-gray-100 text-gray-800">Supplier</Badge>
              <p className="text-sm text-muted-foreground">Supplier portal access only</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        open={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee?"
        description={`Are you sure you want to delete "${deleteUserName}"? This action cannot be undone and will permanently remove the user.`}
        confirmLabel="Delete Employee"
      />
    </div>
  );
}
