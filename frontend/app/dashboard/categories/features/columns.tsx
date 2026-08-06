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

export type Category = {
  id: number;
  documentId: string;
  name: string;
  description: string | null;
};

export type CategoryFilters = {
  name?: string;
  description?: string;
};

export type HandleFilterChange = (
  key: keyof CategoryFilters,
  value: string,
) => void;

export const columns = (
  filters: CategoryFilters,
  handleFilterChange: HandleFilterChange,
  onEdit: (category: Category) => void,
): ColumnDef<Category>[] => [
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
    accessorKey: "description",
    header: () => (
      <ColumnFilter
        columnLabel="Description"
        placeholder="Filter description"
        columnValue={filters.description || ""}
        onChange={(val) => handleFilterChange("description", val)}
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
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
