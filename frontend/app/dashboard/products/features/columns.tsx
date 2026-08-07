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
import { EllipsisVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ColumnFilter from "@/components/ColumnFilter";

export type Product = {
  id: number;
  documentId: string;
  name: string;
  price: number;
  stock : number ;
  barcode: string;
  description: string | null;
};

export type ProductsFilters = {
  name?: string;
  price?:number;
  stock?:number;
  description?: string;
};

export type HandleFilterChange = (
  key: keyof ProductsFilters,
  value: string,
) => void;

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
        placeholder="Filter pricce...."
        //@ts-expect-error
        columnValue={filters.price}
        onChange={(val) => handleFilterChange("price", val)}
      />
    ),

    cell: (info) => info.getValue(),
  },
    {
    accessorKey: "stock",
    header: () => (
      <ColumnFilter
        columnLabel="Stock"
        placeholder="Filter stock"
        //@ts-expect-error
        columnValue={filters.stock || ""}
        onChange={(val) => handleFilterChange("stock", val)}
      />
    ),
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
