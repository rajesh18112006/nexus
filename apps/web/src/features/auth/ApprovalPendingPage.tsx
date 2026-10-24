import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Building2,
  Mail,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { get, post } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { ROLE_LABELS } from '@/lib/rbac';
import type { AuthUser } from '@nexus/shared';

export function ApprovalPendingPage() {
  const navigate = useNavigate();
  const { user, accessToken, setAuth, logout } = useAuthStore();
  const [checking, setChecking] = React.useState(false);

  // If already approved, route straight to app
  React.useEffect(() => {
    if (user && user.approvalStatus === 'APPROVED') {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      // Re-fetch current profile
      const updatedUser = await get<AuthUser>('/auth/me');
      if (updatedUser.approvalStatus === 'APPROVED') {
        if (accessToken) {
          setAuth(updatedUser, accessToken);
        }
        toast.success('Account Approved!', `Welcome to NEXUS, ${updatedUser.firstName}! Your workspace is active.`);
        navigate('/app', { replace: true });
      } else if (updatedUser.approvalStatus === 'REJECTED') {
        toast.error('Account Request Declined', 'Your access request was declined by your organization administrator.');
      } else {
        toast.info('Status Unchanged', 'Your account is still awaiting administrator review.');
      }
    } catch (err: any) {
      toast.error('Unable to refresh status', err?.response?.data?.message || 'Please try again later.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await post('/auth/logout');
    } catch {
      /* ignore */
    }
    logout();
    navigate('/login');
    toast.info('Signed out successfully');
  };

  const roleInfo = user?.role ? ROLE_LABELS[user.role] : ROLE_LABELS.warehouse_manager;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-lg bg-surface-raised border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xs uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500">
                Action Required by Admin
              </span>
            </div>
            <h1 className="font-display text-xl font-semibold text-ink">Account Pending Approval</h1>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              Your account has been registered and verified. An organization administrator must approve your role before you can access workspace inventory records.
            </p>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-6">
          {/* Identity card */}
          <div className="p-4 rounded-lg bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Building2 className="w-4 h-4 text-accent" />
                <span>Organization:</span>
              </div>
              <span className="text-xs font-semibold text-ink">{user?.organizationName || 'Enterprise Workspace'}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Mail className="w-4 h-4 text-accent" />
                <span>Account Email:</span>
              </div>
              <span className="text-xs font-mono text-ink">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <ShieldCheck className="w-4 h-4 text-accent" />
                <span>Requested Role:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{roleInfo?.icon}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-surface-overlay text-ink">
                  {roleInfo?.title || 'Team Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper Status */}
          <div className="space-y-3">
            <span className="text-2xs font-semibold text-ink-muted uppercase tracking-wider">
              Onboarding Progress
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">1. Account Registration Completed</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">2. Email Authentication Confirmed</span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Clock className="w-4 h-4 flex-shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="font-semibold">3. Administrator Review & Authorization (In Progress)</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="primary"
              fullWidth
              loading={checking}
              onClick={handleCheckStatus}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />}
            >
              Check Approval Status
            </Button>
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={handleSignOut}
              icon={<LogOut className="w-3.5 h-3.5 text-ink-muted" />}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-surface border-t border-border flex items-center justify-between text-2xs text-ink-muted">
          <span>Need faster approval?</span>
          <span>Contact your workspace Admin</span>
        </div>
      </div>
    </div>
  );
}
