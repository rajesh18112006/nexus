import type { Role } from '@nexus/shared';

export type Resource =
  | 'users'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'stock_movements'
  | 'warehouses'
  | 'suppliers'
  | 'purchase_requests'
  | 'purchase_orders'
  | 'goods_receipts'
  | 'invoices'
  | 'forecasts'
  | 'recommendations'
  | 'alerts'
  | 'scenarios'
  | 'reports'
  | 'audit_log'
  | 'settings';

export type Action =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'execute'
  | 'export'
  | 'trigger'
  | 'acknowledge'
  | 'dismiss'
  | 'cancel';

const PERMISSIONS: Partial<Record<Resource, Partial<Record<Action, Role[]>>>> = {
  users: {
    read: ['admin'],
    create: ['admin'],
    update: ['admin'],
    delete: ['admin'],
  },
  products: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    create: ['admin', 'procurement_manager'],
    update: ['admin', 'procurement_manager'],
    delete: ['admin'],
  },
  inventory: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    update: ['admin', 'warehouse_manager'],
  },
  warehouses: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    create: ['admin', 'warehouse_manager'],
    update: ['admin', 'warehouse_manager'],
    delete: ['admin'],
  },
  suppliers: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    create: ['admin', 'procurement_manager'],
    update: ['admin', 'procurement_manager'],
    delete: ['admin'],
  },
  purchase_orders: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    create: ['admin', 'procurement_manager'],
    update: ['admin', 'procurement_manager'],
    approve: ['admin', 'procurement_manager', 'finance'],
    reject: ['admin', 'procurement_manager', 'finance'],
    cancel: ['admin', 'procurement_manager'],
  },
  goods_receipts: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    create: ['admin', 'procurement_manager', 'warehouse_manager'],
    update: ['admin', 'procurement_manager', 'warehouse_manager'],
  },
  forecasts: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    trigger: ['admin', 'procurement_manager'],
  },
  recommendations: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    approve: ['admin', 'procurement_manager', 'warehouse_manager'],
    execute: ['admin', 'procurement_manager', 'warehouse_manager'],
  },
  alerts: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    acknowledge: ['admin', 'procurement_manager', 'warehouse_manager'],
    dismiss: ['admin', 'procurement_manager', 'warehouse_manager'],
  },
  scenarios: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    create: ['admin', 'procurement_manager', 'warehouse_manager', 'finance'],
    execute: ['admin', 'procurement_manager', 'warehouse_manager', 'finance'],
  },
  reports: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    export: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
  },
  audit_log: {
    read: ['admin', 'auditor'],
  },
  settings: {
    read: ['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor'],
    update: ['admin'],
  },
};

export function canAccess(role: Role | undefined, resource: Resource, action: Action): boolean {
  if (!role) return false;
  const rolesWithPermission = PERMISSIONS[resource]?.[action];
  if (!rolesWithPermission) return false;
  return rolesWithPermission.includes(role);
}

export const ROLE_LABELS: Record<Role, { title: string; badgeClass: string; icon: string; description: string }> = {
  admin: {
    title: 'Admin',
    badgeClass: 'bg-accent/15 text-accent border-accent/30',
    icon: '👑',
    description: 'Full system control, user management, and settings configuration.',
  },
  procurement_manager: {
    title: 'Procurement Manager',
    badgeClass: 'bg-info-bg text-info border-info/30',
    icon: '📦',
    description: 'Manages SKUs, suppliers, PO lifecycles, and reorder engines.',
  },
  warehouse_manager: {
    title: 'Warehouse Manager',
    badgeClass: 'bg-warning-bg text-warning border-warning/30',
    icon: '🏭',
    description: 'Manages inventory counts, stock adjustments, GRNs, and warehouse maps.',
  },
  finance: {
    title: 'Finance',
    badgeClass: 'bg-success-bg text-success border-success/30',
    icon: '💰',
    description: 'PO approvals, 3-way match validation, cost analytics, and budget forecasting.',
  },
  auditor: {
    title: 'Auditor',
    badgeClass: 'bg-surface-raised text-ink-muted border-border-strong',
    icon: '📋',
    description: 'Read-only compliance monitoring & exclusive access to append-only Audit Logs.',
  },
};
