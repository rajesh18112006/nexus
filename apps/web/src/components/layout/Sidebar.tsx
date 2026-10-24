import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, BarChart2,
  Sliders, Warehouse, Bell, TrendingUp, FileText, Settings,
  ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app',            icon: LayoutDashboard, label: 'Command Center', section: 'overview' },
  { to: '/app/inventory',  icon: Package,         label: 'Inventory',      section: 'overview' },
  { to: '/app/procurement',icon: ShoppingCart,    label: 'Procurement',    section: 'operations' },
  { to: '/app/suppliers',  icon: Truck,           label: 'Suppliers',      section: 'operations' },
  { to: '/app/warehouse',  icon: Warehouse,       label: 'Warehouse',      section: 'operations' },
  { to: '/app/forecasting',icon: TrendingUp,      label: 'Forecast Lab',   section: 'intelligence' },
  { to: '/app/simulator',  icon: Sliders,         label: 'Simulator',      section: 'intelligence' },
  { to: '/app/alerts',     icon: Bell,            label: 'Alerts',         section: 'intelligence' },
  { to: '/app/cost',       icon: BarChart2,       label: 'Cost & Savings', section: 'analytics' },
  { to: '/app/reports',    icon: FileText,        label: 'Reports',        section: 'analytics' },
  { to: '/app/settings',   icon: Settings,        label: 'Settings',       section: 'system' },
];

const SECTIONS = [
  { key: 'overview',      label: null },
  { key: 'operations',    label: 'Operations' },
  { key: 'intelligence',  label: 'Intelligence' },
  { key: 'analytics',     label: 'Analytics' },
  { key: 'system',        label: 'System' },
];

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  const groupedItems = SECTIONS.map((sec) => ({
    ...sec,
    items: NAV_ITEMS.filter((i) => i.section === sec.key),
  })).filter((s) => s.items.length > 0);

  return (
    <motion.aside
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="shell-sidebar flex flex-col overflow-hidden"
      style={{ minWidth: collapsed ? 56 : 240 }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center h-[52px] px-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Logo mark */}
          <div className="w-7 h-7 rounded bg-accent flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <span className="text-md font-display font-semibold text-ink tracking-tight">
                  NEXUS
                </span>
                <span className="block text-2xs text-ink-faint leading-none -mt-0.5">
                  {user?.organizationName}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={toggle}
          className="w-5 h-5 flex items-center justify-center text-ink-faint hover:text-ink flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-4">
        {groupedItems.map((sec) => (
          <div key={sec.key}>
            {sec.label && !collapsed && (
              <div className="px-3 mb-1">
                <span className="text-2xs font-medium text-ink-faint tracking-wider uppercase">
                  {sec.label}
                </span>
              </div>
            )}
            <ul className="space-y-0.5 px-2">
              {sec.items.map((item) => {
                const isActive = item.to === '/app'
                  ? location.pathname === '/app'
                  : location.pathname.startsWith(item.to);
                const Icon = item.icon;

                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors duration-100',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                        isActive
                          ? 'bg-accent/10 text-accent font-medium'
                          : 'text-ink-muted hover:text-ink hover:bg-surface-overlay'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn('flex-shrink-0', collapsed ? 'w-4.5 h-4.5' : 'w-4 h-4')}
                        strokeWidth={isActive ? 2.5 : 2}
                        style={{ width: collapsed ? 18 : 16, height: collapsed ? 18 : 16 }}
                      />
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-auto text-2xs bg-critical text-white rounded-full w-4 h-4 flex items-center justify-center num flex-shrink-0">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className={cn('px-3 py-3 border-t border-border flex items-center gap-2 flex-shrink-0')}>
          <div className="w-7 h-7 rounded bg-surface-overlay flex items-center justify-center flex-shrink-0 text-xs font-medium text-ink-secondary font-display">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-xs font-medium text-ink truncate">{user.firstName} {user.lastName}</div>
                <div className="text-2xs text-ink-faint truncate capitalize">{user.role.replace(/_/g, ' ')}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.aside>
  );
}
