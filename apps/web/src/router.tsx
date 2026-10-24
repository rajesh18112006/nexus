import * as React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ApprovalPendingPage } from '@/features/auth/ApprovalPendingPage';
import { CommandCenterPage } from '@/features/dashboard/CommandCenterPage';

// Lazy-load all heavy feature pages
const InventoryPage   = React.lazy(() => import('@/features/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const ProcurementPage = React.lazy(() => import('@/features/procurement/ProcurementPage').then((m) => ({ default: m.ProcurementPage })));
const SuppliersPage   = React.lazy(() => import('@/features/suppliers/SuppliersPage').then((m) => ({ default: m.SuppliersPage })));
const WarehousePage   = React.lazy(() => import('@/features/warehouse/WarehousePage').then((m) => ({ default: m.WarehousePage })));
const ForecastingPage = React.lazy(() => import('@/features/forecasting/ForecastingPage').then((m) => ({ default: m.ForecastingPage })));
const SimulatorPage   = React.lazy(() => import('@/features/simulator/SimulatorPage').then((m) => ({ default: m.SimulatorPage })));
const AlertsPage      = React.lazy(() => import('@/features/alerts/AlertsPage').then((m) => ({ default: m.AlertsPage })));
const CostPage        = React.lazy(() => import('@/features/cost/CostPage').then((m) => ({ default: m.CostPage })));
const ReportsPage     = React.lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const SettingsPage    = React.lazy(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-ink-muted">Loading…</span>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/login',            element: <LoginPage /> },
  { path: '/register',         element: <RegisterPage /> },
  { path: '/pending-approval', element: <ApprovalPendingPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <Shell />,
        children: [
          { index: true, element: <Navigate to="/app" replace /> },
          { path: 'app',             element: <CommandCenterPage /> },
          { path: 'app/inventory',   element: <React.Suspense fallback={<PageFallback />}><InventoryPage /></React.Suspense> },
          { path: 'app/procurement', element: <React.Suspense fallback={<PageFallback />}><ProcurementPage /></React.Suspense> },
          { path: 'app/suppliers',   element: <React.Suspense fallback={<PageFallback />}><SuppliersPage /></React.Suspense> },
          { path: 'app/warehouse',   element: <React.Suspense fallback={<PageFallback />}><WarehousePage /></React.Suspense> },
          { path: 'app/forecasting', element: <React.Suspense fallback={<PageFallback />}><ForecastingPage /></React.Suspense> },
          { path: 'app/simulator',   element: <React.Suspense fallback={<PageFallback />}><SimulatorPage /></React.Suspense> },
          { path: 'app/alerts',      element: <React.Suspense fallback={<PageFallback />}><AlertsPage /></React.Suspense> },
          { path: 'app/cost',        element: <React.Suspense fallback={<PageFallback />}><CostPage /></React.Suspense> },
          { path: 'app/reports',     element: <React.Suspense fallback={<PageFallback />}><ReportsPage /></React.Suspense> },
          { path: 'app/settings',    element: <React.Suspense fallback={<PageFallback />}><SettingsPage /></React.Suspense> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
