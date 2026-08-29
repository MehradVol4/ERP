"use client";
import React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCartIcon } from "lucide-react";
import { reorderHref, type LowStockProduct } from "@/lib/low-stock";

export const columns = (): ColumnDef<LowStockProduct>[] => [
  {
    accessorKey: "name",
    header: "Product",
    cell: (info) => (
      <span className="font-medium">{info.getValue() as string}</span>
    ),
  },
  {
    accessorKey: "stock",
    header: "In stock",
    cell: ({ row }) => {
      const { stock } = row.original;
      return (
        <span
          className={
            stock <= 0
              ? "font-semibold text-red-600 dark:text-red-400"
              : "font-medium text-amber-600 dark:text-amber-400"
          }
        >
          {stock}
        </span>
      );
    },
  },
  {
    accessorKey: "reorderLevel",
    header: "Reorder level",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "shortfall",
    header: "Shortfall",
    cell: ({ row }) => {
      const { shortfall } = row.original;
      return shortfall > 0 ? (
        <Badge variant="destructive">-{shortfall}</Badge>
      ) : (
        <Badge variant="secondary">at level</Badge>
      );
    },
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier?.name ?? "—",
  },
  {
    id: "reorder",
    header: () => <span className="sr-only">Reorder</span>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <Link href={reorderHref(product)}>
          <Button size="sm" className="gap-1.5">
            <ShoppingCartIcon className="size-4" />
            Reorder {product.suggestedQty}
          </Button>
        </Link>
      );
    },
  },
];
