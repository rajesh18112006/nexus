import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// ─── Column Definition ────────────────────────────────────────────────────────
export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'right' | 'center';
  pinLeft?: boolean;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  stickyHeader?: boolean;
  className?: string;
  rowClassName?: (row: T) => string | undefined;
}

function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy?: string; sortOrder?: string }) {
  if (sortBy !== column) return <ChevronsUpDown className="w-3 h-3 text-ink-faint" />;
  return sortOrder === 'asc'
    ? <ChevronUp className="w-3 h-3 text-accent" />
    : <ChevronDown className="w-3 h-3 text-accent" />;
}

const SKELETON_ROWS = 8;

export function Table<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyState,
  onRowClick,
  selectedKeys,
  onSelectionChange,
  sortBy,
  sortOrder,
  onSort,
  stickyHeader = true,
  className,
  rowClassName,
}: TableProps<T>) {
  const selectable = !!onSelectionChange;

  const toggleAll = () => {
    if (!selectable) return;
    if (selectedKeys?.size === data.length) {
      onSelectionChange!(new Set());
    } else {
      onSelectionChange!(new Set(data.map(rowKey)));
    }
  };

  const toggleRow = (key: string) => {
    if (!selectable) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange!(next);
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm font-ui">
        {/* ── Header ── */}
        <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
          <tr className="bg-surface-raised border-b border-border">
            {selectable && (
              <th className="w-8 px-3 py-2 text-left border-r border-border/50">
                <input
                  type="checkbox"
                  className="rounded-sm"
                  checked={selectedKeys?.size === data.length && data.length > 0}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  'px-3 py-2 font-medium text-xs text-ink-muted tracking-wide uppercase',
                  'whitespace-nowrap border-b border-border',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.pinLeft && 'sticky left-0 bg-surface-raised z-10',
                  col.sortable && 'cursor-pointer select-none hover:text-ink',
                  col.className
                )}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && <SortIcon column={col.key} sortBy={sortBy} sortOrder={sortOrder} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {loading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {selectable && <td className="px-3 py-2.5"><span className="skeleton w-4 h-4 block" /></td>}
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2.5">
                    <span className="skeleton h-3 block" style={{ width: `${60 + Math.random() * 30}%` }} />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-16 text-center">
                {emptyState ?? (
                  <div className="flex flex-col items-center gap-2 text-ink-muted">
                    <span className="text-2xl">—</span>
                    <span className="text-sm">No data found</span>
                  </div>
                )}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key = rowKey(row);
              const isSelected = selectedKeys?.has(key) ?? false;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(row)}
                  className={cn(
                    'border-b border-border/50',
                    'transition-colors duration-75',
                    isSelected ? 'bg-accent-muted' : 'hover:bg-surface-raised',
                    onRowClick && 'cursor-pointer',
                    rowClassName?.(row)
                  )}
                >
                  {selectable && (
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded-sm"
                        checked={isSelected}
                        onChange={() => toggleRow(key)}
                        aria-label={`Select row ${key}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-2.5',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.pinLeft && 'sticky left-0 bg-surface z-10',
                        col.className
                      )}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-ink-muted">
      <span className="num">{from}–{to} of {total.toLocaleString('en-IN')}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-surface-raised disabled:opacity-40"
        >
          ‹
        </button>
        <span className="px-2 num">{page} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-surface-raised disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}
