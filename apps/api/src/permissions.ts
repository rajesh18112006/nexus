import type { Role } from '@nexus/shared';

// ─── Resources ────────────────────────────────────────────────────────────────
export type Resource =
  | 'users'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'stock_movements'
  | 'warehouses'
  | 'suppliers'
  | 'supplier_prices'
  | 'purchase_requests'
  | 'purchase_orders'
  | 'shipments'
  | 'goods_receipts'
  | 'invoices'
  | 'forecasts'
  | 'recommendations'
  | 'alerts'
  | 'scenarios'
  | 'warehouse_intelligence'
  | 'reports'
  | 'audit_log'
  | 'settings'
  | 'approval_rules'
  | 'notifications';

// ─── Actions ─────────────────────────────────────────────────────────────────
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

// ─── Permission Matrix ─────────────────────────────────────────────────────────
// Format: permissions[resource][action] = Set<Role>
// This is the SINGLE SOURCE OF TRUTH for authorization.
// RBAC middleware reads ONLY from here — never hardcoded anywhere else.
type PermissionMatrix = Partial<Record<Resource, Partial<Record<Action, Set<Role>>>>>;

export const PERMISSIONS: PermissionMatrix = {
  users: {
    read:   new Set(['admin']),
    create: new Set(['admin']),
    update: new Set(['admin']),
    delete: new Set(['admin']),
  },
  products: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager']),
    update: new Set(['admin', 'procurement_manager']),
    delete: new Set(['admin']),
  },
  categories: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager']),
    update: new Set(['admin', 'procurement_manager']),
    delete: new Set(['admin']),
  },
  inventory: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    update: new Set(['admin', 'warehouse_manager']),  // manual adjustment
  },
  stock_movements: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
  },
  warehouses: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'warehouse_manager']),
    update: new Set(['admin', 'warehouse_manager']),
    delete: new Set(['admin']),
  },
  suppliers: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager']),
    update: new Set(['admin', 'procurement_manager']),
    delete: new Set(['admin']),
  },
  supplier_prices: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager']),
    update: new Set(['admin', 'procurement_manager']),
    delete: new Set(['admin', 'procurement_manager']),
  },
  purchase_requests: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
    approve: new Set(['admin', 'procurement_manager']),
    reject: new Set(['admin', 'procurement_manager']),
  },
  purchase_orders: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager']),
    update: new Set(['admin', 'procurement_manager']),
    approve: new Set(['admin', 'procurement_manager', 'finance']),
    reject: new Set(['admin', 'procurement_manager', 'finance']),
    cancel: new Set(['admin', 'procurement_manager']),
  },
  shipments: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager']),
    update: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
  },
  goods_receipts: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
    update: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
  },
  invoices: {
    read:   new Set(['admin', 'procurement_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager', 'finance']),
    approve: new Set(['admin', 'finance']),
  },
  forecasts: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    trigger: new Set(['admin', 'procurement_manager']),
  },
  recommendations: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    approve: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
    reject: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
    execute: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
  },
  alerts: {
    read:       new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    acknowledge: new Set(['admin', 'procurement_manager', 'warehouse_manager']),
    dismiss:    new Set(['admin', 'procurement_manager', 'warehouse_manager']),
  },
  scenarios: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    create: new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance']),
    execute: new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance']),
    delete: new Set(['admin', 'procurement_manager']),
  },
  warehouse_intelligence: {
    read:    new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    execute: new Set(['admin', 'warehouse_manager']),  // approve slotting suggestions
  },
  reports: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    export: new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
  },
  audit_log: {
    read: new Set(['admin', 'auditor']),
  },
  settings: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    update: new Set(['admin']),
  },
  approval_rules: {
    read:   new Set(['admin', 'procurement_manager', 'finance', 'auditor']),
    create: new Set(['admin']),
    update: new Set(['admin']),
    delete: new Set(['admin']),
  },
  notifications: {
    read:   new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
    update: new Set(['admin', 'procurement_manager', 'warehouse_manager', 'finance', 'auditor']),
  },
};

/**
 * Check if a role has permission for a resource+action combination.
 * This is called by the RBAC middleware on every protected route.
 */
export function hasPermission(role: Role, resource: Resource, action: Action): boolean {
  return PERMISSIONS[resource]?.[action]?.has(role) ?? false;
}
