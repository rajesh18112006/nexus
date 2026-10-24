import * as React from 'react';
import { get } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { DollarSign, PieChart, TrendingUp, Layers, RefreshCw } from 'lucide-react';

interface ABCData {
  grandTotalValuation: number;
  summary: {
    classA: { count: number; value: number; percentage: number };
    classB: { count: number; value: number; percentage: number };
    classC: { count: number; value: number; percentage: number };
  };
  items: Array<{
    productId: string;
    sku: string;
    name: string;
    category: string;
    totalQuantity: number;
    unitCost: number;
    totalValue: number;
    cumulativePercentage: number;
    categoryClass: 'A' | 'B' | 'C';
  }>;
}

export function CostPage() {
  const [data, setData] = React.useState<ABCData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchABC = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await get<ABCData>('/cost/abc');
      setData(res);
    } catch (err) {
      console.error('Failed to load ABC analysis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchABC();
  }, [fetchABC]);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Inventory Valuation & ABC Analysis</h1>
          <p className="text-xs text-ink-muted mt-1">Pareto 80/20 inventory classification, total asset valuation & capital allocation</p>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchABC}>
          Recalculate
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-ink-muted border border-border rounded bg-surface">Computing ABC valuation matrix...</div>
      ) : (
        data && (
          <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-border rounded bg-surface p-5 space-y-2">
                <span className="text-2xs text-ink-muted uppercase font-semibold block">Grand Inventory Asset Value</span>
                <div className="font-mono text-2xl font-bold text-ink">{formatINR(data.grandTotalValuation)}</div>
                <span className="text-2xs text-healthy font-semibold">Calculated across 5 hubs</span>
              </div>
              <div className="border border-border rounded bg-surface p-5 space-y-2">
                <span className="text-2xs text-ink-muted uppercase font-semibold block">Class A SKUs (Top 80% Capital)</span>
                <div className="font-mono text-2xl font-bold text-accent">{formatINR(data.summary.classA.value)}</div>
                <span className="text-2xs text-ink-muted">{data.summary.classA.count} SKUs · {data.summary.classA.percentage}% of total value</span>
              </div>
              <div className="border border-border rounded bg-surface p-5 space-y-2">
                <span className="text-2xs text-ink-muted uppercase font-semibold block">Class B & C Capital</span>
                <div className="font-mono text-2xl font-bold text-ink-muted">{formatINR(data.summary.classB.value + data.summary.classC.value)}</div>
                <span className="text-2xs text-ink-muted">{data.summary.classB.count + data.summary.classC.count} SKUs</span>
              </div>
            </div>

            {/* ABC Classification Breakdown Bar */}
            <div className="border border-border rounded bg-surface p-5 space-y-3">
              <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">ABC Pareto Valuation Distribution</h2>
              <div className="h-4 w-full bg-surface-overlay rounded-full overflow-hidden flex">
                <div className="bg-accent h-full" style={{ width: `${data.summary.classA.percentage}%` }} title="Class A" />
                <div className="bg-warning h-full" style={{ width: `${data.summary.classB.percentage}%` }} title="Class B" />
                <div className="bg-ink-faint h-full" style={{ width: `${data.summary.classC.percentage}%` }} title="Class C" />
              </div>
              <div className="flex items-center gap-6 text-xs text-ink-muted pt-1">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-accent" /><span>Class A (80% Value, High Priority)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-warning" /><span>Class B (15% Value, Moderate)</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-ink-faint" /><span>Class C (5% Value, Low Touch)</span></div>
              </div>
            </div>

            {/* ABC Table */}
            <div className="border border-border rounded bg-surface overflow-hidden">
              <div className="p-4 border-b border-border font-semibold text-xs text-ink">SKU Valuation Matrix</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-raised/50 text-ink-muted uppercase tracking-wider text-2xs font-semibold">
                      <th className="py-2.5 px-4">Class</th>
                      <th className="py-2.5 px-4">SKU</th>
                      <th className="py-2.5 px-4">Product Name</th>
                      <th className="py-2.5 px-4 text-center">On-Hand Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Cost</th>
                      <th className="py-2.5 px-4 text-right">Total Valuation</th>
                      <th className="py-2.5 px-4 text-right">Cum. %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.items.map((item) => (
                      <tr key={item.sku} className="hover:bg-surface-raised/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-2xs ${
                            item.categoryClass === 'A' ? 'bg-accent/10 text-accent' : item.categoryClass === 'B' ? 'bg-warning/10 text-warning' : 'bg-surface-overlay text-ink-muted'
                          }`}>
                            Class {item.categoryClass}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-ink">{item.sku}</td>
                        <td className="py-3 px-4 font-medium text-ink">{item.name}</td>
                        <td className="py-3 px-4 text-center font-mono text-ink-muted">{item.totalQuantity}</td>
                        <td className="py-3 px-4 text-right font-mono text-ink">{formatINR(item.unitCost)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-ink">{formatINR(item.totalValue)}</td>
                        <td className="py-3 px-4 text-right font-mono text-ink-muted">{item.cumulativePercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
