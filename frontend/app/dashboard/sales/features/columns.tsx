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

export type Sales = {
  id: number;
  documentId: string;
  date: string;
  total: number;
  customer_name: string;
};

export type SalesFilters = {
  date?: string;
  total?: string;
  customer_name?: string;
};

export type HandleFilterChange = (
  key: keyof SalesFilters,
  value: string,
) => void;

export const columns = (
  filters: SalesFilters,
  handleFilterChange: HandleFilterChange,
  onEdit: (Sales: Sales) => void,
  onDelete: (documentId: string) => void,
): ColumnDef<Sales>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "customer_name",
    header: () => (
      <ColumnFilter
        columnLabel="Customer name"
        placeholder="Filter name...."
        columnValue={filters.customer_name || ""}
        onChange={(val) => handleFilterChange("customer_name", val)}
      />
    ),

    cell: (info) => info.getValue(),
  },
    {
    accessorKey: "date",
    header: () => (
      <ColumnFilter
        columnLabel="Date"
        placeholder="Filter date...."
        columnValue={filters.date || ""}
        onChange={(val) => handleFilterChange("date", val)}
      />
    ),

    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "total",
    header: () => (
      <ColumnFilter
        columnLabel="Total"
        placeholder="Filter total"
        columnValue={filters.total || ""}
        onChange={(val) => handleFilterChange("total", val)}
      />
    ),

    cell: (info) => info.getValue(),
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
