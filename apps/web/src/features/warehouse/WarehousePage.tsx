import * as React from 'react';
import { get } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Warehouse, Layers, MapPin, Box, Cpu, AlertCircle, ArrowUpRight } from 'lucide-react';

interface WarehouseHub {
  _id: string;
  code: string;
  name: string;
  type: string;
  capacityVolumeSqFt: number;
  maxPallets: number;
  currentOccupancyPallets: number;
  status: string;
  zones?: Array<{
    code: string;
    name: string;
    type: string;
    capacityUnits: number;
    currentOccupancyUnits: number;
  }>;
}

export function WarehousePage() {
  const [hubs, setHubs] = React.useState<WarehouseHub[]>([]);
  const [selectedHub, setSelectedHub] = React.useState<WarehouseHub | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchWarehouses = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<any>('/warehouses');
      const hubsList = Array.isArray(res) ? res : (res?.data || res?.warehouses || []);
      setHubs(hubsList);
      if (hubsList.length > 0) {
        setSelectedHub(hubsList[0]);
      }
    } catch (err) {
      console.error('Failed to load warehouses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Warehouse & Logistics Network</h1>
        <p className="text-xs text-ink-muted mt-1">Multi-facility storage occupancy, high-bay zone utilization & bin layout</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-ink-muted border border-border rounded bg-surface">Loading warehouse network...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Facility List Sidebar */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted px-1">Logistics Facilities</h2>
            <div className="space-y-2">
              {hubs.map((hub) => {
                const occupancyPct = Math.round((hub.currentOccupancyPallets / hub.maxPallets) * 100);
                const isSelected = selectedHub?._id === hub._id;

                return (
                  <div
                    key={hub._id}
                    onClick={() => setSelectedHub(hub)}
                    className={`p-4 border rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent bg-surface-raised shadow-sm'
                        : 'border-border bg-surface hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-surface-overlay text-ink-muted">{hub.code}</span>
                      <span className={`text-2xs font-semibold ${occupancyPct > 85 ? 'text-critical' : occupancyPct > 70 ? 'text-warning' : 'text-healthy'}`}>
                        {occupancyPct}% Occupied
                      </span>
                    </div>
                    <h3 className="font-medium text-sm text-ink mt-2">{hub.name}</h3>
                    <div className="mt-3 space-y-1">
                      <div className="w-full h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${occupancyPct > 85 ? 'bg-critical' : occupancyPct > 70 ? 'bg-warning' : 'bg-healthy'}`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-2xs text-ink-muted font-mono pt-0.5">
                        <span>{hub.currentOccupancyPallets.toLocaleString()} pallets</span>
                        <span>Capacity: {hub.maxPallets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Zone Map View */}
          <div className="lg:col-span-2 space-y-4">
            {selectedHub && (
              <div className="border border-border rounded bg-surface p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">{selectedHub.name}</h2>
                    <p className="text-xs text-ink-muted mt-0.5">Facility Type: {selectedHub.type.replace('_', ' ')} · Volume: {selectedHub.capacityVolumeSqFt.toLocaleString()} sq ft</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xs text-ink-faint uppercase block">Total Occupancy</span>
                    <span className="font-mono text-lg font-bold text-ink">
                      {Math.round((selectedHub.currentOccupancyPallets / selectedHub.maxPallets) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Visual Zone Layout Map */}
                <div>
                  <h3 className="text-xs font-semibold text-ink mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    Interactive Facility Zone Layout
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Receiving Zone */}
                    <div className="border border-border/80 rounded p-4 bg-surface-raised space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-wider text-accent">Zone R-01</span>
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-healthy/10 text-healthy font-semibold">Active</span>
                      </div>
                      <h4 className="text-xs font-semibold text-ink">Receiving & Inbound Dock</h4>
                      <div className="h-16 border border-dashed border-border rounded flex items-center justify-center text-ink-muted text-2xs font-mono">
                        1,000 Units Capacity
                      </div>
                      <p className="text-2xs text-ink-muted">Dock Doors 1-4 · Unloading Active</p>
                    </div>

                    {/* High Bay Storage */}
                    <div className="md:col-span-2 border border-accent/40 rounded p-4 bg-accent/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-wider text-accent">Zone S-02</span>
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-warning/10 text-warning font-semibold">76% Utilization</span>
                      </div>
                      <h4 className="text-xs font-semibold text-ink">High-Bay Automated Racking</h4>
                      <div className="grid grid-cols-4 gap-1.5 h-16 pt-1">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className={`rounded border text-center flex items-center justify-center font-mono text-3xs ${
                              i % 3 === 0 ? 'bg-critical/20 border-critical/40 text-critical font-bold' : 'bg-surface-raised border-border text-ink-muted'
                            }`}
                          >
                            Rack {i + 1}
                          </div>
                        ))}
                      </div>
                      <p className="text-2xs text-ink-muted">Aisle A1 to A8 · 50,000 Storage Bins</p>
                    </div>

                    {/* Picking Zone */}
                    <div className="md:col-span-2 border border-border/80 rounded p-4 bg-surface-raised space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-wider text-accent">Zone P-03</span>
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-healthy/10 text-healthy font-semibold">Fast Pick</span>
                      </div>
                      <h4 className="text-xs font-semibold text-ink">Fast-Fulfillment Pick Area</h4>
                      <div className="h-14 border border-border rounded bg-surface p-2 flex items-center justify-between text-2xs font-mono">
                        <span>Active Pick Wave #842</span>
                        <span className="text-healthy font-bold">120 Order Lines</span>
                      </div>
                    </div>

                    {/* Packing & Dispatch */}
                    <div className="border border-border/80 rounded p-4 bg-surface-raised space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-wider text-accent">Zone D-04</span>
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-healthy/10 text-healthy font-semibold">Dispatch</span>
                      </div>
                      <h4 className="text-xs font-semibold text-ink">Packing & Staging</h4>
                      <div className="h-14 border border-dashed border-border rounded flex items-center justify-center text-ink-muted text-2xs font-mono">
                        Ready for Freight Load
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
