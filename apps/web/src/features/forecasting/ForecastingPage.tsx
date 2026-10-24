import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { RunwayTimeline, type RunwayItem } from '@/components/ui/Runway';
import { SeverityBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Sliders,
  Filter,
  Search,
  ShoppingCart,
  ArrowRight,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface RawRunwayItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  avgDailyDemand: number;
  daysOfCover: number;
  stockoutDate: string;
  replenishmentDate: string | null;
  riskLevel: 'CRITICAL' | 'WARNING' | 'LOW' | 'HEALTHY';
  suggestedReorderQty: number;
  estimatedCost: number;
  supplierName?: string;
}

interface Recommendation {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'OPPORTUNITY';
  what: string;
  why: string;
  evidence: string;
  impact: string;
  suggestedQty: number;
  estimatedCost: number;
  supplierName?: string;
}

interface Supplier {
  _id: string;
  name: string;
  code: string;
}

interface Warehouse {
  _id: string;
  name: string;
  code: string;
}

const PRESET_HORIZONS = [
  { label: '7 Days', days: 7 },
  { label: '14 Days (Standard)', days: 14 },
  { label: '30 Days (1 Month)', days: 30 },
  { label: '60 Days (2 Months)', days: 60 },
  { label: '90 Days (Quarterly)', days: 90 },
  { label: '180 Days (Half-Year)', days: 180 },
];

export function ForecastingPage() {
  const navigate = useNavigate();

  // Primary Data State
  const [rawRunway, setRawRunway] = React.useState<RawRunwayItem[]>([]);
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Flexible Horizon & Date Controls
  const [horizonDays, setHorizonDays] = React.useState<number>(14);
  const [customDate, setCustomDate] = React.useState<string>(() => {
    const d = new Date(Date.now() + 14 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [demandMultiplier, setDemandMultiplier] = React.useState<number>(1.0);

  // Filters
  const [search, setSearch] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('ALL');
  const [riskFilter, setRiskFilter] = React.useState<string>('ALL');

  // Interactive Reorder Modal State
  const [reorderModalOpen, setReorderModalOpen] = React.useState(false);
  const [selectedRec, setSelectedRec] = React.useState<Recommendation | null>(null);
  const [reorderForm, setReorderForm] = React.useState({
    supplierId: '',
    warehouseId: '',
    quantity: 100,
    unitPrice: 100,
    expectedDeliveryDays: 7,
  });
  const [submittingPO, setSubmittingPO] = React.useState(false);

  // Fetch initial data
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [runwayRes, recRes, supRes, whRes] = await Promise.all([
        get<any[]>('/forecasting/runway'),
        get<Recommendation[]>('/forecasting/recommendations'),
        get<any>('/suppliers'),
        get<any>('/warehouses'),
      ]);

      setRawRunway(Array.isArray(runwayRes) ? runwayRes : []);
      setRecommendations(
        (Array.isArray(recRes) ? recRes : []).map((rec: any) => ({
          ...rec,
          severity: rec.severity === 'HEALTHY' || rec.severity === 'LOW' ? 'INFO' : rec.severity,
        }))
      );

      const supList = Array.isArray(supRes) ? supRes : (supRes?.data || supRes?.suppliers || []);
      const whList = Array.isArray(whRes) ? whRes : (whRes?.data || whRes?.warehouses || []);
      setSuppliers(supList);
      setWarehouses(whList);
    } catch (err) {
      console.error('Failed to load forecasting runway data:', err);
      toast.error('Failed to retrieve forecast projections');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle custom date picker input
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDate(val);
    if (!val) return;
    const targetTime = new Date(val).getTime();
    const nowTime = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.max(1, Math.ceil((targetTime - nowTime) / 86400000));
    setHorizonDays(diffDays);
  };

  // Handle preset horizon selection
  const handleSelectPreset = (days: number) => {
    setHorizonDays(days);
    const target = new Date(Date.now() + days * 86400000);
    setCustomDate(target.toISOString().split('T')[0]);
  };

  // Derive unique categories from active items
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    rawRunway.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [rawRunway]);

  // Compute reactive runway items with dynamic demand multiplier & horizon
  const processedRunway = React.useMemo(() => {
    const now = Date.now();
    return rawRunway
      .map((item) => {
        const effectiveDailyDemand = Math.max(0.1, item.avgDailyDemand * demandMultiplier);
        const adjustedDaysOfCover = Math.round((item.currentStock / effectiveDailyDemand) * 10) / 10;
        const adjustedStockoutDate = new Date(now + adjustedDaysOfCover * 86400000).toISOString();

        let adjustedRisk: 'CRITICAL' | 'WARNING' | 'LOW' = 'LOW';
        if (adjustedDaysOfCover <= 3) {
          adjustedRisk = 'CRITICAL';
        } else if (adjustedDaysOfCover <= 14 || adjustedDaysOfCover <= horizonDays * 0.4) {
          adjustedRisk = 'WARNING';
        }

        return {
          ...item,
          daysOfCover: adjustedDaysOfCover,
          stockoutDate: adjustedStockoutDate,
          riskLevel: adjustedRisk,
        };
      })
      .filter((item) => {
        // Search filter
        if (search) {
          const s = search.toLowerCase();
          const matchSku = item.sku.toLowerCase().includes(s);
          const matchName = item.name.toLowerCase().includes(s);
          if (!matchSku && !matchName) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
          return false;
        }

        // Risk filter
        if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) {
          return false;
        }

        return true;
      });
  }, [rawRunway, demandMultiplier, horizonDays, search, selectedCategory, riskFilter]);

  // Format runway items for RunwayTimeline component
  const timelineItems: RunwayItem[] = React.useMemo(() => {
    return processedRunway.map((r) => ({
      skuId: r.productId,
      skuName: r.name,
      sku: r.sku,
      daysOfCover: r.daysOfCover,
      stockoutDate: r.stockoutDate,
      replenishmentDate: r.replenishmentDate,
      maxDays: horizonDays,
      riskLevel: r.riskLevel,
    }));
  }, [processedRunway, horizonDays]);

  // Summary Metrics computed from dynamic projection
  const metrics = React.useMemo(() => {
    const atRiskCount = processedRunway.filter((i) => i.daysOfCover <= horizonDays).length;
    const criticalCount = processedRunway.filter((i) => i.riskLevel === 'CRITICAL').length;
    const totalEstSpend = recommendations.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
    const avgCover = processedRunway.length
      ? Math.round((processedRunway.reduce((s, i) => s + i.daysOfCover, 0) / processedRunway.length) * 10) / 10
      : 0;

    return { atRiskCount, criticalCount, totalEstSpend, avgCover };
  }, [processedRunway, horizonDays, recommendations]);

  // Open Reorder Modal
  const openReorderModal = (rec: Recommendation) => {
    setSelectedRec(rec);
    const defaultSup = suppliers[0];
    const defaultWh = warehouses[0];
    const unitPrice = Math.round(rec.estimatedCost / (rec.suggestedQty || 1)) || 100;

    setReorderForm({
      supplierId: defaultSup?._id || '',
      warehouseId: defaultWh?._id || '',
      quantity: rec.suggestedQty || 100,
      unitPrice,
      expectedDeliveryDays: 7,
    });
    setReorderModalOpen(true);
  };

  // Authorize & Issue Purchase Order
  const handleConfirmReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRec) return;

    const supplier = suppliers.find((s) => s._id === reorderForm.supplierId) || suppliers[0];
    const warehouse = warehouses.find((w) => w._id === reorderForm.warehouseId) || warehouses[0];

    if (!supplier || !warehouse) {
      toast.error('Please ensure at least one Supplier and Warehouse exist before raising a PO.');
      return;
    }

    setSubmittingPO(true);
    try {
      const deliveryDate = new Date(Date.now() + reorderForm.expectedDeliveryDays * 86400000)
        .toISOString()
        .split('T')[0];

      await post('/procurement/pos', {
        supplierId: supplier._id,
        supplierName: supplier.name,
        warehouseId: warehouse._id,
        warehouseName: warehouse.name,
        expectedDeliveryDate: deliveryDate,
        items: [
          {
            productId: selectedRec.productId,
            sku: selectedRec.sku,
            productName: selectedRec.productName,
            quantityOrdered: reorderForm.quantity,
            unitPrice: reorderForm.unitPrice,
            gstRate: 18,
          },
        ],
        notes: `Authorized via Forecast Lab. Projected stockout runway recommendation: ${selectedRec.why}`,
      });

      setReorderModalOpen(false);
      toast.success(
        `Draft PO Issued: ${selectedRec.productName}`,
        'The purchase order has been generated and queued in Procurement for approval.'
      );
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to authorize Purchase Order');
    } finally {
      setSubmittingPO(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink">Forecasting & Runway Lab</h1>
            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold text-2xs uppercase tracking-wide">
              Adaptive Horizon
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Dynamic stockout runway projection, customized calendar timeline horizon & 1-click PO draft generation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ExternalLink className="w-4 h-4" />}
            onClick={() => navigate('/app/simulator')}
          >
            Run Stress Simulator
          </Button>
          <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>
            Refresh Forecast
          </Button>
        </div>
      </div>

      {/* ── Dynamic Horizon & Scenario Control Card ── */}
      <div className="border border-border rounded-lg bg-surface p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
          {/* Horizon Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink flex items-center gap-1.5 uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              Forecast Horizon Window
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_HORIZONS.map((preset) => (
                <button
                  key={preset.days}
                  type="button"
                  onClick={() => handleSelectPreset(preset.days)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    horizonDays === preset.days
                      ? 'bg-accent text-white shadow-xs'
                      : 'border border-border bg-surface-raised text-ink hover:border-border-strong hover:bg-surface-overlay'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Picker */}
          <div className="flex items-center gap-3">
            <div>
              <label className="text-2xs font-semibold text-ink-muted block mb-1 uppercase tracking-wide">
                Custom Target Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={handleDateChange}
                  className="h-8 px-2.5 text-xs font-mono border border-border rounded bg-surface-raised text-ink focus:outline-accent"
                />
                <span className="text-2xs font-mono font-semibold text-accent px-2 py-1 rounded bg-accent/10">
                  {horizonDays} days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Burn Rate Demand Multiplier & Active Filtering */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-end">
          {/* Demand Surge Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-ink">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-accent" />
                Consumption Burn-Rate Stress
              </span>
              <span className="font-mono font-semibold text-accent">{demandMultiplier}x Rate</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.25"
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-2xs text-ink-faint">
              <span>0.5x Slowdown</span>
              <span>1.0x Normal</span>
              <span>1.5x Surge</span>
              <span>2.0x Spike</span>
            </div>
          </div>

          {/* Search SKU */}
          <div className="space-y-1">
            <label className="text-2xs font-semibold text-ink-muted uppercase">Search SKU or Product</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter by SKU or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-xs border border-border rounded bg-surface-raised text-ink focus:outline-accent"
              />
            </div>
          </div>

          {/* Category & Risk Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-2xs font-semibold text-ink-muted uppercase block mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-border rounded bg-surface-raised text-ink focus:outline-accent"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-2xs font-semibold text-ink-muted uppercase block mb-1">Risk Horizon</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-border rounded bg-surface-raised text-ink focus:outline-accent"
              >
                <option value="ALL">All Levels</option>
                <option value="CRITICAL">Critical (&le;3d)</option>
                <option value="WARNING">Warning</option>
                <option value="LOW">Healthy</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Metric Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-2xs text-ink-muted uppercase font-semibold block">Stockouts in Next {horizonDays}d</span>
          <div className="font-mono text-2xl font-bold text-critical mt-1">{metrics.atRiskCount} SKUs</div>
          <span className="text-2xs text-ink-muted">
            {metrics.criticalCount} requiring emergency replenishment
          </span>
        </div>

        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-2xs text-ink-muted uppercase font-semibold block">Estimated Replenish Capital</span>
          <div className="font-mono text-2xl font-bold text-ink mt-1">{formatINR(metrics.totalEstSpend)}</div>
          <span className="text-2xs text-healthy">For prioritized reorder drafts</span>
        </div>

        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-2xs text-ink-muted uppercase font-semibold block">Average Catalog Cover</span>
          <div className="font-mono text-2xl font-bold text-accent mt-1">{metrics.avgCover} Days</div>
          <span className="text-2xs text-ink-muted">Across all active warehouse hubs</span>
        </div>

        <div className="border border-border rounded-lg bg-surface p-4">
          <span className="text-2xs text-ink-muted uppercase font-semibold block">Actionable Recommendations</span>
          <div className="font-mono text-2xl font-bold text-ink mt-1">{recommendations.length} Orders</div>
          <span className="text-2xs text-accent">Ready for 1-click PO draft</span>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-ink-muted border border-border rounded bg-surface">
          Simulating dynamic stockout runway horizon...
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Stock Runway Timeline Component ── */}
          <div className="border border-border rounded-lg bg-surface p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 gap-2">
              <div>
                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <span>Stock Runway Timeline Projection — Horizon: Next {horizonDays} Days</span>
                  <span className="text-2xs font-normal text-ink-muted font-mono">
                    (Until {new Date(customDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })})
                  </span>
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Visual burn projection based on current on-hand stock and {demandMultiplier}x consumption burn-rate
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-accent px-2 py-0.5 rounded bg-accent/10">
                {timelineItems.length} SKUs Monitored
              </span>
            </div>

            <RunwayTimeline items={timelineItems} horizonDays={horizonDays} />
          </div>

          {/* ── Prioritized Reorder Recommendations ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Prioritized Reorder Recommendations ({recommendations.length})
              </h2>
              <span className="text-2xs text-ink-muted">
                Every action directly links to PO drafting with 3-way matching
              </span>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border border-border rounded-lg bg-surface overflow-hidden hover:border-border-strong transition-all">
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={rec.severity} />
                        <span className="font-mono text-2xs font-bold text-accent bg-surface-overlay px-1.5 py-0.5 rounded">
                          {rec.sku}
                        </span>
                      </div>
                      <h3 className="font-medium text-sm text-ink">{rec.what}</h3>
                      <p className="text-xs text-ink-muted">{rec.why}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-2xs text-ink-faint uppercase font-semibold block">Est. Cost</span>
                        <span className="font-mono text-sm font-bold text-ink">{formatINR(rec.estimatedCost)}</span>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle className="w-4 h-4" />}
                        onClick={() => openReorderModal(rec)}
                      >
                        Authorize & Draft PO
                      </Button>
                    </div>
                  </div>

                  {/* Evidence & Impact Footer */}
                  <div className="px-4 py-3 bg-surface-raised border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-2xs uppercase tracking-wider text-ink-faint font-semibold block mb-0.5">
                        Supply Chain Evidence
                      </span>
                      <p className="text-ink-muted">{rec.evidence}</p>
                    </div>
                    <div>
                      <span className="text-2xs uppercase tracking-wider text-healthy font-semibold block mb-0.5">
                        Operational Impact
                      </span>
                      <p className="text-healthy font-medium">{rec.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Reorder Confirmation Modal ── */}
      <Dialog
        open={reorderModalOpen}
        onClose={() => setReorderModalOpen(false)}
        title={selectedRec ? `Authorize Purchase Order: ${selectedRec.productName}` : 'Raise Purchase Order'}
      >
        {selectedRec && (
          <form onSubmit={handleConfirmReorder} className="space-y-4">
            <div className="p-3 bg-surface-raised border border-border rounded text-xs space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-ink-muted">SKU:</span>
                <span className="font-bold text-accent">{selectedRec.sku}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Product:</span>
                <span className="font-medium text-ink">{selectedRec.productName}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Target Fulfillment Hub</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={reorderForm.warehouseId}
                onChange={(e) => setReorderForm({ ...reorderForm, warehouseId: e.target.value })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink mb-1">Assigned Vendor / Supplier</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={reorderForm.supplierId}
                onChange={(e) => setReorderForm({ ...reorderForm, supplierId: e.target.value })}
                required
              >
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Order Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={reorderForm.quantity}
                  onChange={(e) => setReorderForm({ ...reorderForm, quantity: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Unit Price (₹)</label>
                <Input
                  type="number"
                  min="1"
                  value={reorderForm.unitPrice}
                  onChange={(e) => setReorderForm({ ...reorderForm, unitPrice: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Price Breakdown Calculation */}
            <div className="p-3 border border-border rounded bg-surface-raised text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-ink-muted">
                <span>Subtotal:</span>
                <span>{formatINR(reorderForm.quantity * reorderForm.unitPrice)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>GST (18%):</span>
                <span>{formatINR((reorderForm.quantity * reorderForm.unitPrice * 18) / 100)}</span>
              </div>
              <div className="flex justify-between font-bold text-ink pt-1.5 border-t border-border">
                <span>Total PO Valuation:</span>
                <span>{formatINR(reorderForm.quantity * reorderForm.unitPrice * 1.18)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setReorderModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={submittingPO}
                icon={<ShoppingCart className="w-4 h-4" />}
              >
                Authorize & Send to Procurement
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
