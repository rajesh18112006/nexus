import * as React from 'react';
import { get } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { FileSpreadsheet, Download, FileText, Check } from 'lucide-react';

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = React.useState('stock');
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadReport = React.useCallback(async () => {
    setLoading(true);
    try {
      if (selectedReport === 'stock') {
        const res = await get<any>('/products');
        setReportData(Array.isArray(res) ? res : (res?.data || res?.products || []));
      } else if (selectedReport === 'pos') {
        const res = await get<any>('/procurement/pos');
        setReportData(Array.isArray(res) ? res : (res?.data || res?.purchaseOrders || []));
      } else if (selectedReport === 'suppliers') {
        const res = await get<any>('/suppliers');
        setReportData(Array.isArray(res) ? res : (res?.data || res?.suppliers || []));
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedReport]);

  React.useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = () => {
    if (!reportData.length) return;
    const keys = Object.keys(reportData[0]).filter((k) => typeof reportData[0][k] !== 'object');
    const header = keys.join(',');
    const rows = reportData.map((row) => keys.map((k) => `"${row[k] || ''}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NEXUS_${selectedReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Operational Reports & Audit Exports</h1>
          <p className="text-xs text-ink-muted mt-1">Exportable CSV & JSON audit data for compliance, tax filings & financial records</p>
        </div>
        <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportCSV} disabled={!reportData.length}>
          Export CSV Report
        </Button>
      </div>

      {/* Report Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { id: 'stock', title: 'Inventory Valuation Report', desc: 'SKU catalogue, unit costs, selling prices & reorder points' },
          { id: 'pos', title: 'Purchase Orders Audit Log', desc: 'Complete PO status history, supplier totals & GRN receipts' },
          { id: 'suppliers', title: 'Supplier Directory & Scorecards', desc: 'Vendor ratings, contact info, lead times & GSTIN records' },
        ].map((rep) => (
          <div
            key={rep.id}
            onClick={() => setSelectedReport(rep.id)}
            className={`p-4 border rounded cursor-pointer transition-all ${
              selectedReport === rep.id ? 'border-accent bg-surface-raised shadow-sm' : 'border-border bg-surface hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <FileSpreadsheet className={`w-5 h-5 ${selectedReport === rep.id ? 'text-accent' : 'text-ink-muted'}`} />
              {selectedReport === rep.id && <Check className="w-4 h-4 text-accent" />}
            </div>
            <h3 className="font-medium text-sm text-ink mt-3">{rep.title}</h3>
            <p className="text-xs text-ink-muted mt-1">{rep.desc}</p>
          </div>
        ))}
      </div>

      {/* Report Preview */}
      <div className="border border-border rounded bg-surface overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-semibold text-xs text-ink capitalize">Report Data Preview ({reportData.length} records)</span>
        </div>
        {loading ? (
          <div className="p-12 text-center text-xs text-ink-muted">Generating report data...</div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-raised/50 text-ink-muted uppercase tracking-wider text-2xs font-semibold">
                  {reportData.length > 0 &&
                    Object.keys(reportData[0])
                      .filter((k) => typeof reportData[0][k] !== 'object')
                      .slice(0, 6)
                      .map((key) => (
                        <th key={key} className="py-2.5 px-4">{key}</th>
                      ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface-raised/30 transition-colors">
                    {Object.keys(row)
                      .filter((k) => typeof row[k] !== 'object')
                      .slice(0, 6)
                      .map((key) => (
                        <td key={key} className="py-2.5 px-4 text-ink truncate max-w-xs">{String(row[key] ?? '')}</td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
