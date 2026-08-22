"use client";

import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "./features/data-table";
import {
  columns,
  type Sales,
  type SalesFilters,
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
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import SalesView from "./features/sales-view";

type Pagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

type SalesResponse = {
  data: Sales[];
  meta: { pagination: Pagination };
};

type LoadedPage = {
  key: string;
  rows: Sales[];
  meta: Pagination | null;
};

const queryKey = (page: number, pageSize: number, filters: SalesFilters) =>
  `${page}|${pageSize}|${filters.customer_name ?? ""}|${filters.date ?? ""}|${filters.total ?? ""}`;

const Page = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [loaded, setLoaded] = useState<LoadedPage | null>(null);
  const [filters, setFilters] = useState<SalesFilters>({});
  const [viewDocumentId, setViewDocumentId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const router = useRouter();

  const handleFilterChange = useCallback(
    (key: keyof SalesFilters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );
  const fetchData = () => {
    let active = true;
    const key = queryKey(page, pageSize, filters);

    // Constrain results to today only: [start of today, start of tomorrow).
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    let query = `/api/sales?pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    query += `&filters[date][$gte]=${encodeURIComponent(startOfToday.toISOString())}`;
    query += `&filters[date][$lt]=${encodeURIComponent(startOfTomorrow.toISOString())}`;
    if (filters.customer_name) {
      query += `&filters[customer_name][$containsi]=${encodeURIComponent(filters.customer_name)}`;
    }
    if (filters.date) {
      query += `&filters[date][$containsi]=${encodeURIComponent(filters.date)}`;
    }
    if (filters.total) {
      query += `&filters[total][$containsi]=${encodeURIComponent(String(filters.total))}`;
    }
    axiosInstance
      .get<SalesResponse>(query)
      .then((response) => {
        if (!active) return;
        const rows = response.data.data.map((item) => ({
          id: item.id,
          documentId: item.documentId,
          date: item.date,
          total: item.total,
          customer_name: item.customer_name,
        }));
        setLoaded({ key, rows, meta: response.data.meta.pagination });
      })
      .catch((error) => {
        if (!active) return;

        console.error("Failed to fetch sales:", error);
        setLoaded({ key, rows: [], meta: null });
      });

    return () => {
      active = false;
    };
  };

  const handleDelete = useCallback(async (documentId: string) => {
    try {
      await axiosInstance.delete(`/api/sales/${documentId}`);
      toast.success("Sales deleted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete Sale");
      console.error(error);
    }
  }, []);
  const tableColumns = useMemo(
    () =>
      columns(
        filters,
        handleFilterChange,
        (item) => router.push(`/dashboard/sales/${item.documentId}/edit`),
        handleDelete,
        (item) => router.push(`/dashboard/sales/${item.documentId}/print`),
        (item) => {
          setViewDocumentId(item.documentId);
          setViewOpen(true);
        },
      ),
    [filters, handleFilterChange, handleDelete, router],
  );

  const loading = loaded?.key !== queryKey(page, pageSize, filters);
  const sales = loaded?.rows ?? [];
  const meta = loaded?.meta ?? null;

  useEffect(
    function () {
      return fetchData();
    },
    [page, pageSize, filters],
  );

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
          <CardTitle>Todays Sales</CardTitle>
          <CardDescription>
            <span>List of Todays Sales</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Spinner />
              <span>Loading...</span>
            </div>
          ) : (
            <DataTable columns={tableColumns} data={sales} />
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
                  : `Showing ${(meta.page - 1) * meta.pageSize + 1} to ${(meta.page - 1) * meta.pageSize + sales.length} of ${meta.total} rows`}
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

      <SalesView
        documentId={viewDocumentId}
        open={viewOpen}
        onOpenChange={setViewOpen}
      />
    </div>
  );
};

export default Page;
