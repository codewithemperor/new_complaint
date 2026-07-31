"use client";

import type { ReactNode } from "react";

/**
 * DataTable — lightweight table wrapper for the consistent list-page look.
 *
 * NOTE: HeroUI v3's Table.Body uses RAC dynamic collections (Iterable items),
 * which adds type friction. For this project's small tables we use a plain
 * <table> with the HeroUI-themed classes — keeps the look while avoiding the
 * collection-type complexity. Shared so every list page renders identically.
 */
export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyLabel = "No records.",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-neutral-400">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                {...(onRowClick
                  ? { onClick: () => onRowClick(row), className: "cursor-pointer border-b border-neutral-100 hover:bg-neutral-50" }
                  : { className: "border-b border-neutral-100 hover:bg-neutral-50" })}
              >
                {columns.map((c) => {
                  const value = c.render ? c.render(row) : (row as Record<string, unknown>)[c.key];
                  return <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>{value as ReactNode}</td>;
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
