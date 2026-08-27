"use client";
import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon, AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ColumnFilter from "@/components/ColumnFilter";

export type Supplier = {
  id: number;
  documentId: string;
  name: string;
};

export type Product = {
  id: number;
  documentId: string;
  name: string;
  price: number;
  cost_price?: number | null;
  stock: number;
  reorder_level?: number | null;
  barcode: string;
  description: string | null;
  supplier?: Supplier | null;
};

export type ProductsFilters = {
  name?: string;
  price?: number;
  stock?: number;
  description?: string;
};

export type HandleFilterChange = (
  key: keyof ProductsFilters,
  value: string,
) => void;

/** A product is "low" when its stock is at or below its reorder level. */
export function isLowStock(product: Pick<Product, "stock" | "reorder_level">): boolean {
  const level = product.reorder_level ?? 0;
  return typeof product.stock === "number" && product.stock <= level;
}

export const columns = (
  filters: ProductsFilters,
  handleFilterChange: HandleFilterChange,
  onEdit: (product: Product) => void,
  onDelete: (documentId: string) => void,
): ColumnDef<Product>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: () => (
      <ColumnFilter
        columnLabel="Name"
        placeholder="Filter name...."
        columnValue={filters.name || ""}
        onChange={(val) => handleFilterChange("name", val)}
      />
    ),

    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "price",
    header: () => (
      <ColumnFilter
        columnLabel="Price"
        placeholder="Filter price...."
        //@ts-expect-error columnValue accepts string
        columnValue={filters.price}
        onChange={(val) => handleFilterChange("price", val)}
      />
    ),

    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "cost_price",
    header: "Cost",
    cell: (info) => {
      const value = info.getValue<number | null | undefined>();
      return value == null ? "—" : value;
    },
  },
  {
    accessorKey: "stock",
    header: () => (
      <ColumnFilter
        columnLabel="Stock"
        placeholder="Filter stock"
        //@ts-expect-error columnValue accepts string
        columnValue={filters.stock || ""}
        onChange={(val) => handleFilterChange("stock", val)}
      />
    ),
    cell: ({ row }) => {
      const product = row.original;
      if (isLowStock(product)) {
        return (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400"
          >
            <AlertTriangleIcon className="size-3" />
            {product.stock}
          </Badge>
        );
      }
      return product.stock;
    },
  },
  {
    accessorKey: "reorder_level",
    header: "Reorder at",
    cell: (info) => {
      const value = info.getValue<number | null | undefined>();
      return value == null ? "—" : value;
    },
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier?.name ?? "—",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="flex size-8 text-muted-foreground data-open:bg-muted"
              size="icon"
            />
          }
        >
          <EllipsisVerticalIcon />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              onDelete(row.original.documentId);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
