import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../src/permissions';

describe('RBAC Permission Matrix', () => {
  // ── Admin has all permissions ──────────────────────────────────────
  it('admin can read users', () => {
    expect(hasPermission('admin', 'users', 'read')).toBe(true);
  });
  it('admin can delete products', () => {
    expect(hasPermission('admin', 'products', 'delete')).toBe(true);
  });
  it('admin can update settings', () => {
    expect(hasPermission('admin', 'settings', 'update')).toBe(true);
  });

  // ── Auditor can ONLY read ──────────────────────────────────────────
  it('auditor can read audit_log', () => {
    expect(hasPermission('auditor', 'audit_log', 'read')).toBe(true);
  });
  it('auditor CANNOT create movements (403 expected)', () => {
    expect(hasPermission('auditor', 'stock_movements', 'create')).toBe(false);
  });
  it('auditor CANNOT approve POs (403 expected)', () => {
    expect(hasPermission('auditor', 'purchase_orders', 'approve')).toBe(false);
  });
  it('auditor CANNOT update settings (403 expected)', () => {
    expect(hasPermission('auditor', 'settings', 'update')).toBe(false);
  });

  // ── Warehouse Manager permissions ─────────────────────────────────
  it('warehouse_manager can adjust inventory', () => {
    expect(hasPermission('warehouse_manager', 'inventory', 'update')).toBe(true);
  });
  it('warehouse_manager CANNOT delete products (403)', () => {
    expect(hasPermission('warehouse_manager', 'products', 'delete')).toBe(false);
  });
  it('warehouse_manager CANNOT read users (403)', () => {
    expect(hasPermission('warehouse_manager', 'users', 'read')).toBe(false);
  });

  // ── Procurement Manager permissions ───────────────────────────────
  it('procurement_manager can create POs', () => {
    expect(hasPermission('procurement_manager', 'purchase_orders', 'create')).toBe(true);
  });
  it('procurement_manager CANNOT update settings (403)', () => {
    expect(hasPermission('procurement_manager', 'settings', 'update')).toBe(false);
  });
  it('procurement_manager CANNOT read audit_log (403)', () => {
    expect(hasPermission('procurement_manager', 'audit_log', 'read')).toBe(false);
  });

  // ── Finance permissions ───────────────────────────────────────────
  it('finance can approve invoices', () => {
    expect(hasPermission('finance', 'invoices', 'approve')).toBe(true);
  });
  it('finance CANNOT create stock movements (403)', () => {
    expect(hasPermission('finance', 'stock_movements', 'create')).toBe(false);
  });
  it('finance CANNOT delete suppliers (403)', () => {
    expect(hasPermission('finance', 'suppliers', 'delete')).toBe(false);
  });

  // ── Unknown resource/action returns false ─────────────────────────
  it('unknown resource returns false', () => {
    expect(hasPermission('admin', 'nonexistent_resource' as any, 'read')).toBe(false);
  });
});
