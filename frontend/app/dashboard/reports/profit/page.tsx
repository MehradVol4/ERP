"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DataTable } from "../../../../components/data-table";
import { columns } from "./features/columns";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDownIcon, TrophyIcon, TrendingUpIcon } from "lucide-react";
import { usePreferences, formatCurrency } from "@/lib/preferences";
import {
  fetchProfitReport,
  RANGE_OPTIONS,
  type DateRange,
  type ProductProfit,
  type ProfitReport,
} from "@/lib/profit-report";

type SortKey = "profit" | "revenue" | "cost" | "unitsSold" | "margin";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "profit", label: "Profit" },
  { value: "revenue", label: "Revenue" },
  { value: "unitsSold", label: "Units sold" },
  { value: "margin", label: "Margin" },
  { value: "cost", label: "Cost" },
];

const formatPct = (value: number | null) =>
  value === null ? "—" : `${(value * 100).toFixed(1)}%`;

/** A compact horizontal-bar leaderboard for a single metric. */
function Leaderboard({
  title,
  icon,
  rows,
  valueOf,
  labelOf,
}: {
  title: string;
  icon: React.ReactNode;
  rows: ProductProfit[];
  valueOf: (p: ProductProfit) => number;
  labelOf: (p: ProductProfit) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => Math.max(0, valueOf(r))));
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <span className="text-sm text-muted-foreground">No data yet.</span>
        ) : (
          rows.map((row) => {
            const value = valueOf(row);
            const width = `${Math.max(2, (Math.max(0, value) / max) * 100)}%`;
            return (
              <div key={row.productId} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {labelOf(row)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "negative";
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={
            "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl " +
            (accent === "positive"
              ? "text-emerald-600 dark:text-emerald-400"
              : accent === "negative"
                ? "text-red-600 dark:text-red-400"
                : "")
          }
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

const Page = () => {
  const prefs = usePreferences();
  const currency = prefs.currency;
  const [range, setRange] = useState<DateRange>("all");
  const [report, setReport] = useState<ProfitReport | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("profit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const load = useCallback(() => {
    let active = true;
    setReport(null);
    fetchProfitReport(range)
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((error) => {
        console.error("Failed to build profit report:", error);
        if (active) setReport({ products: [], totals: { revenue: 0, cost: 0, profit: 0, unitsSold: 0, margin: null } });
      });
    return () => {
      active = false;
    };
  }, [range]);

  useEffect(() => load(), [load]);

  const loading = report === null;
  const products = report?.products ?? [];
  const totals = report?.totals;

  const sorted = useMemo(() => {
    const copy = [...products];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // null margins always sort to the bottom regardless of direction.
      if (av === null) return 1;
      if (bv === null) return -1;
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return copy;
  }, [products, sortKey, sortDir]);

  const topByProfit = useMemo(
    () =>
      [...products]
        .filter((p) => p.profit > 0)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5),
    [products],
  );
  const topByUnits = useMemo(
    () => [...products].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5),
    [products],
  );

  const tableColumns = useMemo(() => columns(currency), [currency]);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Profit Report</CardTitle>
          <CardDescription>
            <span>
              Which products earn the most and which sell best — from real sales.
            </span>
          </CardDescription>
          <CardAction>
            <Select value={range} onValueChange={(v) => setRange(v as DateRange)}>
              <SelectTrigger className="w-40" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <span>Loading...</span>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No sales in this period yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label="Revenue"
              value={formatCurrency(totals?.revenue ?? 0, currency)}
            />
            <StatTile
              label="Cost of goods"
              value={formatCurrency(totals?.cost ?? 0, currency)}
            />
            <StatTile
              label="Gross profit"
              value={formatCurrency(totals?.profit ?? 0, currency)}
              accent={(totals?.profit ?? 0) >= 0 ? "positive" : "negative"}
            />
            <StatTile label="Margin" value={formatPct(totals?.margin ?? null)} />
          </div>

          {/* Leaderboards */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Leaderboard
              title="Most profitable"
              icon={<TrophyIcon className="size-4 text-amber-500" />}
              rows={topByProfit}
              valueOf={(p) => p.profit}
              labelOf={(p) => formatCurrency(p.profit, currency)}
            />
            <Leaderboard
              title="Best sellers (by units)"
              icon={<TrendingUpIcon className="size-4 text-primary" />}
              rows={topByUnits}
              valueOf={(p) => p.unitsSold}
              labelOf={(p) => `${p.unitsSold.toLocaleString()} units`}
            />
          </div>

          {/* Full sortable table */}
          <Card className="@container/card">
            <CardHeader>
              <CardTitle>All products</CardTitle>
              <CardDescription>
                <span>{products.length} products with sales in this period.</span>
              </CardDescription>
              <CardAction className="flex items-center gap-2">
                <Select
                  value={sortKey}
                  onValueChange={(v) => setSortKey(v as SortKey)}
                >
                  <SelectTrigger className="w-36" aria-label="Sort by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Sort ${sortDir === "desc" ? "descending" : "ascending"}`}
                  onClick={() =>
                    setSortDir((d) => (d === "desc" ? "asc" : "desc"))
                  }
                >
                  <ArrowUpDownIcon className="size-4" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DataTable columns={tableColumns} data={sorted} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Page;
