'use client';
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Package, Warehouse, ArrowDownUp, AlertTriangle, TrendingUp,
  Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  Download, ShieldAlert, RefreshCw, CheckCheck, IndianRupee,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable, Column } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { inventoryService } from '@/services/inventory.service';
import { inventoryLedgerService } from '@/services/inventory-ledger.service';
import { formatDate } from '@/lib/utils';
import type {
  Warehouse as IWarehouse, WarehouseFormData, StockProduct, InventoryMovement,
  StockAlert, InventoryForecast,
} from '@/types';

const LIMIT = 15;

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

const stockStatusColors: Record<string, string> = {
  in_stock: 'bg-green-50 text-green-700',
  low: 'bg-yellow-50 text-yellow-700',
  critical: 'bg-orange-50 text-orange-700',
  out_of_stock: 'bg-red-50 text-red-700',
};

type Tab = 'stock' | 'warehouses' | 'movements' | 'alerts' | 'audit' | 'forecast';

const emptyWarehouse: WarehouseFormData = { name: '', code: '', addressLine1: '', city: '', state: '', pincode: '', isActive: true };

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('stock');
  const [stats, setStats] = useState<any>(null);

  // Stock (from inventory ledger)
  const [stock, setStock] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalPages, setStockTotalPages] = useState(1);
  const [stockStatus, setStockStatus] = useState('');

  // Stock update dialog
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateProduct, setUpdateProduct] = useState<any>(null);
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updateType, setUpdateType] = useState<'add' | 'remove' | 'adjust'>('add');
  const [updateReason, setUpdateReason] = useState('');
  const [updating, setUpdating] = useState(false);

  // Warehouses
  const [warehouses, setWarehouses] = useState<IWarehouse[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<IWarehouse | null>(null);
  const [warehouseForm, setWarehouseForm] = useState<WarehouseFormData>(emptyWarehouse);
  const [savingWarehouse, setSavingWarehouse] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Movements (old system)
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementPage, setMovementPage] = useState(1);
  const [movementTotalPages, setMovementTotalPages] = useState(1);

  // Alerts
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertPage, setAlertPage] = useState(1);
  const [alertTotalPages, setAlertTotalPages] = useState(1);

  // Audit log (new inventory ledger)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Forecast
  const [forecasts, setForecasts] = useState<InventoryForecast[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Mark Damaged dialog
  const [damagedOpen, setDamagedOpen] = useState(false);
  const [damagedProduct, setDamagedProduct] = useState<any>(null);
  const [damagedQty, setDamagedQty] = useState('');
  const [damagedReason, setDamagedReason] = useState('');
  const [markingDamaged, setMarkingDamaged] = useState(false);

  // Audit log filters
  const [auditSearch, setAuditSearch] = useState('');
  const [auditAction, setAuditAction] = useState('');

  // CSV export
  const [exporting, setExporting] = useState(false);

  const loadStats = async () => {
    try {
      const data = await inventoryLedgerService.getDashboardStats();
      setStats(data);
    } catch {
      // Fallback to old stats
      try {
        const old = await inventoryService.getDashboardStats();
        setStats(old);
      } catch { /* ignore */ }
    }
  };

  const loadWarehouses = useCallback(async () => {
    setWarehouseLoading(true);
    try {
      const data = await inventoryService.getWarehouses();
      setWarehouses(data);
    } catch { toast.error('Failed to load warehouses'); }
    finally { setWarehouseLoading(false); }
  }, []);

  const loadStock = useCallback(async () => {
    setStockLoading(true);
    try {
      const result = await inventoryLedgerService.getAll({
        page: stockPage, limit: LIMIT, search: stockSearch, stockStatus,
      });
      setStock(result.items || []);
      setStockTotalPages(result.totalPages || 1);
    } catch {
      // Fallback to old stock overview
      try {
        const result = await inventoryService.getStockOverview({ page: stockPage, limit: LIMIT, search: stockSearch, stockStatus });
        setStock(result.products || []);
        setStockTotalPages(result.totalPages || 1);
      } catch { toast.error('Failed to load stock'); }
    }
    finally { setStockLoading(false); }
  }, [stockPage, stockSearch, stockStatus]);

  const loadMovements = useCallback(async () => {
    setMovementLoading(true);
    try {
      const result = await inventoryService.getMovements({ page: movementPage, limit: LIMIT });
      setMovements(result.movements || []);
      setMovementTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load movements'); }
    finally { setMovementLoading(false); }
  }, [movementPage]);

  const loadAlerts = useCallback(async () => {
    setAlertLoading(true);
    try {
      const result = await inventoryService.getAlerts({ page: alertPage, limit: LIMIT });
      setAlerts(result.alerts || []);
      setAlertTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load alerts'); }
    finally { setAlertLoading(false); }
  }, [alertPage]);

  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const result = await inventoryLedgerService.getAuditLog({ page: auditPage, limit: LIMIT, action: auditAction });
      setAuditLogs(result.logs || []);
      setAuditTotalPages(result.totalPages || 1);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setAuditLoading(false); }
  }, [auditPage, auditAction]);

  const loadForecasts = useCallback(async () => {
    setForecastLoading(true);
    try {
      const data = await inventoryService.getForecasts();
      setForecasts(Array.isArray(data) ? data : data?.forecasts || []);
    } catch { toast.error('Failed to load forecasts'); }
    finally { setForecastLoading(false); }
  }, []);

  useEffect(() => { loadStats(); loadWarehouses(); }, []);
  useEffect(() => { if (tab === 'stock') loadStock(); }, [tab, loadStock]);
  useEffect(() => { if (tab === 'warehouses') loadWarehouses(); }, [tab, loadWarehouses]);
  useEffect(() => { if (tab === 'movements') loadMovements(); }, [tab, loadMovements]);
  useEffect(() => { if (tab === 'alerts') loadAlerts(); }, [tab, loadAlerts]);
  useEffect(() => { if (tab === 'audit') loadAuditLogs(); }, [tab, loadAuditLogs]);
  useEffect(() => { if (tab === 'forecast') loadForecasts(); }, [tab, loadForecasts]);

  // Warehouse CRUD
  const openNewWarehouse = () => { setEditingWarehouse(null); setWarehouseForm(emptyWarehouse); setWarehouseOpen(true); };
  const openEditWarehouse = (w: IWarehouse) => {
    setEditingWarehouse(w);
    setWarehouseForm({ name: w.name, code: w.code || '', addressLine1: w.addressLine1 || '', city: w.city || '', state: w.state || '', pincode: w.pincode || '', managerName: w.managerName || '', managerPhone: w.managerPhone || '', isActive: w.isActive });
    setWarehouseOpen(true);
  };

  const handleSaveWarehouse = async () => {
    if (!warehouseForm.name.trim()) return toast.error('Name is required');
    if (!warehouseForm.code?.trim()) return toast.error('Code is required');
    setSavingWarehouse(true);
    try {
      if (editingWarehouse) {
        await inventoryService.updateWarehouse(editingWarehouse._id, warehouseForm);
        toast.success('Warehouse updated');
      } else {
        await inventoryService.createWarehouse(warehouseForm);
        toast.success('Warehouse created');
      }
      setWarehouseOpen(false);
      loadWarehouses();
      loadStats();
    } catch { toast.error('Failed to save warehouse'); }
    finally { setSavingWarehouse(false); }
  };

  const handleDeleteWarehouse = async () => {
    if (!deleteId) return;
    try {
      await inventoryService.deleteWarehouse(deleteId);
      toast.success('Warehouse deleted');
      setDeleteId(null);
      loadWarehouses();
      loadStats();
    } catch { toast.error('Failed to delete warehouse'); }
  };

  // Stock update via inventory ledger
  const openStockUpdate = (product: any) => {
    setUpdateProduct(product);
    setUpdateQuantity('');
    setUpdateType('add');
    setUpdateReason('');
    setUpdateOpen(true);
  };

  const handleStockUpdate = async () => {
    if (!updateProduct || !updateQuantity) return toast.error('Quantity is required');
    const qty = parseInt(updateQuantity);
    if (isNaN(qty) || qty < 0) return toast.error('Invalid quantity');
    setUpdating(true);
    try {
      const productId = updateProduct.productId || updateProduct._id;
      if (updateType === 'add') {
        await inventoryLedgerService.addStock(productId, qty, updateReason);
      } else if (updateType === 'remove') {
        await inventoryLedgerService.removeStock(productId, qty, updateReason);
      } else {
        await inventoryLedgerService.adjustStock(productId, qty, updateReason);
      }
      toast.success('Stock updated');
      setUpdateOpen(false);
      loadStock();
      loadStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update stock');
    }
    finally { setUpdating(false); }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await inventoryService.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      loadAlerts();
      loadStats();
    } catch { toast.error('Failed to acknowledge alert'); }
  };

  const handleBulkAcknowledge = async () => {
    const unacked = alerts.filter((a: any) => !a.isAcknowledged);
    if (!unacked.length) return toast.error('No unacknowledged alerts');
    try {
      await Promise.all(unacked.map((a: any) => inventoryService.acknowledgeAlert(a._id || a.id)));
      toast.success(`${unacked.length} alerts acknowledged`);
      loadAlerts();
      loadStats();
    } catch { toast.error('Failed to bulk acknowledge'); }
  };

  const handleMarkDamaged = async () => {
    if (!damagedProduct || !damagedQty) return toast.error('Quantity is required');
    const qty = parseInt(damagedQty);
    if (isNaN(qty) || qty <= 0) return toast.error('Enter a valid quantity');
    setMarkingDamaged(true);
    try {
      const productId = damagedProduct.productId || damagedProduct._id;
      await inventoryLedgerService.markDamaged(productId, qty, damagedReason);
      toast.success(`${qty} units marked as damaged`);
      setDamagedOpen(false);
      setDamagedQty(''); setDamagedReason('');
      loadStock(); loadStats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark damaged');
    } finally { setMarkingDamaged(false); }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await inventoryLedgerService.exportCsv();
      toast.success('CSV downloaded');
    } catch { toast.error('Failed to export CSV'); }
    finally { setExporting(false); }
  };

  const handleGenerateForecasts = async () => {
    try {
      await inventoryService.generateForecasts();
      toast.success('Forecasts generated');
      loadForecasts();
    } catch { toast.error('Failed to generate forecasts'); }
  };

  const stockColumns: Column<any>[] = [
    {
      key: 'name', header: 'Product', sortable: true,
      render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.productName || p.name || '-'}</p>
          <p className="text-xs text-muted-foreground">SKU: {p.sku || '-'} · ₹{(p.sellingPrice ?? 0).toLocaleString()}</p>
        </div>
      ),
    },
    {
      key: 'availableStock', header: 'Available',
      render: (p) => {
        const avail = p.availableStock ?? p.stock ?? 0;
        return <span className={`font-mono font-bold ${avail === 0 ? 'text-red-600' : avail <= 5 ? 'text-orange-600' : 'text-green-700'}`}>{avail}</span>;
      },
    },
    {
      key: 'reservedStock', header: 'Reserved',
      render: (p) => <span className="font-mono text-yellow-700">{p.reservedStock ?? 0}</span>,
    },
    {
      key: 'soldStock', header: 'Sold',
      render: (p) => <span className="font-mono text-blue-700">{p.soldStock ?? 0}</span>,
    },
    {
      key: 'damagedStock', header: 'Damaged',
      render: (p) => {
        const dmg = p.damagedStock ?? 0;
        return <span className={`font-mono ${dmg > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>{dmg}</span>;
      },
    },
    {
      key: 'stockStatus', header: 'Status',
      render: (p) => {
        const status = p.stockStatus || (p.availableStock === 0 ? 'out_of_stock' : p.availableStock <= 5 ? 'critical' : p.availableStock <= 10 ? 'low' : 'in_stock');
        return <Badge variant="outline" className={stockStatusColors[status] || ''}>{status.replace(/_/g, ' ')}</Badge>;
      },
    },
    {
      key: 'actions', header: '',
      render: (p) => (
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => openStockUpdate(p)} title="Update Stock">
            <ArrowDownUp className="h-3.5 w-3.5 mr-1" /> Update
          </Button>
          <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={() => { setDamagedProduct(p); setDamagedQty(''); setDamagedReason(''); setDamagedOpen(true); }}
            title="Mark as Damaged">
            <ShieldAlert className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const warehouseColumns: Column<IWarehouse>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (w) => <span className="font-medium">{w.name}</span> },
    { key: 'code', header: 'Code', render: (w) => <span className="text-sm font-mono">{w.code || '-'}</span> },
    { key: 'city', header: 'Location', render: (w) => <span className="text-sm">{[w.city, w.state].filter(Boolean).join(', ') || '-'}</span> },
    {
      key: 'isActive', header: 'Status',
      render: (w) => w.isActive
        ? <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
        : <Badge variant="outline" className="bg-gray-50 text-gray-500">Inactive</Badge>,
    },
    {
      key: 'actions', header: '',
      render: (w) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEditWarehouse(w)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(w._id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  const movementColumns: Column<InventoryMovement>[] = [
    {
      key: 'product', header: 'Product',
      render: (m) => <span className="text-sm font-medium">{(m as any).product?.name || '-'}</span>,
    },
    {
      key: 'type', header: 'Type',
      render: (m) => {
        const c = m.type === 'in' ? 'bg-green-50 text-green-700' : m.type === 'out' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700';
        return <Badge variant="outline" className={c}>{m.type}</Badge>;
      },
    },
    { key: 'quantity', header: 'Qty', render: (m) => <span className="font-mono">{(m as any).quantity}</span> },
    { key: 'beforeQty', header: 'Before', render: (m) => <span className="text-sm text-muted-foreground">{m.beforeQty}</span> },
    { key: 'afterQty', header: 'After', render: (m) => <span className="text-sm font-medium">{m.afterQty}</span> },
    { key: 'notes', header: 'Notes', render: (m) => <span className="text-sm text-muted-foreground line-clamp-1">{(m as any).notes || '-'}</span> },
    { key: 'createdAt', header: 'Date', render: (m) => <span className="text-xs text-muted-foreground">{formatDate((m as any).createdAt)}</span> },
  ];

  const alertColumns: Column<StockAlert>[] = [
    {
      key: 'product', header: 'Product',
      render: (a) => {
        const name = (a as any).products?.name || (a as any).product?.name || (a as any).productName || 'Unknown Product';
        const sku = (a as any).products?.sku || (a as any).product?.sku || '';
        return (
          <div>
            <span className="font-medium text-sm">{name}</span>
            {sku && <p className="text-xs text-muted-foreground">{sku}</p>}
          </div>
        );
      },
    },
    {
      key: 'alertType', header: 'Alert Type',
      render: (a) => {
        const colorMap: Record<string, string> = {
          low_stock: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          out_of_stock: 'bg-red-50 text-red-700 border-red-200',
          overstock: 'bg-blue-50 text-blue-700 border-blue-200',
        };
        const type = a.alertType || '';
        return <Badge variant="outline" className={colorMap[type] || ''}>{type.replace(/_/g, ' ') || '-'}</Badge>;
      },
    },
    {
      key: 'currentStock', header: 'Current Stock',
      render: (a) => {
        const stock = (a as any).currentStock ?? (a as any).products?.stock ?? '-';
        const isOut = stock === 0;
        return <span className={`font-mono text-sm font-semibold ${isOut ? 'text-red-600' : 'text-orange-600'}`}>{stock}</span>;
      },
    },
    { key: 'threshold', header: 'Threshold', render: (a) => <span className="font-mono text-sm text-muted-foreground">{a.threshold ?? '-'}</span> },
    { key: 'createdAt', header: 'Date', render: (a) => <span className="text-xs text-muted-foreground">{formatDate((a as any).createdAt)}</span> },
    {
      key: 'actions', header: 'Status',
      render: (a) => {
        const id = (a as any)._id || (a as any).id;
        return !a.isAcknowledged
          ? <Button variant="outline" size="sm" onClick={() => handleAcknowledgeAlert(id)}>Acknowledge</Button>
          : <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Acknowledged</Badge>;
      },
    },
  ];

  const auditColumns: Column<any>[] = [
    {
      key: 'product', header: 'Product',
      render: (l) => <span className="text-sm font-medium">{l.products?.name || '-'}</span>,
    },
    {
      key: 'action', header: 'Action',
      render: (l) => {
        const colors: Record<string, string> = {
          created: 'bg-blue-50 text-blue-700',
          order_placed: 'bg-yellow-50 text-yellow-700',
          order_cancelled: 'bg-gray-50 text-gray-700',
          order_delivered: 'bg-green-50 text-green-700',
          stock_added: 'bg-emerald-50 text-emerald-700',
          stock_removed: 'bg-red-50 text-red-700',
          stock_adjusted: 'bg-purple-50 text-purple-700',
          damaged: 'bg-orange-50 text-orange-700',
        };
        return <Badge variant="outline" className={colors[l.action] || ''}>{(l.action || '').replace(/_/g, ' ') || '-'}</Badge>;
      },
    },
    { key: 'quantityChanged', header: 'Qty', render: (l) => <span className="font-mono">{l.quantityChanged}</span> },
    { key: 'notes', header: 'Notes', render: (l) => <span className="text-sm text-muted-foreground line-clamp-1">{l.notes || '-'}</span> },
    { key: 'referenceType', header: 'Ref', render: (l) => <span className="text-xs text-muted-foreground">{l.referenceType || '-'}</span> },
    { key: 'createdAt', header: 'Date', render: (l) => <span className="text-xs text-muted-foreground">{formatDate(l.createdAt)}</span> },
  ];

  const tabLabels: Record<Tab, string> = {
    stock: 'Stock Overview',
    warehouses: 'Warehouses',
    movements: 'Movements',
    alerts: 'Alerts',
    audit: 'Audit Log',
    forecast: 'Forecast',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Management" description="Stock tracking, warehouses, movements, alerts, and audit log" />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Products" value={stats.totalProducts || 0} icon={Package} color="bg-blue-500" />
          <StatCard title="Low Stock" value={stats.lowStock || 0} icon={AlertTriangle} color="bg-yellow-500" />
          <StatCard title="Out of Stock" value={stats.outOfStock || 0} icon={Package} color="bg-red-500" />
          <StatCard title="Pending Entries" value={stats.pendingEntries || 0} icon={Warehouse} color="bg-indigo-500" />
          <StatCard title="Total Value" value={`₹${(typeof stats.totalStockValue === 'number' && isFinite(stats.totalStockValue) ? stats.totalStockValue : 0).toLocaleString()}`} icon={TrendingUp} color="bg-green-500" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {(Object.keys(tabLabels) as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {/* Stock Tab */}
      {tab === 'stock' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={stockSearch} onChange={e => { setStockSearch(e.target.value); setStockPage(1); }} className="pl-9" />
            </div>
            <select value={stockStatus} onChange={e => { setStockStatus(e.target.value); setStockPage(1); }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="critical">Critical</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
            <Button variant="outline" onClick={loadStock} title="Refresh"><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={handleExportCsv} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />{exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
          <DataTable columns={stockColumns} data={stock} loading={stockLoading} rowKey={(r) => r._id || r.inventoryId || r.productId || Math.random().toString()} />
          {stockTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStockPage(p => Math.max(1, p - 1))} disabled={stockPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {stockPage} of {stockTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setStockPage(p => Math.min(stockTotalPages, p + 1))} disabled={stockPage >= stockTotalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Warehouses Tab */}
      {tab === 'warehouses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewWarehouse}><Plus className="h-4 w-4 mr-2" /> Add Warehouse</Button>
          </div>
          <DataTable columns={warehouseColumns} data={warehouses} loading={warehouseLoading} rowKey={(w) => w._id} />
        </div>
      )}

      {/* Movements Tab */}
      {tab === 'movements' && (
        <div className="space-y-4">
          <DataTable columns={movementColumns} data={movements} loading={movementLoading} rowKey={(m) => (m as any)._id || Math.random().toString()} />
          {movementTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setMovementPage(p => Math.max(1, p - 1))} disabled={movementPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {movementPage} of {movementTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setMovementPage(p => Math.min(movementTotalPages, p + 1))} disabled={movementPage >= movementTotalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {alerts.filter((a: any) => !a.isAcknowledged).length} unacknowledged alert(s)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => inventoryService.checkAlerts().then(() => { toast.success('Alert check done'); loadAlerts(); })}>
                <RefreshCw className="h-4 w-4 mr-2" /> Run Check
              </Button>
              <Button size="sm" onClick={handleBulkAcknowledge}>
                <CheckCheck className="h-4 w-4 mr-2" /> Acknowledge All
              </Button>
            </div>
          </div>
          <DataTable columns={alertColumns} data={alerts} loading={alertLoading} rowKey={(a) => (a as any)._id || Math.random().toString()} />
          {alertTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAlertPage(p => Math.max(1, p - 1))} disabled={alertPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {alertPage} of {alertTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setAlertPage(p => Math.min(alertTotalPages, p + 1))} disabled={alertPage >= alertTotalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={auditAction} onChange={e => { setAuditAction(e.target.value); setAuditPage(1); }}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">All Actions</option>
              <option value="stock_added">Stock Added</option>
              <option value="stock_removed">Stock Removed</option>
              <option value="stock_adjusted">Stock Adjusted</option>
              <option value="damaged">Damaged</option>
              <option value="order_placed">Order Placed</option>
              <option value="order_delivered">Order Delivered</option>
              <option value="order_cancelled">Order Cancelled</option>
              <option value="created">Created</option>
            </select>
            <Button variant="outline" onClick={() => { setAuditAction(''); setAuditPage(1); }} className="text-sm">Clear Filter</Button>
          </div>
          <DataTable columns={auditColumns} data={auditLogs} loading={auditLoading} rowKey={(l) => l._id || Math.random().toString()} />
          {auditTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage <= 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">Page {auditPage} of {auditTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))} disabled={auditPage >= auditTotalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      )}

      {/* Forecast Tab */}
      {tab === 'forecast' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleGenerateForecasts}><TrendingUp className="h-4 w-4 mr-2" /> Generate Forecasts</Button>
          </div>
          {forecastLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading forecasts...</div>
          ) : forecasts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No forecasts available. Click &quot;Generate Forecasts&quot; to create them.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {forecasts.map((f, idx) => (
                <div key={f._id || (f as any).productId || `forecast-${idx}`} className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{(f as any).products?.name || (f as any).product?.name || (f as any).name || '-'}</h4>
                    {f.reorderRecommended && <Badge variant="outline" className="bg-red-50 text-red-700">Reorder</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Avg Daily Sales</p>
                      <p className="font-mono font-medium">{f.avgDailySales}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Predicted Demand</p>
                      <p className="font-mono font-medium">{f.predictedDemand}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Recommended Qty</p>
                      <p className="font-mono font-medium">{f.recommendedQty}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Days Remaining</p>
                      <p className="font-mono font-medium">{f.daysOfStockRemaining ?? '-'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stock Update Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Stock - {updateProduct?.productName || updateProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3 text-sm bg-muted/30 rounded-lg p-3">
              <div><span className="text-muted-foreground">Available:</span> <span className="font-mono font-medium text-green-700">{updateProduct?.availableStock ?? updateProduct?.stock ?? 0}</span></div>
              <div><span className="text-muted-foreground">Reserved:</span> <span className="font-mono text-yellow-700">{updateProduct?.reservedStock ?? 0}</span></div>
              <div><span className="text-muted-foreground">Sold:</span> <span className="font-mono text-blue-700">{updateProduct?.soldStock ?? 0}</span></div>
            </div>
            <div>
              <label className="text-sm font-medium">Update Type</label>
              <select value={updateType} onChange={e => setUpdateType(e.target.value as any)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
                <option value="adjust">Set Exact Amount</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{updateType === 'adjust' ? 'New Stock Level *' : 'Quantity *'}</label>
              <Input type="number" value={updateQuantity} onChange={e => setUpdateQuantity(e.target.value)} min={0} placeholder={updateType === 'adjust' ? 'Enter new stock level' : 'Enter quantity'} />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input value={updateReason} onChange={e => setUpdateReason(e.target.value)} placeholder="e.g. Restocking, Damage, Audit correction" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>Cancel</Button>
            <Button onClick={handleStockUpdate} disabled={updating}>{updating ? 'Updating...' : 'Update Stock'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Dialog */}
      <Dialog open={warehouseOpen} onOpenChange={setWarehouseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input value={warehouseForm.name} onChange={e => setWarehouseForm({ ...warehouseForm, name: e.target.value })} placeholder="Warehouse name" />
              </div>
              <div>
                <label className="text-sm font-medium">Code *</label>
                <Input value={warehouseForm.code || ''} onChange={e => setWarehouseForm({ ...warehouseForm, code: e.target.value })} placeholder="e.g. WH-MAIN" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input value={warehouseForm.addressLine1 || ''} onChange={e => setWarehouseForm({ ...warehouseForm, addressLine1: e.target.value })} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <Input value={warehouseForm.city || ''} onChange={e => setWarehouseForm({ ...warehouseForm, city: e.target.value })} placeholder="City" />
              </div>
              <div>
                <label className="text-sm font-medium">State</label>
                <Input value={warehouseForm.state || ''} onChange={e => setWarehouseForm({ ...warehouseForm, state: e.target.value })} placeholder="State" />
              </div>
              <div>
                <label className="text-sm font-medium">Pincode</label>
                <Input value={warehouseForm.pincode || ''} onChange={e => setWarehouseForm({ ...warehouseForm, pincode: e.target.value })} placeholder="Pincode" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="warehouse-active" checked={warehouseForm.isActive} onChange={e => setWarehouseForm({ ...warehouseForm, isActive: e.target.checked })} />
              <label htmlFor="warehouse-active" className="text-sm">Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarehouseOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWarehouse} disabled={savingWarehouse}>{savingWarehouse ? 'Saving...' : editingWarehouse ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteWarehouse}
        title="Delete Warehouse"
        description="Are you sure you want to delete this warehouse? Stock entries associated with it will need to be reassigned."
      />

      {/* Mark Damaged Dialog */}
      <Dialog open={damagedOpen} onOpenChange={setDamagedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-orange-500" />
              Mark as Damaged — {damagedProduct?.productName || damagedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-orange-50 text-orange-800 text-sm rounded-lg px-4 py-3">
              Available stock: <span className="font-mono font-bold">{damagedProduct?.availableStock ?? 0}</span> units.
              Damaged units will be deducted from available stock and tracked separately.
            </div>
            <div>
              <label className="text-sm font-medium">Damaged Quantity *</label>
              <Input type="number" value={damagedQty} onChange={e => setDamagedQty(e.target.value)}
                min={1} max={damagedProduct?.availableStock ?? 0} placeholder="How many units are damaged?" />
            </div>
            <div>
              <label className="text-sm font-medium">Reason / Notes</label>
              <Input value={damagedReason} onChange={e => setDamagedReason(e.target.value)}
                placeholder="e.g. Water damage, Broken screen, Defective batch" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDamagedOpen(false)}>Cancel</Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleMarkDamaged} disabled={markingDamaged}>
              {markingDamaged ? 'Marking...' : 'Mark as Damaged'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
