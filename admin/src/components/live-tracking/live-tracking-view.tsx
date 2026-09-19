'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { Radar, RefreshCw } from 'lucide-react';
import {
  geoFenceService,
  type LiveLocation,
  type TrackingStatus,
  type GeoFence,
} from '@/services/sales.service';
import { useLiveLocations } from '@/hooks/useLiveLocations';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_META: Record<TrackingStatus, { label: string; dot: string; badge: string }> = {
  not_tracking: { label: 'Not Tracking', dot: '#9ca3af', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  tracking_active: { label: 'Tracking Active', dot: '#10b981', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  tracking_stopped: { label: 'Tracking Stopped', dot: '#6b7280', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
  location_permission_denied: { label: 'Location Denied', dot: '#ef4444', badge: 'bg-red-100 text-red-700 border-red-200' },
  location_unavailable: { label: 'Location Unavailable', dot: '#f59e0b', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  last_location_available: { label: 'Last Known Location', dot: '#0ea5e9', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
};

function markerIcon(status: TrackingStatus): L.DivIcon {
  const meta = STATUS_META[status] || STATUS_META.not_tracking;
  const ping = status === 'tracking_active'
    ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${meta.dot};opacity:.35;animation:live-ping 1.6s cubic-bezier(0,0,.2,1) infinite;"></span>`
    : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:18px;height:18px;">${ping}<div style="width:18px;height:18px;border-radius:9999px;background:${meta.dot};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

const fenceCenterIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:9999px;border:3px solid #6366f1;background:rgba(99,102,241,.15);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapAutoCenter({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.setView([target.lat, target.lng], Math.max(map.getZoom(), 14), { animate: true });
  }, [target, map]);
  return null;
}

function distanceLabel(m: number | null | undefined): string {
  if (m === null || m === undefined) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function timeAgo(ts: string | null | undefined): string {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 0) return 'now';
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function LiveTrackingView() {
  const { locations, mode, error, connected, refresh } = useLiveLocations();
  const [fences, setFences] = useState<GeoFence[]>([]);
  const [fencesLoading, setFencesLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('__all__');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await geoFenceService.list();
        if (cancelled) return;
        setFences(list);
      } catch {
        if (!cancelled) toast.error('Could not load geo-fence boundaries for the map');
      } finally {
        if (!cancelled) setFencesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activeCount = locations.filter(l => l.trackingStatus === 'tracking_active').length;
  const selected = selectedUserId !== '__all__' ? (locations.find(l => l.salespersonId === selectedUserId) || null) : null;
  const mapTarget = selected?.latitude != null && selected?.longitude != null
    ? { lat: selected.latitude, lng: selected.longitude }
    : null;

  const mapInit = useMemo(() => {
    const sample = selected && selected.latitude != null && selected.longitude != null
      ? selected
      : locations.find(l => l.latitude != null && l.longitude != null);
    return sample && sample.latitude != null && sample.longitude != null
      ? { center: [sample.latitude, sample.longitude] as [number, number], zoom: 13 }
      : { center: [20.5937, 78.9629] as [number, number], zoom: 4 };
  }, []);

  const options = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const l of locations) {
      const name = l.userName || l.user?.name || l.salespersonId.slice(0, 8);
      if (!seen.has(l.salespersonId)) seen.set(l.salespersonId, { id: l.salespersonId, name });
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  const modeBadge = mode === 'sse'
    ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Live stream connected</Badge>
    : mode === 'polling'
      ? <Badge className="bg-amber-100 text-amber-700 border-amber-200">Auto-refresh every 3s</Badge>
      : <Badge className="bg-gray-100 text-gray-600 border-gray-200">Connecting…</Badge>;

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <Radar className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <CardTitle className="text-xl font-bold flex items-center gap-2 flex-wrap">
              Live Tracking
              {modeBadge}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-0.5">
              Real-time positions of sales personnel. {activeCount > 0 ? (
                <span className="font-medium text-emerald-600">{activeCount} actively tracking</span>
              ) : 'No one is actively tracking right now.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={!connected && mode !== 'polling'}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Map */}
          <div className="lg:col-span-2">
            {fencesLoading && (
              <div className="h-[440px] animate-pulse bg-secondary/50 rounded-xl" />
            )}
            {!fencesLoading && (
              <MapContainer
                center={mapInit.center}
                zoom={mapInit.zoom}
                className="h-[440px] w-full rounded-xl z-0"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {fences.map(f => (
                  <Fragment key={f._id}>
                    <Circle
                      center={[f.centerLat, f.centerLng]}
                      radius={f.radiusMeters}
                      pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.08 }}
                    />
                    <Marker position={[f.centerLat, f.centerLng]} icon={fenceCenterIcon}>
                      <Popup>
                        <strong>{f.name}</strong>
                        <br /><span className="text-xs">Radius: {f.radiusMeters} m</span>
                        {f.assignedUser?.name && (
                          <><br /><span className="text-xs">Assigned: {f.assignedUser.name}</span></>
                        )}
                      </Popup>
                    </Marker>
                  </Fragment>
                ))}
                {locations.map(l => (
                  l.latitude != null && l.longitude != null ? (
                    <Marker
                      key={l.salespersonId}
                      position={[l.latitude, l.longitude]}
                      icon={markerIcon(l.trackingStatus)}
                    >
                      <Popup>
                        <strong>{l.userName || l.user?.name || 'Salesperson'}</strong>
                        {l.user?.email && (<><br /><span className="text-xs">{l.user.email}</span></>)}
                        <br /><span className="font-mono text-xs">{l.latitude.toFixed(6)}, {l.longitude.toFixed(6)}</span>
                        <br />Status: {STATUS_META[l.trackingStatus]?.label || l.trackingStatus}
                        {l.accuracyMeters != null && (
                          <><br />Accuracy: ±{l.accuracyMeters} m</>
                        )}
                        {l.geofenceStatus && l.fenceId && (
                          <><br />Fence: <span className={l.geofenceStatus === 'inside' ? 'text-emerald-600' : 'text-red-600'}>
                            {l.geofenceStatus === 'inside' ? 'Inside' : 'Outside'} {l.fenceName || 'assigned'}
                          </span></>
                        )}
                        <br /><span className="text-xs text-muted-foreground">{formatDateTime(l.updatedAt)}</span>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
                <MapAutoCenter target={mapTarget} />
              </MapContainer>
            )}
          </div>

          {/* Salesperson list / detail */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Salesperson</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All sales personnel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All sales personnel</SelectItem>
                  {options.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected ? (
              <div className="bg-background border rounded-xl p-4 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{selected.userName || selected.user?.name}</p>
                  <Badge variant="outline" className={(STATUS_META[selected.trackingStatus] || STATUS_META.not_tracking).badge}>
                    {STATUS_META[selected.trackingStatus]?.label || selected.trackingStatus}
                  </Badge>
                </div>
                {selected.latitude != null && selected.longitude != null && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Coordinates</span>
                      <span className="font-mono text-right">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</span>
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-mono text-right">{selected.accuracyMeters != null ? `±${selected.accuracyMeters} m` : '—'}</span>
                      {selected.fenceId && (
                        <>
                          <span className="text-muted-foreground">Geo-Fence</span>
                          <span className={`font-medium text-right ${selected.geofenceStatus === 'inside' ? 'text-emerald-600' : selected.geofenceStatus === 'outside' ? 'text-red-600' : ''}`}>
                            {selected.geofenceStatus ? (selected.geofenceStatus === 'inside' ? 'Inside' : 'Outside') : '—'}{selected.fenceName ? ` · ${selected.fenceName}` : ''}
                          </span>
                          <span className="text-muted-foreground">Distance from centre</span>
                          <span className="font-mono text-right">{distanceLabel(selected.distanceFromGeofence)}</span>
                        </>
                      )}
                      <span className="text-muted-foreground">Last updated</span>
                      <span className="text-right">{timeAgo(selected.updatedAt)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {connected ? 'Receiving live updates' : 'Waiting for a new update…'}
                </div>
              </div>
            ) : (
              <div className="bg-secondary/40 border rounded-xl p-4 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">All sales personnel</p>
                <p>Total live records: {locations.length}</p>
                <p>Actively tracking: {activeCount}</p>
                <p className="text-xs">Choose a salesperson above to see their live feed details. Locations appear here once a salesperson starts tracking from the Geo-Tag page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Salesperson</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Latitude</th>
                <th className="p-3 font-medium">Longitude</th>
                <th className="p-3 font-medium">Accuracy</th>
                <th className="p-3 font-medium">Geo-Fence</th>
                <th className="p-3 font-medium">Distance from centre</th>
                <th className="p-3 font-medium">Last updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    No live locations yet. When a salesperson starts Live Tracking on the Geo-Tag page, their position appears here.
                  </td>
                </tr>
              ) : (
                locations.map(l => {
                  const meta = STATUS_META[l.trackingStatus] || STATUS_META.not_tracking;
                  const isSelected = selectedUserId !== '__all__' && selectedUserId === l.salespersonId;
                  return (
                    <tr key={l.salespersonId} className={`transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-secondary/30'}`}>
                      <td className="p-3 font-medium text-foreground whitespace-nowrap">{l.userName || l.user?.name || '—'}</td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="outline" className={`gap-1.5 ${meta.badge}`}><span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />{meta.label}</Badge>
                      </td>
                      <td className="p-3 font-mono text-xs">{l.latitude?.toFixed(6) ?? '—'}</td>
                      <td className="p-3 font-mono text-xs">{l.longitude?.toFixed(6) ?? '—'}</td>
                      <td className="p-3">{l.accuracyMeters != null ? `±${l.accuracyMeters} m` : '—'}</td>
                      <td className="p-3 whitespace-nowrap">
                        {l.geofenceStatus ? (
                          <span className={l.geofenceStatus === 'inside' ? 'text-emerald-600' : 'text-red-600'}>
                            {l.geofenceStatus === 'inside' ? 'Inside' : 'Outside'}{l.fenceName ? ` · ${l.fenceName}` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-3 font-mono">{distanceLabel(l.distanceFromGeofence)}</td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground" title={formatDateTime(l.updatedAt)}>
                        {timeAgo(l.updatedAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <style>{`
        @keyframes live-ping {
          0% { transform: scale(1); opacity: .5; }
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
    </Card>
  );
}