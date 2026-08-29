"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchSalesTimeline, type SalePoint } from "@/lib/dashboard-stats"
import { usePreferences, formatCurrency } from "@/lib/preferences"

export const description = "Revenue over time from sales"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--primary)",
  },
  orders: {
    label: "Orders",
    color: "var(--primary)",
  },
} satisfies ChartConfig

const RANGE_DAYS: Record<string, number> = { "90d": 90, "30d": 30, "7d": 7 }

type DailyPoint = { date: string; revenue: number; orders: number }

// Local YYYY-MM-DD key so per-day bucketing matches the axis labels.
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`
}

// One point per day over the range, zero-filling days with no sales.
function buildSeries(sales: SalePoint[], days: number): DailyPoint[] {
  const revenueByDay = new Map<string, number>()
  const ordersByDay = new Map<string, number>()

  for (const sale of sales) {
    const key = dayKey(new Date(sale.date))
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + sale.total)
    ordersByDay.set(key, (ordersByDay.get(key) ?? 0) + 1)
  }

  const series: DailyPoint[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = dayKey(d)
    series.push({
      date: key,
      revenue: revenueByDay.get(key) ?? 0,
      orders: ordersByDay.get(key) ?? 0,
    })
  }
  return series
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const prefs = usePreferences()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [sales, setSales] = React.useState<SalePoint[] | null>(null)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    let active = true
    fetchSalesTimeline()
      .then((data) => {
        if (active) setSales(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const days = RANGE_DAYS[timeRange] ?? 90
  const series = React.useMemo(
    () => (sales ? buildSeries(sales, days) : []),
    [sales, days],
  )
  const rangeRevenue = React.useMemo(
    () => series.reduce((sum, point) => sum + point.revenue, 0),
    [series],
  )
  const rangeOrders = React.useMemo(
    () => series.reduce((sum, point) => sum + point.orders, 0),
    [series],
  )

  const rangeLabel =
    timeRange === "7d"
      ? "the last 7 days"
      : timeRange === "30d"
        ? "the last 30 days"
        : "the last 3 months"

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>
          {error ? (
            <span>Couldn&apos;t load sales data</span>
          ) : sales === null ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <>
              <span className="hidden @[540px]/card:block">
                {formatCurrency(rangeRevenue, prefs.currency)} from {rangeOrders}{" "}
                order{rangeOrders === 1 ? "" : "s"} in {rangeLabel}
              </span>
              <span className="@[540px]/card:hidden">
                {formatCurrency(rangeRevenue, prefs.currency)} · {rangeLabel}
              </span>
            </>
          )}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "90d")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {sales === null && !error ? (
          <Skeleton className="h-[250px] w-full" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={series}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-revenue)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]
                            ?.label ?? name}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {name === "revenue"
                            ? formatCurrency(Number(value), prefs.currency)
                            : Number(value)}
                        </span>
                      </div>
                    )}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="var(--color-revenue)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
