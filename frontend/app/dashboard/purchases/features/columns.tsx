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

export type Purchase = {
  id: number;
  documentId: string;
  reference: string | null;
  date: string | null;
  total: number | null;
  supplier: { id: number; name: string } | null;
};

export const columns = (
  onDelete: (documentId: string) => void,
): ColumnDef<Purchase>[] => [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "reference",
    header: "Reference",
    cell: (info) => info.getValue() ?? "—",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const value = row.original.date;
      return value ? new Date(value).toLocaleDateString() : "—";
    },
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) => row.original.supplier?.name ?? "—",
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: (info) => {
      const value = info.getValue<number | null>();
      return value == null ? "—" : Number(value).toFixed(2);
    },
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
