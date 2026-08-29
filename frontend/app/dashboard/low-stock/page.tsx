"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "../../../components/data-table";
import { columns } from "./features/columns";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangleIcon, CheckCircle2Icon, RefreshCwIcon } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { fetchLowStockProducts, type LowStockProduct } from "@/lib/low-stock";

const Page = () => {
  const prefs = usePreferences();
  const [products, setProducts] = useState<LowStockProduct[] | null>(null);

  const load = useCallback(() => {
    let active = true;
    setProducts(null);
    fetchLowStockProducts(prefs.lowStockThreshold)
      .then((rows) => {
        if (active) setProducts(rows);
      })
      .catch((error) => {
        console.error("Failed to fetch low-stock products:", error);
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, [prefs.lowStockThreshold]);

  useEffect(() => load(), [load]);

  const tableColumns = useMemo(() => columns(), []);
  const loading = products === null;
  const rows = products ?? [];

  return (
    <div className="py-4 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Low Stock Alerts
            {!loading && rows.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangleIcon className="size-3.5" />
                {rows.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            <span>
              Products at or below their reorder level. Click{" "}
              <span className="font-medium">Reorder</span> to raise a purchase to
              the supplier — recording it restocks the product automatically.
            </span>
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCwIcon className="size-4" />
              Refresh
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <span>Loading...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <CheckCircle2Icon className="size-8 text-emerald-500" />
              <span>All products are above their reorder level.</span>
            </div>
          ) : (
            <DataTable columns={tableColumns} data={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
