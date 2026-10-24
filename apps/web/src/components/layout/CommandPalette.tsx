import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, LayoutDashboard, Package, ShoppingCart, Truck, Warehouse,
  TrendingUp, Sliders, Bell, BarChart2, FileText, Settings, ArrowRight, Hash,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
  keywords?: string[];
}

function useCommandItems(navigate: ReturnType<typeof useNavigate>, close: () => void): CommandItem[] {
  return React.useMemo(() => [
    // Navigation
    { id: 'nav-dashboard',   label: 'Command Center',  description: 'Stock runway, alerts, actions',      icon: LayoutDashboard, action: () => { navigate('/app'); close(); },             group: 'Navigate', keywords: ['dashboard', 'home'] },
    { id: 'nav-inventory',   label: 'Inventory',        description: 'SKUs, stock levels, movements',      icon: Package,         action: () => { navigate('/app/inventory'); close(); },   group: 'Navigate' },
    { id: 'nav-procurement', label: 'Procurement',      description: 'Purchase orders, receipts',          icon: ShoppingCart,    action: () => { navigate('/app/procurement'); close(); }, group: 'Navigate' },
    { id: 'nav-suppliers',   label: 'Suppliers',        description: 'Supplier scorecards, comparison',    icon: Truck,           action: () => { navigate('/app/suppliers'); close(); },   group: 'Navigate' },
    { id: 'nav-warehouse',   label: 'Warehouse',        description: 'Map, slotting, dead stock, expiry',  icon: Warehouse,       action: () => { navigate('/app/warehouse'); close(); },   group: 'Navigate' },
    { id: 'nav-forecast',    label: 'Forecast Lab',     description: 'Demand forecasting, accuracy',       icon: TrendingUp,      action: () => { navigate('/app/forecasting'); close(); }, group: 'Navigate', keywords: ['forecasting'] },
    { id: 'nav-simulator',   label: 'Simulator',        description: 'What-if scenario modeling',          icon: Sliders,         action: () => { navigate('/app/simulator'); close(); },   group: 'Navigate', keywords: ['what-if'] },
    { id: 'nav-alerts',      label: 'Alerts',           description: 'Anomalies, risk signals',            icon: Bell,            action: () => { navigate('/app/alerts'); close(); },      group: 'Navigate' },
    { id: 'nav-cost',        label: 'Cost & Savings',   description: 'Inventory value, carrying cost',     icon: BarChart2,       action: () => { navigate('/app/cost'); close(); },        group: 'Navigate' },
    { id: 'nav-reports',     label: 'Reports',          description: 'Export CSV, Excel, PDF',             icon: FileText,        action: () => { navigate('/app/reports'); close(); },     group: 'Navigate' },
    { id: 'nav-settings',    label: 'Settings',         description: 'Org settings, users, approvals',     icon: Settings,        action: () => { navigate('/app/settings'); close(); },    group: 'Navigate' },
  ], [navigate, close]);
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const navigate = useNavigate();

  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const allItems = useCommandItems(navigate, close);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q))
    );
  }, [query, allItems]);

  // Group filtered items
  const grouped = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return map;
  }, [filtered]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(0);
    setTimeout(() => inputRef.current?.focus(), 50);

    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter')     { filtered[selected]?.action(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, close, filtered, selected]);

  // Global shortcut: Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        open ? close() : useUIStore.getState().openCommandPalette();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, close]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="cmd-overlay"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="cmd-box mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-ink-faint flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Search or jump to…"
                className="flex-1 text-sm text-ink bg-transparent outline-none placeholder:text-ink-faint"
              />
              <kbd className="text-2xs bg-surface-raised border border-border rounded px-1.5 py-0.5 font-mono text-ink-faint">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-ink-faint">
                  No results for "{query}"
                </div>
              ) : (
                Array.from(grouped.entries()).map(([group, items]) => (
                  <div key={group}>
                    <div className="px-4 py-1 text-2xs font-medium text-ink-faint tracking-wider uppercase">
                      {group}
                    </div>
                    {items.map((item) => {
                      const idx = globalIdx++;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={item.action}
                          onMouseEnter={() => setSelected(idx)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                            selected === idx ? 'bg-surface-raised' : 'hover:bg-surface-raised'
                          )}
                        >
                          <span className={cn('flex-shrink-0 w-7 h-7 rounded flex items-center justify-center',
                            selected === idx ? 'bg-accent/10 text-accent' : 'bg-surface-overlay text-ink-muted'
                          )}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-ink font-medium">{item.label}</div>
                            {item.description && (
                              <div className="text-xs text-ink-faint truncate">{item.description}</div>
                            )}
                          </div>
                          {selected === idx && (
                            <ArrowRight className="w-3.5 h-3.5 text-ink-faint flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-2xs text-ink-faint">
              <span className="flex items-center gap-1"><kbd className="font-mono bg-surface-raised border border-border rounded px-1">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="font-mono bg-surface-raised border border-border rounded px-1">↵</kbd> select</span>
              <span className="flex items-center gap-1"><kbd className="font-mono bg-surface-raised border border-border rounded px-1">esc</kbd> close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
