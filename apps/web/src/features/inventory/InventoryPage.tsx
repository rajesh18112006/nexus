import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge, SeverityBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { Plus, Search, Filter, RefreshCw, ArrowLeftRight, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ProductItem {
  _id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  minStockLevel: number;
  reorderPoint: number;
  status: string;
  totalStock?: number;
}

interface Warehouse {
  _id: string;
  code: string;
  name: string;
}

export function InventoryPage() {
  const navigate = useNavigate();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  
  // Modals
  const [adjustModalOpen, setAdjustModalOpen] = React.useState(false);
  const [transferModalOpen, setTransferModalOpen] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<ProductItem | null>(null);

  // Form states
  const [adjustData, setAdjustData] = React.useState({
    warehouseId: '',
    adjustmentType: 'IN' as 'IN' | 'OUT' | 'SET',
    quantity: 10,
    reason: 'CYCLE_COUNT' as 'CYCLE_COUNT' | 'DAMAGE' | 'EXPIRY' | 'DISCREPANCY' | 'RECEIPT_CORRECTION' | 'OTHER',
    notes: '',
  });
  const [transferData, setTransferData] = React.useState({
    productId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: 10,
    notes: '',
  });
  const [createProductData, setCreateProductData] = React.useState({
    sku: '', name: '', category: 'ELECTRONICS', unit: 'PCS', unitCost: 100, sellingPrice: 150, minStockLevel: 20, reorderPoint: 50, leadTimeDays: 7, gstRate: 18, hsnCode: '85423100'
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, whRes] = await Promise.all([
        get<any>('/products'),
        get<any>('/warehouses'),
      ]);
      const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.data || prodRes?.products || []);
      const whList = Array.isArray(whRes) ? whRes : (whRes?.data || whRes?.warehouses || []);
      setProducts(Array.isArray(prodList) ? prodList : []);
      setWarehouses(Array.isArray(whList) ? whList : []);

      if (whList.length > 0 && !adjustData.warehouseId) {
        setAdjustData((prev) => ({ ...prev, warehouseId: whList[0]._id }));
      }
      if (whList.length >= 2 && !transferData.fromWarehouseId) {
        setTransferData((prev) => ({ ...prev, fromWarehouseId: whList[0]._id, toWarehouseId: whList[1]._id }));
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const targetWhId = adjustData.warehouseId || warehouses[0]?._id;
    if (!targetWhId) return;

    try {
      await post('/inventory/adjustments', {
        productId: selectedProduct._id,
        warehouseId: targetWhId,
        adjustmentType: adjustData.adjustmentType,
        quantity: Number(adjustData.quantity),
        reason: adjustData.reason,
        notes: adjustData.notes || `Stock adjustment for ${selectedProduct.sku}`,
      });
      setAdjustModalOpen(false);
      toast.success(`Successfully adjusted stock for ${selectedProduct.sku}`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const handleTransferStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const prodId = transferData.productId || products[0]?._id;
    const fromWh = transferData.fromWarehouseId || warehouses[0]?._id;
    const toWh = transferData.toWarehouseId || warehouses[1]?._id;

    if (!prodId || !fromWh || !toWh) {
      toast.error('Please select both warehouses and a product');
      return;
    }
    if (fromWh === toWh) {
      toast.error('Source and destination warehouse cannot be the same');
      return;
    }

    try {
      await post('/inventory/transfer', {
        productId: prodId,
        fromWarehouseId: fromWh,
        toWarehouseId: toWh,
        quantity: Number(transferData.quantity),
        notes: transferData.notes || 'Inter-facility inventory transfer',
      });
      setTransferModalOpen(false);
      toast.success(`Transfer initiated successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to transfer stock');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await post('/products', createProductData);
      setCreateModalOpen(false);
      toast.success(`Registered new SKU: ${createProductData.sku.toUpperCase()}`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create product SKU');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Inventory Ledger & SKUs</h1>
          <p className="text-xs text-ink-muted mt-1">Real-time stock levels across 5 regional logistics hubs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>
            Refresh
          </Button>
          <Button variant="secondary" size="sm" icon={<ArrowLeftRight className="w-4 h-4" />} onClick={() => setTransferModalOpen(true)}>
            Stock Transfer
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setCreateModalOpen(true)}>
            New SKU
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-border rounded bg-surface">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search by SKU or product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <select
            className="h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink focus:outline-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="text-xs text-ink-muted">
          Showing <span className="font-semibold text-ink">{filteredProducts.length}</span> of {products.length} SKUs
        </div>
      </div>

      {/* SKUs Table */}
      <div className="border border-border rounded bg-surface overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-ink-muted">Loading inventory ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50 text-ink-muted uppercase tracking-wider text-2xs font-semibold">
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Min Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Point</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p._id} className="hover:bg-surface-raised/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-ink">{p.sku}</td>
                    <td className="py-3 px-4 font-medium text-ink max-w-xs truncate">{p.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-surface-overlay text-ink-muted text-2xs uppercase tracking-wide">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-ink">{formatINR(p.unitCost)}</td>
                    <td className="py-3 px-4 text-right font-mono text-ink">{formatINR(p.sellingPrice)}</td>
                    <td className="py-3 px-4 text-center font-mono text-ink-muted">{p.minStockLevel}</td>
                    <td className="py-3 px-4 text-center font-mono text-ink-muted">{p.reorderPoint}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setSelectedProduct(p);
                            setAdjustData({ ...adjustData, warehouseId: warehouses[0]?._id || '' });
                            setAdjustModalOpen(true);
                          }}
                        >
                          Adjust
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => navigate('/app/forecasting')}
                          title="View dynamic runway in Forecast Lab"
                        >
                          Runway &rarr;
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Dialog open={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title={`Stock Adjustment — ${selectedProduct?.sku}`}>
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Target Warehouse</label>
            <select
              className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
              value={adjustData.warehouseId}
              onChange={(e) => setAdjustData({ ...adjustData, warehouseId: e.target.value })}
              required
            >
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Adjustment Action</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={adjustData.adjustmentType}
                onChange={(e) => setAdjustData({ ...adjustData, adjustmentType: e.target.value as any })}
              >
                <option value="IN">Add Units (+ IN)</option>
                <option value="OUT">Deduct Units (- OUT)</option>
                <option value="SET">Set Count (= Exact)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Reason</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value as any })}
              >
                <option value="CYCLE_COUNT">Cycle Count</option>
                <option value="DAMAGE">Damaged Goods</option>
                <option value="EXPIRY">Expired Material</option>
                <option value="DISCREPANCY">Discrepancy Correction</option>
                <option value="RECEIPT_CORRECTION">Receipt Correction</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Quantity</label>
            <Input
              type="number"
              min="1"
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Notes / Audit Justification</label>
            <Input
              type="text"
              placeholder="e.g. Physical audit verification..."
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setAdjustModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Confirm Adjustment</Button>
          </div>
        </form>
      </Dialog>

      {/* Stock Transfer Modal */}
      <Dialog open={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Inter-Warehouse Stock Transfer">
        <form onSubmit={handleTransferStock} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Select Product / SKU</label>
            <select
              className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
              value={transferData.productId || products[0]?._id}
              onChange={(e) => setTransferData({ ...transferData, productId: e.target.value })}
              required
            >
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.sku} — {p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Source Facility</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={transferData.fromWarehouseId || warehouses[0]?._id}
                onChange={(e) => setTransferData({ ...transferData, fromWarehouseId: e.target.value })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Destination Facility</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={transferData.toWarehouseId || warehouses[1]?._id}
                onChange={(e) => setTransferData({ ...transferData, toWarehouseId: e.target.value })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Quantity to Transfer</label>
            <Input
              type="number"
              min="1"
              value={transferData.quantity}
              onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink mb-1">Transfer Note / Tracking</label>
            <Input
              type="text"
              placeholder="e.g. Replenishment transfer for regional orders..."
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setTransferModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Initiate Transfer</Button>
          </div>
        </form>
      </Dialog>

      {/* Create SKU Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Register New SKU">
        <form onSubmit={handleCreateProduct} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">SKU Code</label>
              <Input required value={createProductData.sku} onChange={(e) => setCreateProductData({ ...createProductData, sku: e.target.value })} placeholder="MCU-32-NEW" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Product Name</label>
              <Input required value={createProductData.name} onChange={(e) => setCreateProductData({ ...createProductData, name: e.target.value })} placeholder="Microcontroller Component" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Category</label>
              <select className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink" value={createProductData.category} onChange={(e) => setCreateProductData({ ...createProductData, category: e.target.value })}>
                <option value="ELECTRONICS">ELECTRONICS</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="COMPONENTS">COMPONENTS</option>
                <option value="PACKAGING">PACKAGING</option>
                <option value="RAW_MATERIALS">RAW_MATERIALS</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Unit Price (Cost ₹)</label>
              <Input type="number" required value={createProductData.unitCost} onChange={(e) => setCreateProductData({ ...createProductData, unitCost: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Create SKU</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
