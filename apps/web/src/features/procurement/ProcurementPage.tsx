import * as React from 'react';
import { get, post, patch } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge, POStatusBadge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import {
  Plus,
  ShoppingCart,
  CheckCircle,
  PackageCheck,
  Send,
  AlertTriangle,
  FileText,
  Trash2,
  ExternalLink,
  RefreshCw,
  Building2,
  Warehouse,
} from 'lucide-react';

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | 'REJECTED';
  expectedDeliveryDate: string;
  items: Array<{
    productId: string;
    sku: string;
    productName: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    gstRate: number;
    totalPrice: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
}

interface Supplier {
  _id: string;
  name: string;
  code: string;
}

interface WarehouseHub {
  _id: string;
  name: string;
  code: string;
}

interface ProductItem {
  _id: string;
  sku: string;
  name: string;
  unitCost: number;
  gstRate?: number;
}

interface POItemDraft {
  productId: string;
  sku: string;
  productName: string;
  quantityOrdered: number;
  unitPrice: number;
  gstRate: number;
}

export function ProcurementPage() {
  const [pos, setPos] = React.useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseHub[]>([]);
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusTab, setStatusTab] = React.useState<string>('ALL');

  // Modals
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [grnModalOpen, setGrnModalOpen] = React.useState(false);
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(null);

  // Form states
  const [poForm, setPoForm] = React.useState<{
    supplierId: string;
    warehouseId: string;
    expectedDeliveryDate: string;
    items: POItemDraft[];
  }>({
    supplierId: '',
    warehouseId: '',
    expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    items: [],
  });

  const [grnForm, setGrnForm] = React.useState({
    invoiceNumber: '',
    invoiceAmount: 0,
    acceptedQty: 100,
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [poRes, supRes, whRes, prodRes] = await Promise.all([
        get<any>('/procurement/pos'),
        get<any>('/suppliers'),
        get<any>('/warehouses'),
        get<any>('/products'),
      ]);

      const poList = Array.isArray(poRes) ? poRes : (poRes?.data || poRes?.purchaseOrders || []);
      const supList = Array.isArray(supRes) ? supRes : (supRes?.data || supRes?.suppliers || []);
      const whList = Array.isArray(whRes) ? whRes : (whRes?.data || whRes?.warehouses || []);
      const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.data || prodRes?.products || []);

      setPos(poList);
      setSuppliers(supList);
      setWarehouses(whList);
      setProducts(prodList);
    } catch (err) {
      console.error('Failed to load procurement data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create PO modal with sensible defaults from actual catalog
  const handleOpenCreateModal = () => {
    const defaultSup = suppliers[0];
    const defaultWh = warehouses[0];
    const firstProd = products[0];

    setPoForm({
      supplierId: defaultSup?._id || '',
      warehouseId: defaultWh?._id || '',
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: firstProd
        ? [
            {
              productId: firstProd._id,
              sku: firstProd.sku,
              productName: firstProd.name,
              quantityOrdered: 50,
              unitPrice: firstProd.unitCost || 100,
              gstRate: firstProd.gstRate || 18,
            },
          ]
        : [],
    });
    setCreateModalOpen(true);
  };

  // Add another item to the PO draft
  const handleAddItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setPoForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: firstProd._id,
          sku: firstProd.sku,
          productName: firstProd.name,
          quantityOrdered: 50,
          unitPrice: firstProd.unitCost || 100,
          gstRate: firstProd.gstRate || 18,
        },
      ],
    }));
  };

  // Remove item from PO draft
  const handleRemoveItem = (index: number) => {
    setPoForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Select product for a line item
  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;

    setPoForm((prev) => {
      const updated = [...prev.items];
      updated[index] = {
        ...updated[index],
        productId: prod._id,
        sku: prod.sku,
        productName: prod.name,
        unitPrice: prod.unitCost || 100,
        gstRate: prod.gstRate || 18,
      };
      return { ...prev, items: updated };
    });
  };

  const handleUpdateStatus = async (poId: string, status: string) => {
    try {
      await patch(`/procurement/pos/${poId}/status`, { status });
      toast.success(`Purchase order status updated to ${status}`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update PO status');
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.supplierId || !poForm.warehouseId || poForm.items.length === 0) {
      toast.error('Please configure supplier, destination hub and at least one item');
      return;
    }

    const selectedSup = suppliers.find((s) => s._id === poForm.supplierId);
    const selectedWh = warehouses.find((w) => w._id === poForm.warehouseId);

    try {
      await post('/procurement/pos', {
        supplierId: poForm.supplierId,
        supplierName: selectedSup?.name || 'Vendor',
        warehouseId: poForm.warehouseId,
        warehouseName: selectedWh?.name || 'Fulfillment Hub',
        expectedDeliveryDate: poForm.expectedDeliveryDate,
        items: poForm.items.map((it) => ({
          productId: it.productId,
          sku: it.sku,
          productName: it.productName,
          quantityOrdered: Number(it.quantityOrdered),
          unitPrice: Number(it.unitPrice),
          gstRate: Number(it.gstRate),
        })),
        notes: 'Issued via Procurement Manager Portal',
      });

      setCreateModalOpen(false);
      toast.success('Successfully issued new Purchase Order');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create Purchase Order');
    }
  };

  const handleOpenGRNModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const totalQty = po.items.reduce((s, it) => s + (it.quantityOrdered - (it.quantityReceived || 0)), 0);
    setGrnForm({
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceAmount: po.totalAmount,
      acceptedQty: totalQty > 0 ? totalQty : 1,
    });
    setGrnModalOpen(true);
  };

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    try {
      await post('/procurement/grn', {
        purchaseOrderId: selectedPO._id,
        warehouseId: selectedPO.warehouseId,
        invoiceNumber: grnForm.invoiceNumber,
        invoiceAmount: grnForm.invoiceAmount || selectedPO.totalAmount,
        items: selectedPO.items.map((item) => ({
          productId: item.productId,
          quantityReceived: grnForm.acceptedQty,
          quantityAccepted: grnForm.acceptedQty,
          quantityRejected: 0,
        })),
      });

      setGrnModalOpen(false);
      toast.success(
        'Goods Receipt Processed Successfully',
        'Stock levels have been credited to warehouse and logged in the inventory ledger.'
      );
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process Goods Receipt Note');
    }
  };

  // Draft calculations
  const draftSubtotal = poForm.items.reduce((sum, item) => sum + item.quantityOrdered * item.unitPrice, 0);
  const draftTax = (draftSubtotal * 18) / 100;
  const draftTotal = draftSubtotal + draftTax;

  const filteredPOs = pos.filter((po) => statusTab === 'ALL' || po.status === statusTab);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Procurement & PO Lifecycle</h1>
          <p className="text-xs text-ink-muted mt-1">
            Authoritative purchase orders, multi-item line creation, and automated 3-way GRN inventory posting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>
            Refresh Orders
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreateModal}>
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto">
        {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'RECEIVED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusTab(tab)}
            className={`px-4 py-2 border-b-2 font-medium capitalize transition-colors whitespace-nowrap ${
              statusTab === tab
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.toLowerCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── PO Table ── */}
      <div className="border border-border rounded-lg bg-surface overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-xs text-ink-muted">Loading purchase orders feed...</div>
        ) : filteredPOs.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-muted space-y-3">
            <p>No purchase orders matching '{statusTab}' status.</p>
            <Button variant="ghost" size="sm" onClick={handleOpenCreateModal}>
              Draft New Order
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50 text-ink-muted uppercase tracking-wider text-2xs font-semibold">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Destination Hub</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4 text-right">Items & Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPOs.map((po) => (
                  <tr key={po._id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-accent">{po.poNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-ink">{po.supplierName}</td>
                    <td className="py-3.5 px-4 text-ink-muted">{po.warehouseName}</td>
                    <td className="py-3.5 px-4 text-ink-muted font-mono">
                      {po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN') : 'TBD'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-ink block">{formatINR(po.totalAmount)}</span>
                      <span className="text-2xs text-ink-faint">
                        {po.items.length} SKU line{po.items.length > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <POStatusBadge status={po.status as any} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {po.status === 'DRAFT' && (
                          <Button variant="ghost" size="xs" onClick={() => handleUpdateStatus(po._id, 'SUBMITTED')}>
                            Submit
                          </Button>
                        )}
                        {po.status === 'SUBMITTED' && (
                          <Button variant="primary" size="xs" onClick={() => handleUpdateStatus(po._id, 'APPROVED')}>
                            Approve
                          </Button>
                        )}
                        {po.status === 'APPROVED' && (
                          <Button variant="ghost" size="xs" onClick={() => handleUpdateStatus(po._id, 'SENT')}>
                            Dispatch to Vendor
                          </Button>
                        )}
                        {(po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED') && (
                          <Button
                            variant="primary"
                            size="xs"
                            icon={<PackageCheck className="w-3.5 h-3.5" />}
                            onClick={() => handleOpenGRNModal(po)}
                          >
                            Receive GRN
                          </Button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <span className="text-2xs text-healthy font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Stock Posted
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create PO Modal (Real Multi-Item Product Selection) ── */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Purchase Order">
        <form onSubmit={handleCreatePO} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Select Supplier</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={poForm.supplierId}
                onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                required
              >
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Destination Fulfillment Hub</label>
              <select
                className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink"
                value={poForm.warehouseId}
                onChange={(e) => setPoForm({ ...poForm, warehouseId: e.target.value })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Expected Delivery Date</label>
            <input
              type="date"
              className="w-full h-9 px-3 border border-border rounded text-xs bg-surface-raised text-ink font-mono"
              value={poForm.expectedDeliveryDate}
              onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
              required
            />
          </div>

          {/* Line Items Section */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink uppercase tracking-wide">
                Purchase Order Line Items
              </label>
              <Button type="button" variant="ghost" size="xs" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddItem}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {poForm.items.map((item, idx) => (
                <div key={idx} className="p-3 border border-border rounded bg-surface-raised space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <label className="block text-2xs font-medium text-ink-muted mb-0.5">Select Product from Catalog</label>
                      <select
                        className="w-full h-8 px-2 border border-border rounded text-xs bg-surface text-ink"
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        required
                      >
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.sku}) — ₹{p.unitCost}
                          </option>
                        ))}
                      </select>
                    </div>
                    {poForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-critical hover:text-critical/80 mt-4 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-2xs font-medium text-ink-muted mb-0.5">Quantity Ordered</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantityOrdered}
                        onChange={(e) => {
                          const updated = [...poForm.items];
                          updated[idx].quantityOrdered = Number(e.target.value);
                          setPoForm({ ...poForm, items: updated });
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-medium text-ink-muted mb-0.5">Unit Price (₹)</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const updated = [...poForm.items];
                          updated[idx].unitPrice = Number(e.target.value);
                          setPoForm({ ...poForm, items: updated });
                        }}
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="p-3 border border-border rounded bg-surface-raised text-xs space-y-1 font-mono">
            <div className="flex justify-between text-ink-muted">
              <span>Subtotal:</span>
              <span>{formatINR(draftSubtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>GST (18%):</span>
              <span>{formatINR(draftTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink pt-1 border-t border-border">
              <span>Total PO Value:</span>
              <span>{formatINR(draftTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<ShoppingCart className="w-4 h-4" />}>
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ── GRN Receipt Modal (3-Way Matching & Stock Posting) ── */}
      <Dialog open={grnModalOpen} onClose={() => setGrnModalOpen(false)} title="Process Goods Receipt Note (GRN)">
        <form onSubmit={handleCreateGRN} className="space-y-4">
          {selectedPO && (
            <div className="p-3 border border-border rounded bg-surface-raised text-xs space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-ink-muted">Purchase Order:</span>
                <span className="font-bold text-accent">{selectedPO.poNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Supplier:</span>
                <span className="font-medium text-ink">{selectedPO.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Receiving Hub:</span>
                <span className="font-medium text-ink">{selectedPO.warehouseName}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink mb-1">Supplier Tax Invoice Number</label>
            <Input
              type="text"
              required
              placeholder="e.g. INV-2024-8841"
              value={grnForm.invoiceNumber}
              onChange={(e) => setGrnForm({ ...grnForm, invoiceNumber: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Accepted Inward Quantity</label>
              <Input
                type="number"
                min="1"
                required
                value={grnForm.acceptedQty}
                onChange={(e) => setGrnForm({ ...grnForm, acceptedQty: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Invoice Total Amount (₹)</label>
              <Input
                type="number"
                min="0"
                required
                value={grnForm.invoiceAmount}
                onChange={(e) => setGrnForm({ ...grnForm, invoiceAmount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="p-3 border border-healthy/40 rounded bg-healthy/10 text-xs text-healthy flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Automated 3-Way Reconciliation</span>
              <p className="text-2xs opacity-90 mt-0.5">
                Posting this GRN will automatically credit the inventory balance at {selectedPO?.warehouseName} and write an immutable audit entry into the stock movement ledger.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setGrnModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" icon={<PackageCheck className="w-4 h-4" />}>
              Confirm GRN & Post Stock
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
