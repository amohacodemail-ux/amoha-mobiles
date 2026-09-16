'use client';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Target, TrendingUp, Award, AlertTriangle, Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { targetsService, type SalesTarget } from '@/services/sales.service';
import { userService } from '@/services/user.service';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatCurrency, cn } from '@/lib/utils';
import type { User } from '@/types';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function AchievementBar({ achieved, target }: { achieved: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const color = pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Achievement</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

function AdminTargetsView() {
  const [salesUsers, setSalesUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentTarget, setCurrentTarget] = useState<SalesTarget | null>(null);
  const [yearlyTargets, setYearlyTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    targetAmount: '',
    targetCount: '',
    notes: '',
  });

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Load Sales Users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await userService.getAll({ limit: 100 });
        // filter clientside if API doesn't support role=sales
        const users = res.users.filter(u => u.role === 'sales' || u.role === 'admin');
        setSalesUsers(users);
        if (users.length > 0) {
          setSelectedUserId(users[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load sales team');
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Load Targets for selected user
  const loadUserTargets = async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      // Pass userId implicitly through a hack or just rely on backend?
      // Wait, targetsService.get() doesn't accept userId param. Let me update the backend or we can just fetch it directly with apiClient here if needed.
      // But the API client `apiClient.get('/sales/targets?userId=' + userId)`
      const apiClient = (await import('@/lib/api-client')).default;
      const { data } = await apiClient.get(`/sales/targets?month=${currentMonth}&year=${currentYear}&userId=${userId}`);
      setCurrentTarget(data.data.currentTarget);
      setYearlyTargets(data.data.yearlyTargets || []);
    } catch {
      toast.error('Failed to load targets for selected user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadUserTargets(selectedUserId);
    }
  }, [selectedUserId, currentMonth, currentYear]);

  const openSetTarget = () => {
    setForm({
      targetAmount: currentTarget?.targetAmount ? String(currentTarget.targetAmount) : '',
      targetCount: currentTarget?.targetCount ? String(currentTarget.targetCount) : '',
      notes: currentTarget?.notes || '',
    });
    setModalOpen(true);
  };

  const handleSetTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    setSubmitting(true);
    try {
      await targetsService.create({
        userId: selectedUserId,
        month: currentMonth,
        year: currentYear,
        targetAmount: parseFloat(form.targetAmount) || 0,
        targetCount: parseInt(form.targetCount) || 0,
        notes: form.notes,
      });
      toast.success('Target set successfully');
      setModalOpen(false);
      loadUserTargets(selectedUserId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to set target');
    } finally {
      setSubmitting(false);
    }
  };

  const achievedPct = currentTarget && currentTarget.targetAmount > 0
    ? Math.min(100, Math.round((currentTarget.achievedAmount / currentTarget.targetAmount) * 100))
    : 0;

  const ytdTarget = yearlyTargets.reduce((s, t) => s + t.targetAmount, 0);
  const ytdAchieved = yearlyTargets.reduce((s, t) => s + t.achievedAmount, 0);

  return (
    <div>
      <PageHeader
        title="Team Targets"
        description="Assign and monitor sales targets for your team"
      />

      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-4 flex-1 w-full">
            <Users className="h-5 w-5 text-primary shrink-0" />
            <div className="w-full max-w-xs">
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={usersLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salesUsers.map(u => (
                    <SelectItem key={u._id} value={u._id}>{u.name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedUserId && (
            <Button onClick={openSetTarget} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" /> {currentTarget ? 'Update Target' : 'Set Target'}
            </Button>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />)}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-secondary" />
        </div>
      ) : !selectedUserId ? (
        <div className="py-16 text-center text-muted-foreground border rounded-xl bg-card">
          Select a salesperson to view and manage their targets.
        </div>
      ) : (
        <>
          {/* Current Month Target */}
          {currentTarget ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: 'Target Amount',
                    value: formatCurrency(currentTarget.targetAmount),
                    icon: Target,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-500/10',
                  },
                  {
                    label: 'Achieved',
                    value: formatCurrency(currentTarget.achievedAmount),
                    icon: TrendingUp,
                    color: 'text-emerald-600',
                    bgColor: 'bg-emerald-500/10',
                  },
                  {
                    label: 'Remaining',
                    value: formatCurrency(Math.max(0, currentTarget.targetAmount - currentTarget.achievedAmount)),
                    icon: AlertTriangle,
                    color: 'text-amber-600',
                    bgColor: 'bg-amber-500/10',
                  },
                  {
                    label: 'Achievement %',
                    value: `${achievedPct}%`,
                    icon: Award,
                    color: achievedPct >= 100 ? 'text-emerald-600' : 'text-primary',
                    bgColor: achievedPct >= 100 ? 'bg-emerald-500/10' : 'bg-primary/10',
                  },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={i}>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Progress Detail */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex justify-between items-center">
                    <span>{MONTH_NAMES[currentMonth - 1]} {currentYear} Progress</span>
                    <Badge variant={achievedPct >= 100 ? 'default' : 'secondary'} className={achievedPct >= 100 ? 'bg-emerald-500' : ''}>
                      {achievedPct >= 100 ? 'Target Achieved! 🎉' : 'In Progress'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium mb-4">Revenue Target</h4>
                      <AchievementBar achieved={currentTarget.achievedAmount} target={currentTarget.targetAmount} />
                    </div>

                    {currentTarget.targetCount > 0 && (
                      <div className="pt-6 border-t border-border">
                        <h4 className="text-sm font-medium mb-4">Volume/Count Target</h4>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{currentTarget.achievedCount} / {currentTarget.targetCount} Sales</span>
                          <span className="font-semibold">{Math.round((currentTarget.achievedCount / currentTarget.targetCount) * 100)}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(100, (currentTarget.achievedCount / currentTarget.targetCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {currentTarget.notes && (
                      <div className="pt-6 border-t border-border">
                        <h4 className="text-sm font-medium mb-2">Admin Notes</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{currentTarget.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="py-16 text-center border rounded-xl bg-card mb-6">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium">No Target Assigned</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                This salesperson doesn't have a target for {MONTH_NAMES[currentMonth - 1]} {currentYear}.
              </p>
              <Button onClick={openSetTarget}>Assign Target Now</Button>
            </div>
          )}

          {/* YTD Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Year-to-Date (YTD) Performance — {currentYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm text-muted-foreground">YTD Achievement</p>
                    <p className="text-2xl font-bold">{formatCurrency(ytdAchieved)} <span className="text-sm font-normal text-muted-foreground">/ {formatCurrency(ytdTarget)}</span></p>
                  </div>
                  <Badge variant="outline" className="text-lg py-1 px-3 bg-secondary">
                    {ytdTarget > 0 ? Math.round((ytdAchieved / ytdTarget) * 100) : 0}%
                  </Badge>
                </div>
                <AchievementBar achieved={ytdAchieved} target={ytdTarget} />
              </div>

              {yearlyTargets.length > 0 ? (
                <div className="relative w-full overflow-x-auto pb-4">
                  <div className="min-w-[600px] flex items-end gap-2 h-48 mt-8">
                    {MONTH_NAMES.map((month, i) => {
                      const data = yearlyTargets.find(t => t.month === i + 1);
                      if (!data) return <div key={month} className="flex-1 flex flex-col justify-end items-center opacity-30"><div className="w-full text-center text-xs pb-2 border-b">{month.substring(0, 3)}</div></div>;
                      
                      const p = data.targetAmount > 0 ? Math.min(100, (data.achievedAmount / data.targetAmount) * 100) : 0;
                      return (
                        <div key={month} className="flex-1 flex flex-col justify-end items-center group relative">
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap transition-opacity z-10">
                            <p className="font-semibold">{month}</p>
                            <p>T: {formatCurrency(data.targetAmount)}</p>
                            <p>A: {formatCurrency(data.achievedAmount)}</p>
                          </div>
                          <div className="w-full px-1 flex flex-col justify-end h-full">
                            <div className="w-full bg-secondary/50 rounded-t-sm relative h-full flex items-end">
                              <div className={cn("w-full rounded-t-sm transition-all", p >= 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-blue-500' : 'bg-primary')} style={{ height: `${p}%`, minHeight: p > 0 ? '4px' : '0' }} />
                            </div>
                          </div>
                          <div className="w-full text-center text-xs py-2 border-t mt-1 font-medium">{month.substring(0, 3)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No historical data available for this year.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Set Target Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Target for {MONTH_NAMES[currentMonth - 1]}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSetTarget} className="space-y-4">
            <Input
              label="Target Amount (₹) *"
              type="number"
              min="0"
              value={form.targetAmount}
              onChange={e => setForm(p => ({ ...p, targetAmount: e.target.value }))}
              placeholder="e.g. 500000"
              required
            />
            <Input
              label="Target Count/Volume (Optional)"
              type="number"
              min="0"
              value={form.targetCount}
              onChange={e => setForm(p => ({ ...p, targetCount: e.target.value }))}
              placeholder="e.g. 50"
            />
            <Textarea
              label="Manager Notes"
              placeholder="Special instructions or focus products..."
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save Target</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SALES VIEW ──────────────────────────────────────────────────────────────

function SalesTargetsView() {
  const [currentTarget, setCurrentTarget] = useState<SalesTarget | null>(null);
  const [yearlyTargets, setYearlyTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await targetsService.get(currentMonth, currentYear);
        setCurrentTarget(res.currentTarget);
        setYearlyTargets(res.yearlyTargets || []);
      } catch {
        toast.error('Failed to load targets');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentMonth, currentYear]);

  const achievedPct = currentTarget && currentTarget.targetAmount > 0
    ? Math.min(100, Math.round((currentTarget.achievedAmount / currentTarget.targetAmount) * 100))
    : 0;

  const ytdTarget = yearlyTargets.reduce((s, t) => s + t.targetAmount, 0);
  const ytdAchieved = yearlyTargets.reduce((s, t) => s + t.achievedAmount, 0);

  if (loading) {
    return (
      <div>
        <PageHeader title="Targets" description="View your assigned targets and achievement" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-secondary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Targets"
        description={`${MONTH_NAMES[currentMonth - 1]} ${currentYear} — View your sales targets`}
      />

      {/* Current Month Target */}
      {currentTarget ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: 'Target Amount',
                value: formatCurrency(currentTarget.targetAmount),
                icon: Target,
                color: 'text-blue-600',
                bgColor: 'bg-blue-500/10',
              },
              {
                label: 'Achieved',
                value: formatCurrency(currentTarget.achievedAmount),
                icon: TrendingUp,
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-500/10',
              },
              {
                label: 'Remaining',
                value: formatCurrency(Math.max(0, currentTarget.targetAmount - currentTarget.achievedAmount)),
                icon: AlertTriangle,
                color: 'text-amber-600',
                bgColor: 'bg-amber-500/10',
              },
              {
                label: 'Achievement %',
                value: `${achievedPct}%`,
                icon: Award,
                color: achievedPct >= 100 ? 'text-emerald-600' : 'text-primary',
                bgColor: achievedPct >= 100 ? 'bg-emerald-500/10' : 'bg-primary/10',
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Progress Detail */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex justify-between items-center">
                <span>{MONTH_NAMES[currentMonth - 1]} Progress</span>
                <Badge variant={achievedPct >= 100 ? 'default' : 'secondary'} className={achievedPct >= 100 ? 'bg-emerald-500' : ''}>
                  {achievedPct >= 100 ? 'Target Achieved! 🎉' : 'In Progress'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Revenue Target</h4>
                  <AchievementBar achieved={currentTarget.achievedAmount} target={currentTarget.targetAmount} />
                </div>

                {currentTarget.targetCount > 0 && (
                  <div className="pt-6 border-t border-border">
                    <h4 className="text-sm font-medium mb-4">Volume/Count Target</h4>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{currentTarget.achievedCount} / {currentTarget.targetCount} Sales</span>
                      <span className="font-semibold">{Math.round((currentTarget.achievedCount / currentTarget.targetCount) * 100)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (currentTarget.achievedCount / currentTarget.targetCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {currentTarget.notes && (
                  <div className="pt-6 border-t border-border">
                    <h4 className="text-sm font-medium mb-2">Manager Notes</h4>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{currentTarget.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="py-16 text-center border rounded-xl bg-card mb-6">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium">No Target Assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            You don't have a specific target assigned for {MONTH_NAMES[currentMonth - 1]} {currentYear}.
          </p>
        </div>
      )}

      {/* YTD Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Year-to-Date (YTD) Performance — {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm text-muted-foreground">YTD Achievement</p>
                <p className="text-2xl font-bold">{formatCurrency(ytdAchieved)} <span className="text-sm font-normal text-muted-foreground">/ {formatCurrency(ytdTarget)}</span></p>
              </div>
              <Badge variant="outline" className="text-lg py-1 px-3 bg-secondary">
                {ytdTarget > 0 ? Math.round((ytdAchieved / ytdTarget) * 100) : 0}%
              </Badge>
            </div>
            <AchievementBar achieved={ytdAchieved} target={ytdTarget} />
          </div>

          {yearlyTargets.length > 0 ? (
            <div className="relative w-full overflow-x-auto pb-4">
              <div className="min-w-[600px] flex items-end gap-2 h-48 mt-8">
                {MONTH_NAMES.map((month, i) => {
                  const data = yearlyTargets.find(t => t.month === i + 1);
                  if (!data) return <div key={month} className="flex-1 flex flex-col justify-end items-center opacity-30"><div className="w-full text-center text-xs pb-2 border-b">{month.substring(0, 3)}</div></div>;
                  
                  const p = data.targetAmount > 0 ? Math.min(100, (data.achievedAmount / data.targetAmount) * 100) : 0;
                  return (
                    <div key={month} className="flex-1 flex flex-col justify-end items-center group relative">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg whitespace-nowrap transition-opacity z-10">
                        <p className="font-semibold">{month}</p>
                        <p>T: {formatCurrency(data.targetAmount)}</p>
                        <p>A: {formatCurrency(data.achievedAmount)}</p>
                      </div>
                      <div className="w-full px-1 flex flex-col justify-end h-full">
                        <div className="w-full bg-secondary/50 rounded-t-sm relative h-full flex items-end">
                          <div className={cn("w-full rounded-t-sm transition-all", p >= 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-blue-500' : 'bg-primary')} style={{ height: `${p}%`, minHeight: p > 0 ? '4px' : '0' }} />
                        </div>
                      </div>
                      <div className="w-full text-center text-xs py-2 border-t mt-1 font-medium">{month.substring(0, 3)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">No historical data available for this year.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function TargetsPage() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminTargetsView /> : <SalesTargetsView />;
}
