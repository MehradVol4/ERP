import axiosInstance from "@/lib/axios"

// Dashboard summary metrics. There's no aggregation endpoint, so we page
// through sales/products/categories and compute the numbers on the client.
export type DashboardStats = {
  // Revenue
  totalRevenue: number
  revenueThisMonth: number
  revenueTrendPct: number | null
  // Profit (revenue minus cost of goods sold)
  totalProfit: number
  profitThisMonth: number
  profitTrendPct: number | null
  // Sales (orders)
  salesCount: number
  ordersThisMonth: number
  salesTrendPct: number | null
  // Customers
  totalCustomers: number
  newCustomersThisMonth: number
  customersTrendPct: number | null
  // Inventory
  totalProducts: number
  lowStockCount: number
  categoriesCount: number
}

// Products at or below this stock level count as low stock.
export const LOW_STOCK_THRESHOLD = 10

type SaleItemRow = {
  quantity: number | string | null
  price: number | string | null
  cost: number | string | null
}

type SaleRow = {
  date: string | null
  total: number | string | null
  customer_name: string | null
  products?: SaleItemRow[] | null
}

type ProductRow = {
  stock: number | null
  reorder_level: number | null
}

// Gross profit for one sale across its line items.
function saleProfit(sale: SaleRow): number {
  const items = sale.products ?? []
  let profit = 0
  for (const item of items) {
    const quantity = Number(item?.quantity) || 0
    const price = Number(item?.price) || 0
    const cost = Number(item?.cost) || 0
    profit += (price - cost) * quantity
  }
  return profit
}

type StrapiList<T> = {
  data: T[]
  meta: { pagination: { page: number; pageCount: number; total: number } }
}

const PAGE_SIZE = 100

// Percent change from prev to cur; null when there's no basis to compare.
function trendPct(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null
  return ((cur - prev) / prev) * 100
}

// UTC "YYYY-M" key so month bucketing is timezone-stable.
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`
}

async function fetchAllPages<T>(path: string, extraQuery = ""): Promise<T[]> {
  const rows: T[] = []
  let page = 1
  let pageCount = 1

  do {
    const res = await axiosInstance.get<StrapiList<T>>(
      `${path}?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}${extraQuery}`,
    )
    rows.push(...res.data.data)
    pageCount = res.data.meta.pagination.pageCount || 1
    page += 1
  } while (page <= pageCount)

  return rows
}

// A point on the revenue timeline.
export type SalePoint = { date: string; total: number }

export async function fetchSalesTimeline(): Promise<SalePoint[]> {
  const rows = await fetchAllPages<SaleRow>(
    "/api/sales",
    "&fields[0]=date&fields[1]=total&sort=date:asc",
  )
  return rows
    .filter((r): r is SaleRow & { date: string } => Boolean(r.date))
    .map((r) => ({ date: r.date as string, total: Number(r.total) || 0 }))
}

async function fetchCount(path: string): Promise<number> {
  const res = await axiosInstance.get<StrapiList<unknown>>(
    `${path}?pagination[page]=1&pagination[pageSize]=1`,
  )
  return res.data.meta.pagination.total
}

export async function fetchDashboardStats(
  lowStockThreshold: number = LOW_STOCK_THRESHOLD,
): Promise<DashboardStats> {
  const [sales, products, categoriesCount] = await Promise.all([
    fetchAllPages<SaleRow>(
      "/api/sales",
      "&fields[0]=date&fields[1]=total&fields[2]=customer_name&populate=products",
    ),
    fetchAllPages<ProductRow>(
      "/api/products",
      "&fields[0]=stock&fields[1]=reorder_level",
    ),
    fetchCount("/api/categories"),
  ])

  const now = new Date()
  const thisMonth = monthKey(now)
  const lastMonth = monthKey(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
  )

  // --- Revenue + profit + orders, all-time and per month ---
  let totalRevenue = 0
  let revenueThisMonth = 0
  let revenueLastMonth = 0
  let totalProfit = 0
  let profitThisMonth = 0
  let profitLastMonth = 0
  let ordersThisMonth = 0
  let ordersLastMonth = 0

  // --- Customers: earliest purchase per customer, for "new this month" ---
  const firstSeen = new Map<string, string>()

  for (const sale of sales) {
    const amount = Number(sale.total) || 0
    const profit = saleProfit(sale)
    totalRevenue += amount
    totalProfit += profit

    if (!sale.date) continue
    const key = monthKey(new Date(sale.date))

    if (key === thisMonth) {
      revenueThisMonth += amount
      profitThisMonth += profit
      ordersThisMonth += 1
    } else if (key === lastMonth) {
      revenueLastMonth += amount
      profitLastMonth += profit
      ordersLastMonth += 1
    }

    const customer = (sale.customer_name ?? "").trim()
    if (customer) {
      const existing = firstSeen.get(customer)
      if (!existing || sale.date < existing) firstSeen.set(customer, sale.date)
    }
  }

  let newCustomersThisMonth = 0
  let newCustomersLastMonth = 0
  for (const date of firstSeen.values()) {
    const key = monthKey(new Date(date))
    if (key === thisMonth) newCustomersThisMonth += 1
    else if (key === lastMonth) newCustomersLastMonth += 1
  }

  // --- Inventory ---
  // Each product's own reorder level, falling back to the global threshold.
  const lowStockCount = products.filter((p) => {
    const level = p.reorder_level ?? lowStockThreshold
    return (p.stock ?? 0) <= level
  }).length

  return {
    totalRevenue,
    revenueThisMonth,
    revenueTrendPct: trendPct(revenueThisMonth, revenueLastMonth),
    totalProfit,
    profitThisMonth,
    profitTrendPct: trendPct(profitThisMonth, profitLastMonth),
    salesCount: sales.length,
    ordersThisMonth,
    salesTrendPct: trendPct(ordersThisMonth, ordersLastMonth),
    totalCustomers: firstSeen.size,
    newCustomersThisMonth,
    customersTrendPct: trendPct(newCustomersThisMonth, newCustomersLastMonth),
    totalProducts: products.length,
    lowStockCount,
    categoriesCount,
  }
}
