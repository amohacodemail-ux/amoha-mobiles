'use client';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, LogIn, LogOut, Calendar, Users, Filter } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/shared/pagination';
import { attendanceService, type AttendanceRecord } from '@/services/sales.service';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatDate } from '@/lib/utils';

const LIMIT = 31;

function formatTime(isoStr: string | null) {
  if (!isoStr) return '--:--';
  return new Date(isoStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const statusColors: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  absent: 'bg-red-100 text-red-700 border-red-200',
  half_day: 'bg-amber-100 text-amber-700 border-amber-200',
  on_leave: 'bg-blue-100 text-blue-700 border-blue-200',
  holiday: 'bg-purple-100 text-purple-700 border-purple-200',
};

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

function AdminAttendanceView() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [dateFilter, setDateFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll({ page, limit: LIMIT });
      setAttendance(res.attendance || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load attendance');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter]);

  useEffect(() => { load(); }, [load]);

  const presentCount = attendance.filter(r => r.status === 'present').length;
  const absentCount = attendance.filter(r => r.status === 'absent').length;

  return (
    <div>
      <PageHeader title="Team Attendance" description="Monitor salesperson attendance and working hours" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Records', value: total, color: 'text-blue-600' },
          { label: 'Present (Filtered)', value: presentCount, color: 'text-emerald-600' },
          { label: 'Absent (Filtered)', value: absentCount, color: 'text-red-600' },
          { label: 'On Leave/Half Day', value: attendance.filter(r => r.status === 'on_leave' || r.status === 'half_day').length, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input 
          type="date" 
          value={dateFilter} 
          onChange={e => { setDateFilter(e.target.value); setPage(1); }} 
          className="w-48 h-9" 
        />
        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => { setDateFilter(''); setPage(1); }}>Clear</Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Attendance Register
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading attendance...</div>
          ) : attendance.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No attendance records found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {attendance.map(record => {
                const badgeColor = statusColors[record.status] || 'bg-gray-100 text-gray-700';
                const salesperson = record.user;

                return (
                  <div key={record._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${badgeColor}`}>
                        {record.status === 'present' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div>
                        {salesperson && (
                          <p className="text-sm font-semibold text-primary mb-0.5">
                            {salesperson.name || salesperson.email}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm">{formatDate(record.attendanceDate)}</p>
                          <Badge variant="outline" className={`text-[10px] capitalize bg-transparent ${badgeColor}`}>
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {record.checkinLatitude != null && record.checkinLongitude != null && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center">
                            <span className="font-medium mr-1">Loc:</span> {Number(record.checkinLatitude).toFixed(4)}, {Number(record.checkinLongitude).toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center text-sm bg-muted/50 p-2 rounded-lg shrink-0">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check In</p>
                        <p className="font-medium text-emerald-600 flex items-center justify-center gap-1">
                          <LogIn className="h-3 w-3" /> {formatTime(record.checkIn)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                        <p className="font-medium text-red-600 flex items-center justify-center gap-1">
                          <LogOut className="h-3 w-3" /> {formatTime(record.checkOut)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="font-medium text-foreground">
                          {record.workingHours}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={LIMIT} />
      </div>
    </div>
  );
}

// ─── SALES VIEW ──────────────────────────────────────────────────────────────

function SalesAttendanceView() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { canCreate } = useModulePermissions(MODULES.ATTENDANCE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAll({ page, limit: LIMIT });
      const records = res.attendance || [];
      setAttendance(records);
      setTotal(res.total);
      setTotalPages(res.totalPages);

      // Find today's record
      const todayStr = new Date().toISOString().split('T')[0];
      const today = records.find(r => r.attendanceDate === todayStr) || null;
      setTodayRecord(today);
    } catch {
      toast.error('Failed to load attendance');
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await attendanceService.checkIn();
      toast.success('✅ Checked in successfully!');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await attendanceService.checkOut();
      toast.success('🏠 Checked out successfully!');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to check out');
    } finally {
      setActionLoading(false);
    }
  };

  const presentDays = attendance.filter(r => r.status === 'present').length;
  const absentDays = attendance.filter(r => r.status === 'absent').length;
  const halfDays = attendance.filter(r => r.status === 'half_day').length;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div>
      <PageHeader title="My Attendance" description="Mark your daily attendance and track working hours" />

      {/* Action Card for Today */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Today</p>
              <h2 className="text-xl font-bold text-foreground">{formatDate(todayStr)}</h2>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {todayRecord ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex gap-4 items-center">
                  <div className="text-center px-4">
                    <p className="text-xs text-muted-foreground mb-1">Check In</p>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1">
                      <LogIn className="h-3 w-3 mr-1" /> {formatTime(todayRecord.checkIn)}
                    </Badge>
                  </div>
                  {todayRecord.checkOut ? (
                    <div className="text-center px-4">
                      <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-bold px-3 py-1">
                        <LogOut className="h-3 w-3 mr-1" /> {formatTime(todayRecord.checkOut)}
                      </Badge>
                    </div>
                  ) : (
                    <Button 
                      variant="destructive" 
                      onClick={handleCheckOut} 
                      loading={actionLoading}
                      disabled={!canCreate}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Check Out
                    </Button>
                  )}
                </div>
                {todayRecord.checkIn && (
                  <div className="text-center px-4">
                    <p className="text-xs text-muted-foreground mb-1">Working Hrs</p>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold px-3 py-1">
                      <Clock className="h-3 w-3 mr-1" /> {todayRecord.workingHours}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700" 
                onClick={handleCheckIn} 
                loading={actionLoading}
                disabled={!canCreate}
              >
                <LogIn className="h-4 w-4 mr-2" /> Check In
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Records', value: total, color: 'text-blue-600' },
          { label: 'Present Days', value: presentDays, color: 'text-emerald-600' },
          { label: 'Absent Days', value: absentDays, color: 'text-red-600' },
          { label: 'Half Days', value: halfDays, color: 'text-amber-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attendance History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center animate-pulse text-muted-foreground">Loading history...</div>
          ) : attendance.length === 0 ? (
            <div className="py-16 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-sm font-medium">No history found</p>
              <p className="text-xs text-muted-foreground mt-1">Check in today to start tracking.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {attendance.map(record => {
                const badgeColor = statusColors[record.status] || 'bg-gray-100 text-gray-700';
                return (
                  <div key={record._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${badgeColor}`}>
                        {record.status === 'present' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm">{formatDate(record.attendanceDate)}</p>
                          <Badge variant="outline" className={`text-[10px] capitalize bg-transparent ${badgeColor}`}>
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center text-sm bg-muted/50 p-2 rounded-lg shrink-0 w-full sm:w-auto">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check In</p>
                        <p className="font-medium text-emerald-600 flex items-center justify-center gap-1">
                          <LogIn className="h-3 w-3" /> {formatTime(record.checkIn)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Check Out</p>
                        <p className="font-medium text-red-600 flex items-center justify-center gap-1">
                          <LogOut className="h-3 w-3" /> {formatTime(record.checkOut)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Working Hrs</p>
                        <p className="font-medium text-foreground">
                          {record.workingHours}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={LIMIT} />
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function AttendancePage() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminAttendanceView /> : <SalesAttendanceView />;
}
