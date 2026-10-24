import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Users,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Search,
  Filter,
  Check,
  RefreshCw,
  MoreVertical,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { get, post, patch } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ROLE_LABELS } from '@/lib/rbac';
import type { Role, ApprovalStatus } from '@nexus/shared';

interface MemberUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  isApproved: boolean;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byRole: Record<Role, number>;
}

const FIVE_ROLES: Role[] = [
  'admin',
  'procurement_manager',
  'warehouse_manager',
  'finance',
  'auditor',
];

export function SettingsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'team' | 'rbac' | 'organization') || 'team';
  const [activeTab, setActiveTab] = React.useState<'team' | 'rbac' | 'organization'>(initialTab);

  const isAdmin = currentUser?.role === 'admin';

  // Team state
  const [loading, setLoading] = React.useState(false);
  const [members, setMembers] = React.useState<MemberUser[]>([]);
  const [stats, setStats] = React.useState<UserStats | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('ALL');

  // Role modification dropdown state: userId -> selected new role
  const [pendingRoleSelection, setPendingRoleSelection] = React.useState<Record<string, Role>>({});
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Sync tab with URL
  const handleTabChange = (tab: 'team' | 'rbac' | 'organization') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchUsers = React.useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await get<{ users: MemberUser[]; stats: UserStats }>('/users');
      setMembers(data.users);
      setStats(data.stats);

      // Initialize pending role selection map
      const roleMap: Record<string, Role> = {};
      data.users.forEach((u) => {
        roleMap[u._id] = u.role;
      });
      setPendingRoleSelection(roleMap);
    } catch (err: any) {
      toast.error('Failed to load team data', err?.response?.data?.message || 'Access restricted.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Approve Member
  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const assignedRole = pendingRoleSelection[userId];
      const res = await post<{ success: boolean; user: MemberUser }>(`/users/${userId}/approve`, {
        role: assignedRole,
      });
      toast.success(
        'Member Approved',
        `${res.user.firstName} ${res.user.lastName} is now an authorized ${ROLE_LABELS[res.user.role].title}.`
      );
      await fetchUsers();
    } catch (err: any) {
      toast.error('Approval Failed', err?.response?.data?.message || 'Could not approve member.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject Member
  const handleReject = async (userId: string) => {
    const reason = window.prompt('Optional rejection reason for the applicant:', 'Application declined by organization administrator.');
    if (reason === null) return; // user cancelled prompt

    setActionLoading(userId);
    try {
      await post(`/users/${userId}/reject`, { reason });
      toast.info('Membership Request Declined');
      await fetchUsers();
    } catch (err: any) {
      toast.error('Rejection Failed', err?.response?.data?.message || 'Could not reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Role Change for an existing member
  const handleRoleChange = async (userId: string, newRole: Role) => {
    setActionLoading(userId);
    try {
      await patch(`/users/${userId}/role`, { role: newRole });
      toast.success('Role Updated', `User permissions adjusted to ${ROLE_LABELS[newRole].title}.`);
      await fetchUsers();
    } catch (err: any) {
      toast.error('Failed to change role', err?.response?.data?.message || 'Could not update role.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Account Status (Suspend / Reactivate)
  const handleToggleStatus = async (user: MemberUser) => {
    if (user._id === currentUser?._id) {
      toast.error('Action Not Allowed', 'You cannot suspend your own administrator account.');
      return;
    }

    const nextStatus = !user.isActive;
    setActionLoading(user._id);
    try {
      await patch(`/users/${user._id}/status`, { isActive: nextStatus });
      toast.success(
        nextStatus ? 'Account Activated' : 'Account Suspended',
        `${user.firstName}'s account has been ${nextStatus ? 'reactivated' : 'temporarily suspended'}.`
      );
      await fetchUsers();
    } catch (err: any) {
      toast.error('Failed to update status', err?.response?.data?.message || 'Could not update status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered members list
  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  const pendingApprovals = React.useMemo(() => {
    return members.filter((m) => m.approvalStatus === 'PENDING');
  }, [members]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Organization & Team Governance</h1>
          <p className="text-xs text-ink-muted mt-1">
            Manage organization staff, role-based authorization scopes, and approve pending member requests.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised border border-border rounded-lg">
          <button
            onClick={() => handleTabChange('team')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-warning text-white flex items-center justify-center text-3xs font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('rbac')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>5-Role Access Matrix</span>
          </button>

          <button
            onClick={() => handleTabChange('organization')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'organization'
                ? 'bg-accent text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Organization Profile</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: TEAM & APPROVALS ── */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {!isAdmin ? (
            <div className="p-6 rounded-lg bg-surface border border-border text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-warning mx-auto" />
              <h3 className="text-sm font-semibold text-ink">Admin Privileges Required</h3>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                Only organization Administrators have authorization to review member applications, assign roles, and manage permissions.
              </p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-surface border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-ink-muted">Total Members</span>
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-ink mt-2">{stats?.total || 0}</div>
                  <div className="text-3xs text-ink-muted mt-1">Registered staff across all roles</div>
                </div>

                <div
                  className={`p-4 rounded-lg bg-surface border ${
                    (stats?.pending || 0) > 0 ? 'border-warning/50 bg-warning-bg/10' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-warning">
                      Pending Approvals
                    </span>
                    <Clock className="w-4 h-4 text-warning" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-warning mt-2">{stats?.pending || 0}</div>
                  <div className="text-3xs text-ink-muted mt-1">Awaiting your authorization</div>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-healthy">Active Members</span>
                    <CheckCircle className="w-4 h-4 text-healthy" />
                  </div>
                  <div className="text-2xl font-bold font-mono text-healthy mt-2">{stats?.approved || 0}</div>
                  <div className="text-3xs text-ink-muted mt-1">Authorized with live data access</div>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-semibold uppercase tracking-wider text-ink-muted">5 Roles Configured</span>
                    <ShieldCheck className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-base">
                    <span>👑</span>
                    <span>📦</span>
                    <span>🏭</span>
                    <span>💰</span>
                    <span>📋</span>
                  </div>
                  <div className="text-3xs text-ink-muted mt-1">Enterprise RBAC enforced</div>
                </div>
              </div>

              {/* ── Pending Approvals Section ── */}
              {pendingApprovals.length > 0 && (
                <div className="p-5 rounded-lg border-2 border-warning/40 bg-surface shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-warning animate-ping" />
                      <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                        <span>Approval Queue: {pendingApprovals.length} Pending Membership Request{pendingApprovals.length > 1 ? 's' : ''}</span>
                      </h2>
                    </div>
                    <span className="text-2xs text-warning font-medium">Review and assign active operational role</span>
                  </div>

                  <div className="space-y-3">
                    {pendingApprovals.map((user) => {
                      const currentAssignedRole = pendingRoleSelection[user._id] || user.role;
                      const roleMeta = ROLE_LABELS[currentAssignedRole];

                      return (
                        <div
                          key={user._id}
                          className="p-4 rounded-lg border border-border bg-surface-raised flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          {/* User Info */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-warning-bg border border-warning/30 text-warning font-bold flex items-center justify-center text-sm flex-shrink-0">
                              {user.firstName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-ink">{user.firstName} {user.lastName}</span>
                                <span className="px-2 py-0.5 rounded text-3xs font-semibold bg-warning-bg text-warning border border-warning/30">
                                  PENDING
                                </span>
                              </div>
                              <p className="text-xs text-ink-muted">{user.email}</p>
                              <p className="text-3xs text-ink-faint mt-0.5">
                                Requested on: {new Date(user.createdAt).toLocaleDateString()} at{' '}
                                {new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          {/* Role Selection & Actions */}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-2xs text-ink-muted font-medium">Confirm Role:</label>
                              <select
                                value={currentAssignedRole}
                                onChange={(e) =>
                                  setPendingRoleSelection((prev) => ({
                                    ...prev,
                                    [user._id]: e.target.value as Role,
                                  }))
                                }
                                className="h-8 px-2.5 rounded border border-border bg-surface text-xs font-medium text-ink focus:border-accent focus:outline-none"
                              >
                                {FIVE_ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r].icon} {ROLE_LABELS[r].title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <Button
                              size="sm"
                              variant="primary"
                              loading={actionLoading === user._id}
                              onClick={() => handleApprove(user._id)}
                              iconRight={<Check className="w-3.5 h-3.5" />}
                              className="bg-healthy hover:bg-healthy/90 text-white"
                            >
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              loading={actionLoading === user._id}
                              onClick={() => handleReject(user._id)}
                              iconRight={<XCircle className="w-3.5 h-3.5" />}
                              className="text-critical hover:bg-critical-bg"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── All Members Directory ── */}
              <div className="p-5 rounded-lg border border-border bg-surface space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-ink">Organization Staff Directory</h2>
                    <p className="text-2xs text-ink-muted">All active, pending, and suspended users within your workspace</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 pr-3 text-xs rounded border border-border bg-surface-raised text-ink focus:border-accent focus:outline-none w-56"
                      />
                    </div>

                    {/* Role Filter */}
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="h-8 px-2.5 text-xs rounded border border-border bg-surface-raised text-ink focus:border-accent focus:outline-none"
                    >
                      <option value="ALL">All Roles</option>
                      {FIVE_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r].title}
                        </option>
                      ))}
                    </select>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchUsers()}
                      loading={loading}
                      title="Refresh member list"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-raised text-ink-muted uppercase tracking-wider text-2xs font-semibold">
                        <th className="py-2.5 px-3">Member</th>
                        <th className="py-2.5 px-3">Assigned Role</th>
                        <th className="py-2.5 px-3 text-center">Approval Status</th>
                        <th className="py-2.5 px-3 text-center">Account Status</th>
                        <th className="py-2.5 px-3">Joined</th>
                        <th className="py-2.5 px-3 text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredMembers.map((member) => {
                        const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.admin;
                        const isSelf = member._id === currentUser?._id;

                        return (
                          <tr key={member._id} className="hover:bg-surface-raised/40 transition-colors">
                            {/* Member info */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 text-accent font-semibold flex items-center justify-center text-xs">
                                  {member.firstName[0]}
                                </div>
                                <div>
                                  <div className="font-semibold text-ink flex items-center gap-1.5">
                                    <span>{member.firstName} {member.lastName}</span>
                                    {isSelf && (
                                      <span className="text-3xs px-1.5 py-0.2 rounded bg-accent/10 text-accent border border-accent/20">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-2xs text-ink-muted">{member.email}</span>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-3 px-3">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-2xs border font-medium">
                                <span>{roleInfo.icon}</span>
                                <span className="font-semibold text-ink">{roleInfo.title}</span>
                              </div>
                            </td>

                            {/* Approval Status */}
                            <td className="py-3 px-3 text-center">
                              {member.approvalStatus === 'APPROVED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold bg-success-bg text-success border border-success/30">
                                  <Check className="w-3 h-3" />
                                  APPROVED
                                </span>
                              )}
                              {member.approvalStatus === 'PENDING' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold bg-warning-bg text-warning border border-warning/30">
                                  <Clock className="w-3 h-3" />
                                  PENDING
                                </span>
                              )}
                              {member.approvalStatus === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold bg-critical-bg text-critical border border-critical/30">
                                  <XCircle className="w-3 h-3" />
                                  REJECTED
                                </span>
                              )}
                            </td>

                            {/* Active Status */}
                            <td className="py-3 px-3 text-center">
                              {member.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold text-healthy bg-healthy/10">
                                  <span className="w-1.5 h-1.5 rounded-full bg-healthy" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold text-ink-faint bg-surface-raised border border-border">
                                  Suspended
                                </span>
                              )}
                            </td>

                            {/* Joined date */}
                            <td className="py-3 px-3 text-2xs text-ink-muted font-mono">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Change Role Selector */}
                                <select
                                  disabled={isSelf || actionLoading === member._id}
                                  value={member.role}
                                  onChange={(e) => handleRoleChange(member._id, e.target.value as Role)}
                                  className="h-7 px-2 text-2xs rounded border border-border bg-surface text-ink focus:border-accent focus:outline-none disabled:opacity-50"
                                  title="Change operational role"
                                >
                                  {FIVE_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      {ROLE_LABELS[r].title}
                                    </option>
                                  ))}
                                </select>

                                {/* Toggle Active/Suspend */}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    disabled={actionLoading === member._id}
                                    onClick={() => handleToggleStatus(member)}
                                    className={`px-2 py-1 rounded text-2xs font-semibold border transition-colors cursor-pointer ${
                                      member.isActive
                                        ? 'border-critical/30 text-critical hover:bg-critical-bg'
                                        : 'border-healthy/30 text-healthy hover:bg-healthy/10'
                                    }`}
                                  >
                                    {member.isActive ? 'Suspend' : 'Activate'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredMembers.length === 0 && (
                    <div className="text-center py-8 text-xs text-ink-muted">
                      No members found matching the specified criteria.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: RBAC MATRIX ── */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="p-5 rounded-lg border border-border bg-surface space-y-4">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Enterprise 5-Role Access Control Matrix
            </h2>
            <p className="text-xs text-ink-muted">
              NEXUS enforces fine-grained authorization gates across inventory, purchase orders, goods receipts, and financial analytics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {FIVE_ROLES.map((r) => {
                const info = ROLE_LABELS[r];
                return (
                  <div key={r} className="p-3.5 rounded border border-border bg-surface-raised space-y-1.5">
                    <div className="text-xl">{info.icon}</div>
                    <div className="font-semibold text-xs text-ink">{info.title}</div>
                    <p className="text-3xs text-ink-muted leading-relaxed">{info.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-raised text-ink-muted uppercase tracking-wider text-2xs font-semibold">
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-center">User Governance</th>
                    <th className="py-2.5 px-3 text-center">SKUs & Suppliers</th>
                    <th className="py-2.5 px-3 text-center">Stock & Warehouses</th>
                    <th className="py-2.5 px-3 text-center">Purchase Orders</th>
                    <th className="py-2.5 px-3 text-center">Audit Trails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { role: 'Admin', user: 'Full Control', sku: 'Full Access', st: 'Full Access', po: 'Full Access', aud: 'Read / Export' },
                    { role: 'Procurement Manager', user: 'No Access', sku: 'Create / Edit', st: 'Read Only', po: 'Create / Approve', aud: 'Read Only' },
                    { role: 'Warehouse Manager', user: 'No Access', sku: 'Read Only', st: 'Adjust / Transfer', po: 'Receive GRN', aud: 'Read Only' },
                    { role: 'Finance', user: 'No Access', sku: 'Read Only', st: 'Read Only', po: 'Approve / 3-Way Match', aud: 'Read Only' },
                    { role: 'Auditor', user: 'No Access', sku: 'Read Only', st: 'Read Only', po: 'Read Only', aud: 'Read / Export' },
                  ].map((row) => (
                    <tr key={row.role} className="hover:bg-surface-raised/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-ink">{row.role}</td>
                      <td className="py-3 px-3 text-center font-mono text-ink-muted text-2xs">{row.user}</td>
                      <td className="py-3 px-3 text-center font-mono text-ink-muted text-2xs">{row.sku}</td>
                      <td className="py-3 px-3 text-center font-mono text-ink-muted text-2xs">{row.st}</td>
                      <td className="py-3 px-3 text-center font-mono text-ink-muted text-2xs">{row.po}</td>
                      <td className="py-3 px-3 text-center font-mono text-ink-muted text-2xs">{row.aud}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ORGANIZATION PROFILE ── */}
      {activeTab === 'organization' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-border rounded-lg bg-surface p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent font-bold flex items-center justify-center text-base">
                {currentUser?.firstName?.[0] || 'U'}
              </div>
              <div>
                <h2 className="font-semibold text-sm text-ink">{currentUser?.firstName} {currentUser?.lastName}</h2>
                <span className="text-xs text-ink-muted">{currentUser?.email}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Organization:</span>
                <span className="font-semibold text-ink">{currentUser?.organizationName || 'NEXUS Workspace'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Your Role:</span>
                <span className="font-mono font-semibold uppercase text-accent">
                  {ROLE_LABELS[currentUser?.role || 'admin'].title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Approval Status:</span>
                <span className="px-2 py-0.5 rounded text-3xs font-semibold bg-success-bg text-success border border-success/30">
                  {currentUser?.approvalStatus || 'APPROVED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Security:</span>
                <span className="text-2xs font-mono text-ink">Argon2id + 2FA OTP</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 border border-border rounded-lg bg-surface p-5 space-y-4">
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              Workspace Identity & Tenant Parameters
            </h2>

            <div className="space-y-3">
              <Input
                label="Workspace Organization Name"
                disabled
                value={currentUser?.organizationName || 'NEXUS Workspace'}
              />
              <Input
                label="Organization Identifier Slug"
                disabled
                value={currentUser?.organizationName?.toLowerCase().replace(/\s+/g, '-') || 'nexus-workspace'}
                hint="Share this workspace slug with staff so they can join and request access."
              />
              <div className="p-3.5 rounded bg-surface-raised border border-border text-2xs text-ink-muted space-y-1">
                <span className="font-semibold text-ink block">How New Staff Join This Workspace:</span>
                <span>
                  1. Staff navigate to Register and click <strong>Join as Team Member</strong>.
                  <br />
                  2. They enter this workspace slug and select their desired role (Procurement, Warehouse, Finance, or Auditor).
                  <br />
                  3. Upon email confirmation, their account appears in your <strong>Pending Approvals</strong> queue above.
                  <br />
                  4. As Administrator, you approve their account and authorize their operational data access.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
