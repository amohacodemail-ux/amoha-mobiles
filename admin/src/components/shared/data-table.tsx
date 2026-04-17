'use client';
import React from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  toolbar?: React.ReactNode;
  emptyMessage?: string;
  rowKey: (row: T) => string;
  expandedRow?: string | null;
  renderExpandedRow?: (row: T) => React.ReactNode;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded shimmer w-full" />
        </td>
      ))}
    </tr>
  );
}

export function DataTable<T>({
  columns, data, loading = false,
  searchValue, onSearchChange, searchPlaceholder = 'Search...',
  sortBy, sortOrder, onSort,
  toolbar, emptyMessage = 'No records found.',
  rowKey, expandedRow, renderExpandedRow,
}: DataTableProps<T>) {
  const safeData = Array.isArray(data) ? data : [];
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {onSearchChange && (
          <div className="w-full sm:w-72">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        )}
        {toolbar && <div className="flex items-center gap-2 ml-auto">{toolbar}</div>}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      col.className,
                    )}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span className="text-muted-foreground/50">
                          {sortBy === col.key ? (
                            sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
                : safeData.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-16 text-center text-muted-foreground">
                      {emptyMessage}
                    </td>
                  </tr>
                )
                : safeData.map((row) => (
                  <React.Fragment key={rowKey(row)}>
                    <tr className="hover:bg-secondary/20 transition-colors">
                      {columns.map((col) => (
                        <td key={col.key} className={cn('px-4 py-3 text-foreground', col.className)}>
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                    {expandedRow === rowKey(row) && renderExpandedRow && (
                      <tr>
                        <td colSpan={columns.length}>
                          {renderExpandedRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
