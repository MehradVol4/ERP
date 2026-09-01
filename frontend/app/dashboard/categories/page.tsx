"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "../../../components/data-table";
import {
  columns,
  type Category,
  type CategoryFilters,
} from "./features/columns";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { Sheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import New from "./features/new";

type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

type CategoriesResponse = {
  data: Category[];
  meta: { pagination: Pagination };
};

type LoadedPage = {
  key: string;
  rows: Category[];
  meta: Pagination | null;
};

const queryKey = (page: number, pageSize: number, filters: CategoryFilters) =>
  `${page}|${pageSize}|${filters.name ?? ""}`;

const Page = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loaded, setLoaded] = useState<LoadedPage | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Category | null>(null);

  const handleFilterChange = useCallback(
    (key: keyof CategoryFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );
  const fetchData = () => {
    //@ts-expect-error
    setLoaded(true);
    let active = true;
    const key = queryKey(page, pageSize, filters);

    let query = `/api/categories?pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    if (filters.name) {
      query += `&filters[name][$containsi]=${encodeURIComponent(filters.name)}`;
    }
    axiosInstance
      .get<CategoriesResponse>(query)
      .then((response) => {
        if (!active) return;
        const rows = response.data.data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          documentId: item.documentId,
        }));
        setLoaded({ key, rows, meta: response.data.meta.pagination });
      })
      .catch((error) => {
        if (!active) return;

        console.error("Failed to fetch categories:", error);
        setLoaded({ key, rows: [], meta: null });
      });

    return () => {
      active = false;
    };
  };

  const handleDelete = useCallback(async (documentId: string) => {
    try {
      await axiosInstance.delete(`/api/categories/${documentId}`);
      toast.success("Category deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete category");
      console.error(error);
    }
  }, []);
  const tableColumns = useMemo(
    () =>
      columns(
        filters,
        handleFilterChange,
        (item) => {
          setSelectedItem(item);
          setSheetOpen(true);
        },
        handleDelete,
      ),
    [filters, handleFilterChange, handleDelete],
  );

  const loading = loaded?.key !== queryKey(page, pageSize, filters);
  const categories = loaded?.rows ?? [];
  const meta = loaded?.meta ?? null;

  useEffect(
    function () {
      fetchData();
    },
    [page, pageSize, filters],
  );

  const handlePageSize = (value: string | null) => {
    if (value === null) return;
    setPageSize(Number(value));
    setPage(1);
  };
  //@ts-ignore

  const pageCount = meta?.pageCount ?? 1;
  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < pageCount && !loading;

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            <span>List of categories</span>
          </CardDescription>
          <CardAction>
            <Button
              onClick={() => {
                setSheetOpen(true);
                setSelectedItem(null);
              }}
            >
              Add new record
            </Button>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <New
                item={selectedItem}
                isOpen={sheetOpen}
                onSuccess={() => {
                  setSheetOpen(false);
                  fetchData();
                }}
              />
            </Sheet>
          </CardAction>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Loading...</span>
            </div>
          ) : (
            <DataTable columns={tableColumns} data={categories} />
          )}

          <div className="flex flex-col gap-4 mt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={handlePageSize}>
                <SelectTrigger className="w-20 h-8" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {meta && (
              <span>
                {meta.total === 0
                  ? "No Rows"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${(meta.page - 1) * meta.pageSize + categories.length} of ${meta.total} rows`}
              </span>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous page"
                disabled={!canGoPrevious}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeftIcon />
              </Button>
              <span>
                Page {page} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next page"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRightIcon />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
