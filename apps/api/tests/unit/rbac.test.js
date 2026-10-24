"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const permissions_1 = require("../../src/permissions");
(0, vitest_1.describe)('RBAC Permission Matrix', () => {
    // ── Admin has all permissions ──────────────────────────────────────
    (0, vitest_1.it)('admin can read users', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', 'users', 'read')).toBe(true);
    });
    (0, vitest_1.it)('admin can delete products', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', 'products', 'delete')).toBe(true);
    });
    (0, vitest_1.it)('admin can update settings', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', 'settings', 'update')).toBe(true);
    });
    // ── Auditor can ONLY read ──────────────────────────────────────────
    (0, vitest_1.it)('auditor can read audit_log', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('auditor', 'audit_log', 'read')).toBe(true);
    });
    (0, vitest_1.it)('auditor CANNOT create movements (403 expected)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('auditor', 'stock_movements', 'create')).toBe(false);
    });
    (0, vitest_1.it)('auditor CANNOT approve POs (403 expected)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('auditor', 'purchase_orders', 'approve')).toBe(false);
    });
    (0, vitest_1.it)('auditor CANNOT update settings (403 expected)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('auditor', 'settings', 'update')).toBe(false);
    });
    // ── Warehouse Manager permissions ─────────────────────────────────
    (0, vitest_1.it)('warehouse_manager can adjust inventory', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('warehouse_manager', 'inventory', 'update')).toBe(true);
    });
    (0, vitest_1.it)('warehouse_manager CANNOT delete products (403)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('warehouse_manager', 'products', 'delete')).toBe(false);
    });
    (0, vitest_1.it)('warehouse_manager CANNOT read users (403)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('warehouse_manager', 'users', 'read')).toBe(false);
    });
    // ── Procurement Manager permissions ───────────────────────────────
    (0, vitest_1.it)('procurement_manager can create POs', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('procurement_manager', 'purchase_orders', 'create')).toBe(true);
    });
    (0, vitest_1.it)('procurement_manager CANNOT update settings (403)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('procurement_manager', 'settings', 'update')).toBe(false);
    });
    (0, vitest_1.it)('procurement_manager CANNOT read audit_log (403)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('procurement_manager', 'audit_log', 'read')).toBe(false);
    });
    // ── Finance permissions ───────────────────────────────────────────
    (0, vitest_1.it)('finance can approve invoices', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('finance', 'invoices', 'approve')).toBe(true);
    });
    (0, vitest_1.it)('finance CANNOT create stock movements (403)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('finance', 'stock_movements', 'create')).toBe(false);
    });
    (0, vitest_1.it)('finance CANNOT delete suppliers (403)', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('finance', 'suppliers', 'delete')).toBe(false);
    });
    // ── Unknown resource/action returns false ─────────────────────────
    (0, vitest_1.it)('unknown resource returns false', () => {
        (0, vitest_1.expect)((0, permissions_1.hasPermission)('admin', 'nonexistent_resource', 'read')).toBe(false);
    });
});
//# sourceMappingURL=rbac.test.js.map