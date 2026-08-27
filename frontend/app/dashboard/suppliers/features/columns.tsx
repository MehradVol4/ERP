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

export type Supplier = {
  id: number;
  documentId: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export type SupplierFilters = {
  name?: string;
  contact_person?: string;
  phone?: string;
};

export type HandleFilterChange = (
  key: keyof SupplierFilters,
  value: string,
) => void;

export const columns = (
  filters: SupplierFilters,
  handleFilterChange: HandleFilterChange,
  onEdit: (supplier: Supplier) => void,
  onDelete: (documentId: string) => void,
): ColumnDef<Supplier>[] => [
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
    accessorKey: "contact_person",
    header: () => (
      <ColumnFilter
        columnLabel="Contact"
        placeholder="Filter contact"
        columnValue={filters.contact_person || ""}
        onChange={(val) => handleFilterChange("contact_person", val)}
      />
    ),
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "email",
    header: "Email",
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
