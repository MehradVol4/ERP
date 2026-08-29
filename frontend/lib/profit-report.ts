import axiosInstance from "@/lib/axios"

/**
 * Per-product profit aggregation, built entirely from the real sales data.
 *
 * Each sale line carries `quantity`, `price` (what it sold for) and `cost` (the
 * product's cost snapshotted at the moment of sale by the stock-sync layer).
 * That lets us compute revenue, cost of goods sold and gross profit per product
 * without any historical guesswork. Sales created before cost snapshotting
 * existed may have a null cost — treated as 0, which only understates cost.
 *
 * There is no aggregation endpoint, so we page through the sales and reduce on
 * the client (same pattern as the dashboard summary).
 */

export type DateRange = "all" | "30d" | "month" | "year"

export const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
]

export type ProductProfit = {
  productId: number
  name: string
  unitsSold: number
  /** Distinct sales (invoices) this product appeared on. */
  orders: number
  revenue: number
  cost: number
  profit: number
  /** Gross margin = profit / revenue; null when there was no revenue. */
  margin: number | null
}

export type ProfitTotals = {
  revenue: number
  cost: number
  profit: number
  unitsSold: number
  margin: number | null
}

export type ProfitReport = {
  products: ProductProfit[]
  totals: ProfitTotals
}

type SaleLine = {
  quantity: number | string | null
  price: number | string | null
  cost: number | string | null
  product?: { id: number; name?: string | null } | null
}

type SaleRow = {
  documentId: string
  date: string | null
  products?: SaleLine[] | null
}

type StrapiList<T> = {
  data: T[]
  meta: { pagination: { pageCount: number } }
}

const PAGE_SIZE = 100

/** Inclusive lower bound (UTC) for a range; null means "no lower bound". */
function rangeStart(range: DateRange, now = new Date()): Date | null {
  switch (range) {
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case "month":
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    case "year":
      return new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    case "all":
    default:
      return null
  }
}

export async function fetchProfitReport(
  range: DateRange = "all",
): Promise<ProfitReport> {
  const sales: SaleRow[] = []
  let page = 1
  let pageCount = 1

  do {
    const res = await axiosInstance.get<StrapiList<SaleRow>>(
      `/api/sales?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}` +
        `&fields[0]=date` +
        `&populate[products][populate][product][fields][0]=name`,
    )
    sales.push(...res.data.data)
    pageCount = res.data.meta.pagination.pageCount || 1
    page += 1
  } while (page <= pageCount)

  const start = rangeStart(range)

  type Acc = Omit<ProductProfit, "margin"> & { saleIds: Set<string> }
  const byProduct = new Map<number, Acc>()

  for (const sale of sales) {
    if (start && sale.date) {
      if (new Date(sale.date).getTime() < start.getTime()) continue
    }
    for (const line of sale.products ?? []) {
      const productId = line?.product?.id
      if (!productId) continue
      const quantity = Number(line.quantity) || 0
      const price = Number(line.price) || 0
      const cost = Number(line.cost) || 0
      if (quantity <= 0) continue

      let acc = byProduct.get(productId)
      if (!acc) {
        acc = {
          productId,
          name: line.product?.name ?? `#${productId}`,
          unitsSold: 0,
          orders: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          saleIds: new Set<string>(),
        }
        byProduct.set(productId, acc)
      }
      acc.unitsSold += quantity
      acc.revenue += price * quantity
      acc.cost += cost * quantity
      acc.profit += (price - cost) * quantity
      acc.saleIds.add(sale.documentId)
    }
  }

  const products: ProductProfit[] = [...byProduct.values()].map((acc) => ({
    productId: acc.productId,
    name: acc.name,
    unitsSold: acc.unitsSold,
    orders: acc.saleIds.size,
    revenue: acc.revenue,
    cost: acc.cost,
    profit: acc.profit,
    margin: acc.revenue > 0 ? acc.profit / acc.revenue : null,
  }))

  const totals = products.reduce<ProfitTotals>(
    (t, p) => {
      t.revenue += p.revenue
      t.cost += p.cost
      t.profit += p.profit
      t.unitsSold += p.unitsSold
      return t
    },
    { revenue: 0, cost: 0, profit: 0, unitsSold: 0, margin: null },
  )
  totals.margin = totals.revenue > 0 ? totals.profit / totals.revenue : null

  // Default order: most profitable first.
  products.sort((a, b) => b.profit - a.profit)
  return { products, totals }
}
