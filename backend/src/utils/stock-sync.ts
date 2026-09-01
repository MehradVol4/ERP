// Keeps product stock in sync with sales and purchases. Runs as a
// document-service middleware rather than a DB lifecycle so it can read the
// line items off params.data (repeatable components aren't reliable in v5
// lifecycles). Sales lower stock, purchases raise it; edits and deletes reverse
// the difference. Every write goes through adjustStock, which also writes the
// movement log, and is wrapped so a logging failure can't fail the request.

import { adjustStock, sumByProduct, normalizeId } from './stock';

type Line = { product?: unknown; quantity?: unknown; price?: unknown; cost?: unknown };

/** Fill each line's `cost` from the product's current cost_price when absent. */
async function snapshotCosts(strapi: any, items: Line[] | undefined): Promise<void> {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item == null) continue;
    if (item.cost != null && item.cost !== '') continue;
    const productId = normalizeId(item.product);
    if (!productId) continue;
    const product = await strapi.db.query('api::product.product').findOne({
      where: { id: productId },
      select: ['id', 'cost_price'],
    });
    if (product?.cost_price != null) item.cost = product.cost_price;
  }
}

async function fetchSaleLines(strapi: any, documentId: string): Promise<Line[]> {
  const existing = await strapi.documents('api::sale.sale').findOne({
    documentId,
    populate: { products: { populate: { product: true } } },
  });
  return Array.isArray(existing?.products) ? existing.products : [];
}

async function fetchPurchaseLines(strapi: any, documentId: string): Promise<Line[]> {
  const existing = await strapi.documents('api::purchase.purchase').findOne({
    documentId,
    populate: { items: { populate: { product: true } } },
  });
  return Array.isArray(existing?.items) ? existing.items : [];
}

export function registerStockSync(strapi: any) {
  strapi.documents.use(async (context: any, next: any) => {
    const { uid, action, params } = context;

    // ---- Sales -----------------------------------------------------------
    if (uid === 'api::sale.sale') {
      if (action === 'create') {
        await snapshotCosts(strapi, params?.data?.products);
        const result = await next();
        try {
          const totals = sumByProduct(params?.data?.products ?? []);
          const reference = result?.documentId ?? '';
          for (const [productId, qty] of totals) {
            await adjustStock(strapi, productId, -qty, {
              type: 'sale',
              reference,
              note: 'Sale created',
              date: result?.date,
            });
          }
        } catch (err) {
          strapi.log.error(`[stock-sync] sale.create failed: ${err}`);
        }
        return result;
      }

      if (action === 'update') {
        const incoming: Line[] | undefined = params?.data?.products;
        // Partial update that doesn't touch line items — nothing to reconcile.
        if (!Array.isArray(incoming)) return next();

        await snapshotCosts(strapi, incoming);
        const oldTotals = sumByProduct(await fetchSaleLines(strapi, params.documentId));
        const result = await next();
        try {
          const newTotals = sumByProduct(incoming);
          const reference = result?.documentId ?? params.documentId;
          const ids = new Set<number>([...oldTotals.keys(), ...newTotals.keys()]);
          for (const productId of ids) {
            const delta = (oldTotals.get(productId) ?? 0) - (newTotals.get(productId) ?? 0);
            if (delta === 0) continue;
            await adjustStock(strapi, productId, delta, {
              type: 'adjustment',
              reference,
              note: 'Sale edited',
            });
          }
        } catch (err) {
          strapi.log.error(`[stock-sync] sale.update failed: ${err}`);
        }
        return result;
      }

      if (action === 'delete') {
        const oldLines = await fetchSaleLines(strapi, params.documentId);
        const result = await next();
        try {
          const totals = sumByProduct(oldLines);
          for (const [productId, qty] of totals) {
            await adjustStock(strapi, productId, qty, {
              type: 'adjustment',
              reference: params.documentId,
              note: 'Sale deleted (stock restored)',
            });
          }
        } catch (err) {
          strapi.log.error(`[stock-sync] sale.delete failed: ${err}`);
        }
        return result;
      }
    }

    // ---- Purchases (goods receipts) --------------------------------------
    if (uid === 'api::purchase.purchase') {
      if (action === 'create') {
        const result = await next();
        try {
          const items: Line[] = params?.data?.items ?? [];
          const totals = sumByProduct(items);
          const reference = result?.reference || result?.documentId || '';
          for (const [productId, qty] of totals) {
            await adjustStock(strapi, productId, qty, {
              type: 'purchase',
              reference,
              note: 'Goods received',
              date: result?.date,
            });
          }
          // Refresh each product's cost to the most recent received unit cost.
          for (const item of items) {
            const productId = normalizeId(item?.product);
            const cost = item?.cost;
            if (productId && cost != null && cost !== '') {
              await strapi.db.query('api::product.product').update({
                where: { id: productId },
                data: { cost_price: cost },
              });
            }
          }
        } catch (err) {
          strapi.log.error(`[stock-sync] purchase.create failed: ${err}`);
        }
        return result;
      }

      if (action === 'delete') {
        const oldItems = await fetchPurchaseLines(strapi, params.documentId);
        const result = await next();
        try {
          const totals = sumByProduct(oldItems);
          for (const [productId, qty] of totals) {
            await adjustStock(strapi, productId, -qty, {
              type: 'adjustment',
              reference: params.documentId,
              note: 'Purchase deleted (stock reversed)',
            });
          }
        } catch (err) {
          strapi.log.error(`[stock-sync] purchase.delete failed: ${err}`);
        }
        return result;
      }
    }

    return next();
  });
}
