"use client";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import ColumnFilter from "@/components/ColumnFilter";

export type MovementType =
  | "sale"
  | "purchase"
  | "adjustment"
  | "return"
  | "initial";

export type StockMovement = {
  id: number;
  documentId: string;
  productName: string;
  change: number;
  resulting_stock: number | null;
  type: MovementType;
  reference: string | null;
  note: string | null;
  movement_date: string | null;
};

export type StockMovementFilters = {
  product?: string;
};

export type HandleFilterChange = (
  key: keyof StockMovementFilters,
  value: string,
) => void;

/** Colour each movement type so the ledger is scannable at a glance. */
const TYPE_VARIANT: Record<
  MovementType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  sale: "destructive",
  purchase: "default",
  adjustment: "secondary",
  return: "outline",
  initial: "outline",
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
};

export const columns = (
  filters: StockMovementFilters,
  handleFilterChange: HandleFilterChange,
): ColumnDef<StockMovement>[] => [
  {
    accessorKey: "movement_date",
    header: "Date",
    cell: (info) => formatDate(info.getValue() as string | null),
  },
  {
    accessorKey: "productName",
    header: () => (
      <ColumnFilter
        columnLabel="Product"
        placeholder="Filter product..."
        columnValue={filters.product || ""}
        onChange={(val) => handleFilterChange("product", val)}
      />
    ),
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge variant={TYPE_VARIANT[type] ?? "outline"} className="capitalize">
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "change",
    header: "Change",
    cell: ({ row }) => {
      const change = row.original.change ?? 0;
      const positive = change > 0;
      return (
        <span
          className={
            positive
              ? "font-medium text-emerald-600 dark:text-emerald-400"
              : change < 0
                ? "font-medium text-red-600 dark:text-red-400"
                : "font-medium text-muted-foreground"
          }
        >
          {positive ? `+${change}` : change}
        </span>
      );
    },
  },
  {
    accessorKey: "resulting_stock",
    header: "Resulting stock",
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "reference",
    header: "Reference",
    cell: (info) => {
      const value = info.getValue() as string | null;
      if (!value) return "—";
      return (
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      );
    },
  },
  {
    accessorKey: "note",
    header: "Note",
    cell: (info) => info.getValue() ?? "—",
  },
];
