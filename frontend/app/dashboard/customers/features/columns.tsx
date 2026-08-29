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

export type Customer = {
  id: number;
  documentId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export type CustomerFilters = {
  name?: string;
  phone?: string;
};

export type HandleFilterChange = (
  key: keyof CustomerFilters,
  value: string,
) => void;

export const columns = (
  filters: CustomerFilters,
  handleFilterChange: HandleFilterChange,
  onEdit: (customer: Customer) => void,
  onDelete: (documentId: string) => void,
): ColumnDef<Customer>[] => [
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
    accessorKey: "phone",
    header: () => (
      <ColumnFilter
        columnLabel="Phone"
        placeholder="Filter phone"
        columnValue={filters.phone || ""}
        onChange={(val) => handleFilterChange("phone", val)}
      />
    ),
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: (info) => info.getValue() ?? "—",
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
