import * as React from 'react';
import { get, patch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from '@/components/ui/Badge';
import { toast } from '@/components/ui/Toast';
import { Bell, CheckCircle, Sun, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface AlertItem {
  _id: string;
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'LOW' | 'HEALTHY';
  title: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

interface MorningBrief {
  date: string;
  headline: string;
  metrics: {
    criticalCount: number;
    warningCount: number;
    openPOCount: number;
    pendingApprovalCount: number;
  };
}

export function AlertsPage() {
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [brief, setBrief] = React.useState<MorningBrief | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [alertRes, briefRes] = await Promise.all([
        get<any>('/alerts'),
        get<any>('/alerts/morning-brief'),
      ]);
      const alertList = Array.isArray(alertRes) ? alertRes : (alertRes?.data || alertRes?.alerts || []);
      setAlerts(alertList);
      setBrief(briefRes?.data || briefRes || null);
    } catch (err) {
      console.error('Failed to load alerts data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async (id: string) => {
    try {
      await patch(`/alerts/${id}/resolve`);
      toast.success('Operational alert resolved');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resolve alert');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Morning Brief & Operational Alerts</h1>
          <p className="text-xs text-ink-muted mt-1">Daily operational intelligence synthesis & active inventory risk notifications</p>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>
          Refresh Digest
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-ink-muted border border-border rounded bg-surface">Loading morning brief...</div>
      ) : (
        <div className="space-y-6">
          {/* Morning Brief Card */}
          {brief && (
            <div className="border border-accent/40 rounded bg-accent/5 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-accent/20 pb-3">
                <div className="flex items-center gap-2 text-accent font-semibold text-sm">
                  <Sun className="w-5 h-5" />
                  <span>NEXUS Executive Morning Operations Brief</span>
                </div>
                <span className="text-2xs font-mono text-ink-muted">{new Date(brief.date).toLocaleDateString()}</span>
              </div>
              <p className="text-base font-medium text-ink leading-relaxed">{brief.headline}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="bg-surface p-3 rounded border border-border">
                  <span className="text-2xs text-ink-muted uppercase block">Critical Risks</span>
                  <span className="font-mono text-xl font-bold text-critical">{brief.metrics.criticalCount}</span>
                </div>
                <div className="bg-surface p-3 rounded border border-border">
                  <span className="text-2xs text-ink-muted uppercase block">Warnings</span>
                  <span className="font-mono text-xl font-bold text-warning">{brief.metrics.warningCount}</span>
                </div>
                <div className="bg-surface p-3 rounded border border-border">
                  <span className="text-2xs text-ink-muted uppercase block">Active POs</span>
                  <span className="font-mono text-xl font-bold text-ink">{brief.metrics.openPOCount}</span>
                </div>
                <div className="bg-surface p-3 rounded border border-border">
                  <span className="text-2xs text-ink-muted uppercase block">Awaiting Approval</span>
                  <span className="font-mono text-xl font-bold text-accent">{brief.metrics.pendingApprovalCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Alerts List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              Active Operational Notifications ({alerts.length})
            </h2>

            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert._id}
                  className={`p-4 border rounded bg-surface flex items-start justify-between gap-4 transition-all ${
                    alert.severity === 'CRITICAL' ? 'border-critical/40' : 'border-warning/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity === 'CRITICAL' ? 'CRITICAL' : alert.severity === 'WARNING' ? 'WARNING' : 'INFO'} />
                      <span className="font-mono text-2xs text-ink-muted uppercase">{alert.type}</span>
                    </div>
                    <h3 className="font-medium text-sm text-ink">{alert.title}</h3>
                    <p className="text-xs text-ink-muted">{alert.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                    onClick={() => handleResolve(alert._id)}
                  >
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
