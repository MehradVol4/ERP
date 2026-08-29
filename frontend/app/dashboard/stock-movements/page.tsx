"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "../../../components/data-table";
import {
  columns,
  type StockMovement,
  type StockMovementFilters,
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import axiosInstance from "@/lib/axios";

type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

type RawMovement = {
  id: number;
  documentId: string;
  change: number;
  resulting_stock: number | null;
  type: StockMovement["type"];
  reference: string | null;
  note: string | null;
  movement_date: string | null;
  product?: { name?: string | null } | null;
};

type MovementsResponse = {
  data: RawMovement[];
  meta: { pagination: Pagination };
};

type LoadedPage = {
  key: string;
  rows: StockMovement[];
  meta: Pagination | null;
};

const queryKey = (
  page: number,
  pageSize: number,
  filters: StockMovementFilters,
) => `${page}|${pageSize}|${filters.product ?? ""}`;

const Page = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loaded, setLoaded] = useState<LoadedPage | null>(null);
  const [filters, setFilters] = useState<StockMovementFilters>({});

  const handleFilterChange = useCallback(
    (key: keyof StockMovementFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );

  const fetchData = useCallback(() => {
    setLoaded(null);
    let active = true;
    const key = queryKey(page, pageSize, filters);

    let query = `/api/stock-movements?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort=movement_date:desc&populate[product][fields][0]=name`;
    if (filters.product) {
      query += `&filters[product][name][$containsi]=${encodeURIComponent(filters.product)}`;
    }
    axiosInstance
      .get<MovementsResponse>(query)
      .then((response) => {
        if (!active) return;
        const rows: StockMovement[] = response.data.data.map((item) => ({
          id: item.id,
          documentId: item.documentId,
          productName: item.product?.name ?? "—",
          change: item.change,
          resulting_stock: item.resulting_stock,
          type: item.type,
          reference: item.reference,
          note: item.note,
          movement_date: item.movement_date,
        }));
        setLoaded({ key, rows, meta: response.data.meta.pagination });
      })
      .catch((error) => {
        if (!active) return;
        console.error("Failed to fetch stock movements:", error);
        setLoaded({ key, rows: [], meta: null });
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, filters]);

  const tableColumns = useMemo(
    () => columns(filters, handleFilterChange),
    [filters, handleFilterChange],
  );

  const loading = loaded?.key !== queryKey(page, pageSize, filters);
  const movements = loaded?.rows ?? [];
  const meta = loaded?.meta ?? null;

  useEffect(() => {
    return fetchData();
  }, [fetchData]);

  const handlePageSize = (value: string | null) => {
    if (value === null) return;
    setPageSize(Number(value));
    setPage(1);
  };

  const pageCount = meta?.pageCount ?? 1;
  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < pageCount && !loading;

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Stock Movements</CardTitle>
          <CardDescription>
            <span>
              Every change to product stock — sales, purchases and adjustments —
              recorded automatically.
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <span>Loading...</span>
            </div>
          ) : (
            <DataTable columns={tableColumns} data={movements} />
          )}

          <div className="flex flex-col gap-4 mt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={handlePageSize}>
                <SelectTrigger className="w-20 h-8" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {meta && (
              <span>
                {meta.total === 0
                  ? "No Rows"
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${(meta.page - 1) * meta.pageSize + movements.length} of ${meta.total} rows`}
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
