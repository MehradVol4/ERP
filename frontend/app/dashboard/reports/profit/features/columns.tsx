"use client";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, type CurrencyCode } from "@/lib/preferences";
import type { ProductProfit } from "@/lib/profit-report";

const formatPct = (value: number | null) =>
  value === null ? "—" : `${(value * 100).toFixed(1)}%`;

export const columns = (
  currency: CurrencyCode,
): ColumnDef<ProductProfit>[] => [
  {
    accessorKey: "name",
    header: "Product",
    cell: (info) => (
      <span className="font-medium">{info.getValue() as string}</span>
    ),
  },
  {
    accessorKey: "unitsSold",
    header: "Units sold",
    cell: (info) => (info.getValue() as number).toLocaleString(),
  },
  {
    accessorKey: "orders",
    header: "Orders",
    cell: (info) => (info.getValue() as number).toLocaleString(),
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: (info) => formatCurrency(info.getValue() as number, currency),
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: (info) => formatCurrency(info.getValue() as number, currency),
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ row }) => {
      const profit = row.original.profit;
      return (
        <span
          className={
            profit > 0
              ? "font-semibold text-emerald-600 dark:text-emerald-400"
              : profit < 0
                ? "font-semibold text-red-600 dark:text-red-400"
                : "font-semibold text-muted-foreground"
          }
        >
          {formatCurrency(profit, currency)}
        </span>
      );
    },
  },
  {
    accessorKey: "margin",
    header: "Margin",
    cell: ({ row }) => {
      const margin = row.original.margin;
      if (margin === null) return <span className="text-muted-foreground">—</span>;
      if (margin < 0) {
        return <Badge variant="destructive">{formatPct(margin)}</Badge>;
      }
      return <span>{formatPct(margin)}</span>;
    },
  },
];
