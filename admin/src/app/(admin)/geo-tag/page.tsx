'use client';
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  MapPin, Navigation, Loader2, RefreshCw, Shield, ShieldAlert,
  Plus, Pencil, History, Crosshair, Users, Filter, CircleAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/pagination';
import { useModulePermissions, useIsAdmin, MODULES } from '@/hooks/usePermissions';
import { formatDate, formatDateTime } from '@/lib/utils';
import { geoTagService, geoFenceService, type GeoFence, type GeoTag, type GeoFenceValidation } from '@/services/sales.service';

const VISIT_TYPES = ['productive', 'non_productive', 'office', 'travel', 'other'];

const HISTORY_LIMIT = 10;

function formatDistance(m: number | null | undefined): string {
  if (m === null || m === undefined || isNaN(m)) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function FenceStatusBadge({ inside }: { inside: boolean | null }) {
  if (inside === null) return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Not checked</Badge>;
  if (inside) return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Inside Geo-Fence</Badge>;
  return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Outside Geo-Fence</Badge>;
}

function CoordinatesBlock({ lat, lng, accuracy }: { lat: number; lng: number; accuracy: number | null }) {
  return (
    <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-background p-3 rounded-lg border">
      <div>
        <span className="text-muted-foreground block mb-1">LATITUDE</span>
        {lat.toFixed(6)}
      </div>
      <div>
        <span className="text-muted-foreground block mb-1">LONGITUDE</span>
        {lng.toFixed(6)}
      </div>
      <div className="col-span-2">
        <span className="text-muted-foreground block mb-1">ACCURACY</span>
        {accuracy !== null ? `${accuracy.toFixed(1)} m` : 'Not available'}
      </div>
    </div>
  );
}

function GeoTagHistoryTable({ tags, showUser, loading }: { tags: GeoTag[]; showUser?: boolean; loading: boolean }) {
  if (loading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading location history...</div>;
  }
  if (tags.length === 0) {
    return (
      <div className="py-12 text-center">
        <MapPin className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">No location history found</p>
        <p className="text-xs text-muted-foreground mt-1">Capture and save your location to start tracking.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            {showUser && <th className="p-3 font-medium">Salesperson</th>}
            <th className="p-3 font-medium">Date / Time</th>
            <th className="p-3 font-medium">Coordinates</th>
            <th className="p-3 font-medium">Accuracy</th>
            <th className="p-3 font-medium">Address</th>
            <th className="p-3 font-medium">Geo-Fence</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Distance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tags.map(tag => (
            <tr key={tag._id} className="hover:bg-secondary/30 transition-colors">
              {showUser && (
                <td className="p-3 font-medium text-primary">
                  {tag.userName || tag.user?.name || tag.user?.email || '—'}
                </td>
              )}
              <td className="p-3 whitespace-nowrap">{formatDateTime(tag.createdAt)}</td>
              <td className="p-3 font-mono text-xs whitespace-nowrap">
                {Number(tag.latitude).toFixed(5)}, {Number(tag.longitude).toFixed(5)}
              </td>
              <td className="p-3">{tag.accuracyMeters !== null && tag.accuracyMeters !== undefined ? `${tag.accuracyMeters} m` : '—'}</td>
              <td className="p-3 max-w-[220px]">
                <span className="block truncate" title={tag.address}>{tag.address || '—'}</span>
              </td>
              <td className="p-3">{tag.fenceName || '—'}</td>
              <td className="p-3"><FenceStatusBadge inside={tag.inFence} /></td>
              <td className="p-3 whitespace-nowrap">{formatDistance(tag.distanceMeters)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ADMIN VIEW ──────────────────────────────────────────────────────────────

interface FenceForm {
  name: string;
  centerLat: string;
  centerLng: string;
  radiusMeters: string;
  assignedUserId: string;
  isActive: boolean;
}

function AdminGeoTagView() {
  const [fences, setFences] = useState<GeoFence[]>([]);
  const [salesUsers, setSalesUsers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [salesUsersError, setSalesUsersError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fence modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editFence, setEditFence] = useState<GeoFence | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FenceForm>({
    name: '',
    centerLat: '',
    centerLng: '',
    radiusMeters: '500',
    assignedUserId: '',
    isActive: true,
  });

  // History
  const [tags, setTags] = useState<GeoTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [userFilter, setUserFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadFences = useCallback(async () => {
    setLoading(true);
    try {
      const fenceList = await geoFenceService.list();
      setFences(fenceList);
    } catch {
      toast.error('Failed to load geo-fences');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSalesUsers = useCallback(async () => {
    setSalesUsers([]);
    setSalesUsersError('');
    try {
      const res = await geoFenceService.getSalesUsers();
      setSalesUsers(res.users || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not load salespersons. Please refresh the page.';
      setSalesUsersError(msg);
    }
  }, []);

  const loadTags = useCallback(async () => {
    setTagsLoading(true);
    try {
      const res = await geoTagService.getAll({
        page,
        limit: HISTORY_LIMIT,
        userId: userFilter || undefined,
        date: dateFilter || undefined,
      });
      setTags(res.tags || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load location history');
      setTags([]);
    } finally {
      setTagsLoading(false);
    }
  }, [page, userFilter, dateFilter]);

  useEffect(() => {
    loadFences();
    loadSalesUsers();
  }, [loadFences, loadSalesUsers]);
  useEffect(() => { loadTags(); }, [loadTags]);

  const openAdd = () => {
    setEditFence(null);
    setForm({ name: '', centerLat: '', centerLng: '', radiusMeters: '500', assignedUserId: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (fence: GeoFence) => {
    setEditFence(fence);
    setForm({
      name: fence.name,
      centerLat: String(fence.centerLat),
      centerLng: String(fence.centerLng),
      radiusMeters: String(fence.radiusMeters),
      assignedUserId: fence.assignedUserId || '',
      isActive: fence.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Zone name is required');
      return;
    }
    const lat = parseFloat(form.centerLat);
    const lng = parseFloat(form.centerLng);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('Enter a valid latitude (-90 to 90)');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('Enter a valid longitude (-180 to 180)');
      return;
    }
    const radius = parseInt(form.radiusMeters, 10);
    if (isNaN(radius) || radius < 10) {
      toast.error('Radius must be at least 10 meters');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        centerLat: lat,
        centerLng: lng,
        radiusMeters: radius,
        isActive: form.isActive,
        assignedUserId: form.assignedUserId || null,
      };
      if (editFence) {
        await geoFenceService.update(editFence._id, payload);
        toast.success('Geo-fence updated');
      } else {
        await geoFenceService.create(payload);
        toast.success('Geo-fence created');
      }
      setModalOpen(false);
      loadFences();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save geo-fence');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fence: GeoFence) => {
    if (!window.confirm(`Delete geo-fence "${fence.name}"? Existing location history will be kept.`)) return;
    try {
      await geoFenceService.remove(fence._id);
      toast.success('Geo-fence deleted');
      loadFences();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete geo-fence');
    }
  };

  const applyFilters = (nextUser: string, nextDate: string) => {
    setUserFilter(nextUser);
    setDateFilter(nextDate);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Geo-Tag / Geo-Fence" description="Define territories and monitor salesperson field locations">
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" /> Add Geo-Fence
        </Button>
      </PageHeader>

      {/* Geo-Fences */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse bg-secondary rounded-xl" />)
        ) : fences.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-card border rounded-xl">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-medium text-lg">No geo-fences configured</p>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Add your first geo-fence to track salesperson locations.</p>
            <Button onClick={openAdd} variant="outline">Create Geo-Fence</Button>
          </div>
        ) : (
          fences.map(fence => (
            <Card key={fence._id} className={!fence.isActive ? 'opacity-70' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className={`h-5 w-5 ${fence.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h3 className="font-semibold text-base">{fence.name}</h3>
                  </div>
                  <Badge variant={fence.isActive ? 'default' : 'secondary'} className={fence.isActive ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                    {fence.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Centre:</span>
                    <span className="font-mono text-foreground">{fence.centerLat.toFixed(4)}, {fence.centerLng.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Radius:</span>
                    <span className="text-foreground">{fence.radiusMeters} meters</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Assigned To:</span>
                    <span className="text-foreground truncate max-w-[60%]" title={fence.assignedUser?.name || undefined}>
                      {fence.assignedUser?.name || 'All salespersons'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(fence)}>
                    <Pencil className="h-3 w-3 mr-2" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={() => handleDelete(fence)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Location History */}
      <div className="mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Salesperson Location History
        </h2>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="w-56">
            <Select value={userFilter || 'all'} onValueChange={(v) => applyFilters(v === 'all' ? '' : v, dateFilter)}>
              <SelectTrigger label="Salesperson"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Salespersons</SelectItem>
                {salesUsers.map(u => (
                  <SelectItem key={u._id} value={u._id}>{u.name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="date"
            value={dateFilter}
            onChange={e => applyFilters(userFilter, e.target.value)}
            className="w-48"
          />
          {(userFilter || dateFilter) && (
            <Button variant="ghost" size="sm" onClick={() => applyFilters('', '')}>Clear</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Geo-Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <GeoTagHistoryTable tags={tags} showUser loading={tagsLoading} />
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={HISTORY_LIMIT} />
      </div>

      {/* Fence Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editFence ? 'Edit Geo-Fence' : 'Add Geo-Fence'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Zone / Territory Name *"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Headquarters, North Branch..."
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude *"
                type="number"
                step="0.000001"
                value={form.centerLat}
                onChange={e => setForm(p => ({ ...p, centerLat: e.target.value }))}
                placeholder="e.g. 13.0827"
                required
              />
              <Input
                label="Longitude *"
                type="number"
                step="0.000001"
                value={form.centerLng}
                onChange={e => setForm(p => ({ ...p, centerLng: e.target.value }))}
                placeholder="e.g. 80.2707"
                required
              />
            </div>
            <Input
              label="Radius (Meters) *"
              type="number"
              min="10"
              value={form.radiusMeters}
              onChange={e => setForm(p => ({ ...p, radiusMeters: e.target.value }))}
              required
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Assign To Salesperson</label>
              <Select value={form.assignedUserId || 'none'} onValueChange={(v) => setForm(p => ({ ...p, assignedUserId: v === 'none' ? '' : v }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Unassigned (applies to all)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned (applies to all)</SelectItem>
                  {salesUsers.map(u => (
                    <SelectItem key={u._id} value={u._id}>{u.name} ({u.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {salesUsersError && (
                <p className="text-xs text-red-500 mt-1.5" role="alert">{salesUsersError}</p>
              )}
              {!salesUsersError && salesUsers.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">No active sales users found.</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is-active"
                checked={form.isActive}
                onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is-active" className="text-sm font-medium cursor-pointer">Active Zone</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={submitting}>Save Geo-Fence</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── SALES VIEW ──────────────────────────────────────────────────────────────

function reverseGeocode(lat: number, lng: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { Accept: 'application/json' }, signal: controller.signal },
  )
    .then(res => (res.ok ? res.json() : null))
    .then((json: any) => {
      const name = json?.display_name || json?.name || '';
      return typeof name === 'string' ? name : '';
    })
    .catch(() => '')
    .finally(() => clearTimeout(timer));
}

function SalesGeoTagView() {
  // Assigned territories (loaded automatically on module open — no GPS required)
  const [fences, setFences] = useState<GeoFence[]>([]);
  const [fencesLoading, setFencesLoading] = useState(true);
  const [selectedFenceId, setSelectedFenceId] = useState('');

  // Current GPS location (captured only on demand)
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [locError, setLocError] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [address, setAddress] = useState('');
  const [visitType, setVisitType] = useState('other');
  const [validation, setValidation] = useState<GeoFenceValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);

  // History
  const [tags, setTags] = useState<GeoTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const selectedFence = fences.find(f => f._id === selectedFenceId) || fences[0] || null;
  const assignedName = selectedFence?.assignedUser?.name || 'You';

  const loadFences = useCallback(async () => {
    setFencesLoading(true);
    try {
      const list = await geoTagService.getMyFences();
      setFences(list);
      setSelectedFenceId(prev =>
        prev && list.some(f => f._id === prev) ? prev : (list[0]?._id ?? ''),
      );
    } catch {
      toast.error('Failed to load your assigned geo-fences');
      setFences([]);
    } finally {
      setFencesLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setTagsLoading(true);
    try {
      const res = await geoTagService.getAll({ page, limit: HISTORY_LIMIT });
      setTags(res.tags || []);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error('Failed to load location history');
      setTags([]);
    } finally {
      setTagsLoading(false);
    }
  }, [page]);

  useEffect(() => { loadFences(); }, [loadFences]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runValidation = useCallback(async (pos: { lat: number; lng: number }) => {
    if (!selectedFenceId) {
      setValidation(null);
      return;
    }
    setValidating(true);
    try {
      const result = await geoFenceService.validate(pos.lat, pos.lng, selectedFenceId);
      setValidation(result);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not check geo-fence status');
      setValidation(null);
    } finally {
      setValidating(false);
    }
  }, [selectedFenceId]);

  // Re-validate when the assigned territory selection changes and a location is already captured
  useEffect(() => {
    if (coords && selectedFenceId) void runValidation(coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFenceId]);

  const captureLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocError('Geolocation is not supported by this browser. Use a modern browser on a device with GPS.');
      return;
    }
    setLocLoading(true);
    setLocError('');
    setValidation(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const acc = isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null;
        const nextCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: acc };
        setCoords(nextCoords);
        setLocLoading(false);

        setGeocoding(true);
        const locationName = await reverseGeocode(nextCoords.lat, nextCoords.lng);
        setGeocoding(false);
        setAddress(locationName || '');

        void runValidation(nextCoords);
      },
      (err) => {
        setLocLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocError('Location permission was denied. Enable location access for this site in your browser settings and try again.');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocError('Location is unavailable right now. Make sure GPS/Wi-Fi is enabled and try again.');
            break;
          case err.TIMEOUT:
            setLocError('Location request timed out. Move to an open area and try again.');
            break;
          default:
            setLocError('An unknown error occurred while retrieving your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [runValidation]);

  const handleSave = async () => {
    if (!coords) {
      toast.error('Capture your current location first');
      return;
    }
    if (!selectedFence) {
      toast.error('No geo-fence territory is assigned to you yet');
      return;
    }
    setSaving(true);
    try {
      const saved = await geoTagService.save({
        latitude: coords.lat,
        longitude: coords.lng,
        accuracyMeters: coords.accuracy,
        address: address.trim(),
        visitType,
        fenceId: selectedFence._id,
      });
      const statusMsg = saved.inFence === true
        ? 'Location saved - inside geo-fence'
        : saved.inFence === false
          ? 'Location saved - outside geo-fence'
          : 'Location saved - no matching geo-fence';
      toast.success(statusMsg);
      loadHistory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const fenceRef = validation?.assignedFence || validation?.fence || null;
  const distanceRef = validation?.distanceToAssigned;
  const insideStatus = validation?.assignedFence
    ? validation.assignedInFence
    : validation?.fence
      ? validation.inFence
      : null;

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6">
      <PageHeader title="Geo-Tag / Geo-Fence" description="View your assigned territory and verify your current GPS location" />

      {/* Assigned Territory Card — loaded automatically, independent of GPS capture */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Assigned Territory</CardTitle>
              <p className="text-muted-foreground text-sm mt-0.5">
                Your geo-fence territories load automatically from your account.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {fencesLoading ? (
            <div className="h-40 animate-pulse bg-secondary/50 rounded-xl" />
          ) : fences.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed text-center space-y-2">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="font-medium text-foreground">No geo-fence territory has been assigned to you yet.</p>
              <p className="text-sm text-muted-foreground">Please contact Admin.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fences.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Select Assigned Territory</label>
                  <Select value={selectedFence?._id || ''} onValueChange={setSelectedFenceId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Choose a territory" /></SelectTrigger>
                    <SelectContent>
                      {fences.map(f => (
                        <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedFence && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm bg-secondary/40 rounded-xl p-4 border">
                  <div className="text-muted-foreground">Area</div>
                  <div className="font-medium text-foreground text-right truncate" title={selectedFence.name}>{selectedFence.name}</div>
                  <div className="text-muted-foreground">Centre Latitude</div>
                  <div className="font-mono text-foreground text-right">{Number(selectedFence.centerLat).toFixed(4)}</div>
                  <div className="text-muted-foreground">Centre Longitude</div>
                  <div className="font-mono text-foreground text-right">{Number(selectedFence.centerLng).toFixed(4)}</div>
                  <div className="text-muted-foreground">Radius</div>
                  <div className="text-foreground text-right">{selectedFence.radiusMeters} meters</div>
                  <div className="text-muted-foreground">Assigned To</div>
                  <div className="text-foreground text-right truncate" title={assignedName}>{assignedName}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Location Card */}
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
              <Navigation className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Current Location</CardTitle>
              <p className="text-muted-foreground text-sm mt-0.5">
                Allow browser location permission, then capture your GPS position.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="flex flex-col items-center gap-5">
            <Button
              size="lg"
              className="w-full sm:w-auto px-8"
              onClick={captureLocation}
              disabled={locLoading || validating || geocoding}
            >
              {locLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Crosshair className="h-5 w-5 mr-2" />}
              {locLoading ? 'Acquiring Location...' : 'Get Current Location'}
            </Button>

            {locError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 w-full">
                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{locError}</p>
              </div>
            )}

            {coords && !locError && (
              <div className="w-full bg-secondary/50 rounded-xl p-5 border text-center space-y-4">
                <p className="text-sm font-medium text-foreground">
                  Location captured successfully
                  {geocoding && <span className="text-muted-foreground"> — resolving address…</span>}
                  {validating && <span className="text-muted-foreground"> — checking geo-fence…</span>}
                </p>

                <div className="text-left space-y-3">
                  <CoordinatesBlock lat={coords.lat} lng={coords.lng} accuracy={coords.accuracy} />

                  {/* Address */}
                  <Input
                    label="Address / Location Name"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder={geocoding ? 'Resolving address…' : 'Address will be auto-filled; you can edit it.'}
                    disabled={geocoding}
                    icon={<MapPin className="h-4 w-4" />}
                  />

                  {/* Visit type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Visit Type</label>
                    <Select value={visitType} onValueChange={setVisitType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select visit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VISIT_TYPES.map(t => (
                          <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Geo-fence status */}
                <div className="mt-2 p-5 rounded-xl border bg-background text-left">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Geo-Fence Status</p>
                  {fencesLoading ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading assigned territory…</p>
                  ) : !selectedFence ? (
                    <div className="flex items-start gap-3 text-amber-700">
                      <CircleAlert className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">No assigned territory</p>
                        <p className="text-xs mt-0.5">No geo-fence territory has been assigned to you yet. Please contact Admin.</p>
                      </div>
                    </div>
                  ) : validating && !validation ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Checking your location against {selectedFence.name}…</p>
                  ) : !validation ? (
                    <p className="text-sm text-muted-foreground">Could not check geo-fence status. Use <span className="font-medium">Recapture</span> to try again.</p>
                  ) : fenceRef ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className={`h-5 w-5 ${insideStatus ? 'text-emerald-600' : 'text-red-600'}`} />
                          <div>
                            <p className="font-semibold text-foreground text-sm">{fenceRef.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Assigned Centre: {Number(fenceRef.centerLat).toFixed(4)}, {Number(fenceRef.centerLng).toFixed(4)} · Radius: {fenceRef.radiusMeters} m
                            </p>
                          </div>
                        </div>
                        <FenceStatusBadge inside={insideStatus} />
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm bg-secondary/50 rounded-lg p-3.5">
                        <span className="text-muted-foreground">Assigned Area</span>
                        <span className="font-medium text-foreground text-right">{fenceRef.name}</span>
                        <span className="text-muted-foreground">Current Location</span>
                        <span className="font-mono font-semibold text-right">{Number(coords.lat).toFixed(6)}, {Number(coords.lng).toFixed(6)}</span>
                        <span className="text-muted-foreground">Distance from assigned centre</span>
                        <span className="font-mono font-semibold text-right">{formatDistance(distanceRef)}</span>
                        <span className="text-muted-foreground">Status</span>
                        <span className={`font-semibold text-right ${insideStatus === true ? 'text-emerald-600' : insideStatus === false ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {insideStatus === true ? 'Inside Geo-Fence' : insideStatus === false ? 'Outside Geo-Fence' : 'Not checked'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 text-amber-700">
                      <CircleAlert className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">No matching geo-fence</p>
                        <p className="text-xs mt-0.5">Your current location is not within any active assigned territory.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={handleSave}
                    loading={saving}
                  >
                    <Navigation className="h-4 w-4 mr-2" /> Save Location
                  </Button>
                  <Button variant="outline" onClick={captureLocation}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Recapture
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Location History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            My Location History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <GeoTagHistoryTable tags={tags} loading={tagsLoading} />
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} pageSize={HISTORY_LIMIT} />
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────

export default function GeoTagPage() {
  const isAdmin = useIsAdmin();
  const { canAccess } = useModulePermissions(MODULES.GEO_TAG);

  if (!canAccess && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">You do not have access to this module.</p>
      </div>
    );
  }

  return isAdmin ? <AdminGeoTagView /> : <SalesGeoTagView />;
}