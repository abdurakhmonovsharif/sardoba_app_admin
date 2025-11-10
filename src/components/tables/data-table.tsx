"use client";

import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  rowClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  total = data.length,
  page = 1,
  pageSize = 10,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
  onRowClick,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const goToPage = (next: number) => {
    if (!onPageChange) return;
    if (next < 1 || next > totalPages) return;
    onPageChange(next);
  };

  return (
    <div className="space-y-4">
      {onSearch && (
        <Input placeholder={searchPlaceholder} onChange={(event) => onSearch(event.target.value)} className="max-w-sm" />
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <table className="w-full">
          <thead className="bg-muted/50 text-left text-sm text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-border/60 text-sm transition hover:bg-muted/40",
                    rowClassName,
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {onPageChange && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline" onClick={() => goToPage(page + 1)} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
