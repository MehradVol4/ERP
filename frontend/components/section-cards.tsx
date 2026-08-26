"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  PackageIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchDashboardStats,
  type DashboardStats,
} from "@/lib/dashboard-stats"
import { usePreferences, formatCurrency } from "@/lib/preferences"

const number = new Intl.NumberFormat("en-US")

function formatPct(pct: number): string {
  const sign = pct > 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}%`
}

/** A trend chip driven by a signed percentage; null renders nothing. */
function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null
  const up = pct >= 0
  return (
    <Badge variant="outline">
      {up ? <TrendingUpIcon /> : <TrendingDownIcon />}
      {formatPct(pct)}
    </Badge>
  )
}

function trendText(pct: number | null, up: string, down: string, flat: string) {
  if (pct === null) return flat
  return pct >= 0 ? up : down
}

export function SectionCards() {
  const prefs = usePreferences()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setError(false)
    fetchDashboardStats(prefs.lowStockThreshold)
      .then((data) => {
        if (active) setStats(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [prefs.lowStockThreshold])

  const gridClass =
    "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card"

  if (error) {
    return (
      <div className={gridClass}>
        <Card className="@container/card @5xl/main:col-span-4">
          <CardHeader>
            <CardDescription>Dashboard metrics</CardDescription>
            <CardTitle className="text-lg font-medium text-muted-foreground">
              Couldn&apos;t load metrics
            </CardTitle>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            There was a problem reaching the server. Try refreshing the page.
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={gridClass}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>
                <Skeleton className="h-4 w-24" />
              </CardDescription>
              <CardTitle>
                <Skeleton className="h-8 w-28" />
              </CardTitle>
              <CardAction>
                <Skeleton className="h-5 w-14 rounded-md" />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className={gridClass}>
      {/* Total Revenue */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.totalRevenue, prefs.currency)}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={stats.revenueTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trendText(
              stats.revenueTrendPct,
              "Trending up this month",
              "Down this month",
              "No sales yet this month",
            )}{" "}
            {stats.revenueTrendPct !== null &&
              (stats.revenueTrendPct >= 0 ? (
                <TrendingUpIcon className="size-4" />
              ) : (
                <TrendingDownIcon className="size-4" />
              ))}
          </div>
          <div className="text-muted-foreground">
            {formatCurrency(stats.revenueThisMonth, prefs.currency)} this month
          </div>
        </CardFooter>
      </Card>

      {/* Total Sales / Orders */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Sales</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {number.format(stats.salesCount)}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={stats.salesTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trendText(
              stats.salesTrendPct,
              "More orders this month",
              "Fewer orders this month",
              "No orders yet this month",
            )}{" "}
            {stats.salesTrendPct !== null &&
              (stats.salesTrendPct >= 0 ? (
                <TrendingUpIcon className="size-4" />
              ) : (
                <TrendingDownIcon className="size-4" />
              ))}
          </div>
          <div className="text-muted-foreground">
            {number.format(stats.ordersThisMonth)} order
            {stats.ordersThisMonth === 1 ? "" : "s"} this month
          </div>
        </CardFooter>
      </Card>

      {/* Customers */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {number.format(stats.totalCustomers)}
          </CardTitle>
          <CardAction>
            <TrendBadge pct={stats.customersTrendPct} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.newCustomersThisMonth > 0
              ? "Growing this month"
              : "No new customers this month"}{" "}
            {stats.newCustomersThisMonth > 0 && (
              <TrendingUpIcon className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            {number.format(stats.newCustomersThisMonth)} new this month
          </div>
        </CardFooter>
      </Card>

      {/* Inventory / Products */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {number.format(stats.totalProducts)}
          </CardTitle>
          <CardAction>
            {stats.lowStockCount > 0 ? (
              <Badge variant="outline" className="text-destructive">
                <AlertTriangleIcon />
                {number.format(stats.lowStockCount)} low
              </Badge>
            ) : (
              <Badge variant="outline">
                <PackageIcon />
                In stock
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.lowStockCount > 0 ? (
              <>
                {number.format(stats.lowStockCount)} need restocking{" "}
                <AlertTriangleIcon className="size-4 text-destructive" />
              </>
            ) : (
              "Inventory looks healthy"
            )}
          </div>
          <div className="text-muted-foreground">
            Across{" "}
            <Link href="/dashboard/categories" className="underline-offset-4 hover:underline">
              {number.format(stats.categoriesCount)} categories
            </Link>{" "}
            · above {number.format(prefs.lowStockThreshold)} is healthy
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
