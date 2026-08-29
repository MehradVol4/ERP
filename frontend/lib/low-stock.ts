import axiosInstance from "@/lib/axios"

// A product is low when its stock is at or below its reorder level (or the
// global threshold when it has none). Strapi can't compare two columns, so we
// page through the products and filter on the client.

export const DEFAULT_LOW_STOCK_THRESHOLD = 10

export type LowStockSupplier = { id: number; name: string } | null

export type LowStockProduct = {
  id: number
  documentId: string
  name: string
  stock: number
  reorderLevel: number
  costPrice: number
  supplier: LowStockSupplier
  // Units below the reorder level (0 when exactly at it).
  shortfall: number
  suggestedQty: number
}

type RawProduct = {
  id: number
  documentId: string
  name: string
  stock: number | null
  reorder_level: number | null
  cost_price: number | null
  supplier?: { id: number; name: string } | null
}

type StrapiList<T> = {
  data: T[]
  meta: { pagination: { pageCount: number } }
}

const PAGE_SIZE = 100

// Restock target: back up to twice the reorder level.
function suggestQty(stock: number, reorderLevel: number): number {
  return Math.max(reorderLevel * 2 - stock, 1)
}

export async function fetchLowStockProducts(
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD,
): Promise<LowStockProduct[]> {
  const rows: RawProduct[] = []
  let page = 1
  let pageCount = 1

  do {
    const res = await axiosInstance.get<StrapiList<RawProduct>>(
      `/api/products?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}` +
        `&fields[0]=name&fields[1]=stock&fields[2]=reorder_level&fields[3]=cost_price` +
        `&populate[supplier][fields][0]=name`,
    )
    rows.push(...res.data.data)
    pageCount = res.data.meta.pagination.pageCount || 1
    page += 1
  } while (page <= pageCount)

  const low: LowStockProduct[] = []
  for (const p of rows) {
    const stock = p.stock ?? 0
    const reorderLevel = p.reorder_level ?? threshold
    if (stock > reorderLevel) continue
    low.push({
      id: p.id,
      documentId: p.documentId,
      name: p.name,
      stock,
      reorderLevel,
      costPrice: p.cost_price ?? 0,
      supplier: p.supplier ? { id: p.supplier.id, name: p.supplier.name } : null,
      shortfall: Math.max(reorderLevel - stock, 0),
      suggestedQty: suggestQty(stock, reorderLevel),
    })
  }

  // Most urgent first.
  low.sort((a, b) => b.shortfall - a.shortfall || a.stock - b.stock)
  return low
}

// Reorder link that pre-fills the purchase form for one product.
export function reorderHref(product: LowStockProduct): string {
  const params = new URLSearchParams({
    product: String(product.id),
    qty: String(product.suggestedQty),
    cost: String(product.costPrice),
  })
  if (product.supplier) params.set("supplier", String(product.supplier.id))
  return `/dashboard/purchases/new?${params.toString()}`
}
