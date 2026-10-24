import * as React from 'react';
import { get, post } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { Plus, Star, Phone, Mail, MapPin, ShieldCheck, Clock } from 'lucide-react';

interface Supplier {
  _id: string;
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstin?: string;
  paymentTerms: string;
  leadTimeDays: number;
  rating: number;
  status: string;
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  const [form, setForm] = React.useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    gstin: '',
    paymentTerms: 'Net 30',
    leadTimeDays: 7,
    rating: 4.5,
  });

  const fetchSuppliers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<any>('/suppliers');
      const list = Array.isArray(res) ? res : (res?.data || res?.suppliers || []);
      setSuppliers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await post('/suppliers', form);
      setModalOpen(false);
      toast.success(`Successfully registered supplier: ${form.name}`);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to register supplier');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Supplier Performance Directory</h1>
          <p className="text-xs text-ink-muted mt-1">Vendor reliability scorecards, lead time historical tracking & GSTIN validation</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
          Register Supplier
        </Button>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-ink-muted border border-border rounded bg-surface">Loading supplier directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup._id} className="border border-border rounded bg-surface p-5 space-y-4 hover:border-accent/50 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-surface-overlay text-ink-muted">{sup.code}</span>
                    <Badge variant={sup.status === 'ACTIVE' ? 'healthy' : 'muted'} size="xs">{sup.status}</Badge>
                  </div>
                  <h3 className="font-medium text-sm text-ink mt-1.5">{sup.name}</h3>
                </div>
                <div className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-0.5 rounded text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{sup.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-ink-muted pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                  <span className="truncate">{sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                  <span>{sup.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                  <span>Lead Time: <strong className="text-ink font-mono">{sup.leadTimeDays} days</strong> ({sup.paymentTerms})</span>
                </div>
              </div>

              {sup.gstin && (
                <div className="flex items-center justify-between text-2xs pt-2 border-t border-border/40 text-ink-faint">
                  <span>GSTIN Registered</span>
                  <span className="font-mono font-medium text-ink">{sup.gstin}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Register Supplier Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} title="Register New Supplier">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Supplier Code</label>
              <Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUP-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Company Name</label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Logistics Ltd." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Contact Person</label>
              <Input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Rahul Verma" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Email</label>
              <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rahul@acme.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink mb-1">Phone Number</label>
              <Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink mb-1">GSTIN</label>
              <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} placeholder="27AAACV1234F1Z9" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit">Save Supplier</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
