// Inventory helpers. Every stock change goes through adjustStock so it also
// lands in the stock-movement log. Uses the low-level query engine to update
// the product directly without firing lifecycles (avoids recursion).

export type MovementType = 'sale' | 'purchase' | 'adjustment' | 'return' | 'initial';

export type MovementMeta = {
  type: MovementType;
  reference?: string | null;
  note?: string | null;
  date?: Date | string | null;
};

export type StockChange = {
  productId: number | null | undefined;
  delta: number;
};

// Apply a signed stock change to one product and log the movement.
export async function adjustStock(
  strapi: any,
  productId: number | null | undefined,
  delta: number,
  meta: MovementMeta,
): Promise<void> {
  if (!productId || !delta) return;

  const product = await strapi.db.query('api::product.product').findOne({
    where: { id: productId },
    select: ['id', 'stock'],
  });
  if (!product) return;

  const resulting = (product.stock ?? 0) + delta;

  await strapi.db.query('api::product.product').update({
    where: { id: productId },
    data: { stock: resulting },
  });

  await strapi.db.query('api::stock-movement.stock-movement').create({
    data: {
      product: productId,
      change: delta,
      resulting_stock: resulting,
      type: meta.type,
      reference: meta.reference ?? null,
      note: meta.note ?? null,
      movement_date: meta.date ? new Date(meta.date) : new Date(),
    },
  });
}

// Net quantity per product id, so the same product on two lines is summed once.
export function sumByProduct(
  items: Array<{ product?: unknown; quantity?: unknown } | null | undefined>,
): Map<number, number> {
  const totals = new Map<number, number>();
  for (const item of items ?? []) {
    if (!item) continue;
    const productId = normalizeId(item.product);
    const quantity = Number(item.quantity) || 0;
    if (!productId || !quantity) continue;
    totals.set(productId, (totals.get(productId) ?? 0) + quantity);
  }
  return totals;
}

// Pull a numeric id out of the various relation shapes Strapi can send
// (raw id, { id }, { set: [...] }, { connect: [...] }, populated object).
export function normalizeId(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('id' in obj) return normalizeId(obj.id);
    if ('set' in obj) {
      const set = obj.set as unknown;
      if (Array.isArray(set) && set.length > 0) return normalizeId(set[0]);
    }
    if ('connect' in obj) {
      const connect = obj.connect as unknown;
      if (Array.isArray(connect) && connect.length > 0) return normalizeId(connect[0]);
    }
  }
  return null;
}
