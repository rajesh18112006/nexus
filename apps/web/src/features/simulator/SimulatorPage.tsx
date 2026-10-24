import * as React from 'react';
import { post } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Sliders, AlertTriangle, TrendingUp, DollarSign, Activity, Play } from 'lucide-react';

interface SimulationResult {
  parameters: {
    leadTimeIncreaseDays: number;
    demandSurgePercent: number;
    priceInflationPercent: number;
  };
  summary: {
    totalSkusAnalyzed: number;
    baselineStockouts: number;
    simulatedStockouts: number;
    additionalStockoutSkus: number;
    totalFinancialRiskINR: number;
  };
  affectedSKUs: Array<{
    sku: string;
    name: string;
    category: string;
    currentStock: number;
    baselineDaysCover: number;
    simulatedDaysCover: number;
    stockoutRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedCostIncrease: number;
  }>;
}

export function SimulatorPage() {
  const [params, setParams] = React.useState({
    leadTimeIncreaseDays: 5,
    demandSurgePercent: 25,
    priceInflationPercent: 10,
  });

  const [result, setResult] = React.useState<SimulationResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const runSimulation = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await post<SimulationResult>('/simulator', params);
      setResult(res);
    } catch (err) {
      console.error('Simulation run failed:', err);
    } finally {
      setLoading(false);
    }
  }, [params]);

  React.useEffect(() => {
    runSimulation();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Supply Chain Risk Simulator</h1>
        <p className="text-xs text-ink-muted mt-1">Stress-test inventory resilience under lead time delays, demand spikes & price inflation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Card */}
        <div className="border border-border rounded bg-surface p-5 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent" />
            Simulation Parameters
          </h2>

          {/* Lead time delay slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-ink">
              <span>Supplier Lead Time Delay</span>
              <span className="font-mono text-accent">+{params.leadTimeIncreaseDays} days</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={params.leadTimeIncreaseDays}
              onChange={(e) => setParams({ ...params, leadTimeIncreaseDays: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>

          {/* Demand Surge Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-ink">
              <span>Demand Surge</span>
              <span className="font-mono text-accent">+{params.demandSurgePercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={params.demandSurgePercent}
              onChange={(e) => setParams({ ...params, demandSurgePercent: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>

          {/* Inflation Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-ink">
              <span>Raw Material Price Inflation</span>
              <span className="font-mono text-accent">+{params.priceInflationPercent}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={params.priceInflationPercent}
              onChange={(e) => setParams({ ...params, priceInflationPercent: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>

          <Button variant="primary" className="w-full" icon={<Play className="w-4 h-4" />} onClick={runSimulation} disabled={loading}>
            {loading ? 'Running Simulation...' : 'Execute Stress Test'}
          </Button>
        </div>

        {/* Results Overview */}
        <div className="lg:col-span-2 space-y-6">
          {result && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-border rounded bg-surface p-4">
                  <span className="text-2xs text-ink-muted uppercase font-semibold block">Simulated Stockouts</span>
                  <div className="font-mono text-2xl font-bold text-critical mt-1">{result.summary.simulatedStockouts} SKUs</div>
                  <span className="text-2xs text-critical">+{result.summary.additionalStockoutSkus} additional vs baseline</span>
                </div>
                <div className="border border-border rounded bg-surface p-4">
                  <span className="text-2xs text-ink-muted uppercase font-semibold block">Projected Financial Risk</span>
                  <div className="font-mono text-2xl font-bold text-ink mt-1">{formatINR(result.summary.totalFinancialRiskINR)}</div>
                  <span className="text-2xs text-ink-muted">Potential lost sales value</span>
                </div>
                <div className="border border-border rounded bg-surface p-4">
                  <span className="text-2xs text-ink-muted uppercase font-semibold block">SKUs Stress Tested</span>
                  <div className="font-mono text-2xl font-bold text-accent mt-1">{result.summary.totalSkusAnalyzed}</div>
                  <span className="text-2xs text-healthy">Across active catalogue</span>
                </div>
              </div>

              {/* Affected SKUs Table */}
              <div className="border border-border rounded bg-surface overflow-hidden">
                <div className="p-4 border-b border-border font-semibold text-xs text-ink">Disruption Impact breakdown by SKU</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised/50 text-ink-muted uppercase tracking-wider text-2xs font-semibold">
                        <th className="py-2.5 px-4">SKU</th>
                        <th className="py-2.5 px-4">Product Name</th>
                        <th className="py-2.5 px-4 text-center">Baseline Cover</th>
                        <th className="py-2.5 px-4 text-center">Simulated Cover</th>
                        <th className="py-2.5 px-4 text-center">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {result.affectedSKUs.slice(0, 10).map((sku) => (
                        <tr key={sku.sku} className="hover:bg-surface-raised/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-ink">{sku.sku}</td>
                          <td className="py-3 px-4 font-medium text-ink">{sku.name}</td>
                          <td className="py-3 px-4 text-center font-mono text-ink-muted">{sku.baselineDaysCover}d</td>
                          <td className={`py-3 px-4 text-center font-mono font-bold ${sku.simulatedDaysCover <= 3 ? 'text-critical' : 'text-warning'}`}>
                            {sku.simulatedDaysCover}d
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-2xs font-semibold uppercase ${
                              sku.stockoutRisk === 'HIGH' ? 'bg-critical/10 text-critical' : 'bg-warning/10 text-warning'
                            }`}>
                              {sku.stockoutRisk}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
