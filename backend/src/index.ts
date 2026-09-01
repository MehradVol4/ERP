// import type { Core } from '@strapi/strapi';

import { registerStockSync } from './utils/stock-sync';

// Actions the authenticated role may call. The frontend uses a users-permissions
// JWT, so without these grants the collections would 403. Applied idempotently
// on every boot so new content types work without editing the Roles screen.
const AUTHENTICATED_GRANTS: Record<string, string[]> = {
  'api::supplier.supplier': ['find', 'findOne', 'create', 'update', 'delete'],
  'api::customer.customer': ['find', 'findOne', 'create', 'update', 'delete'],
  'api::purchase.purchase': ['find', 'findOne', 'create', 'update', 'delete'],
  'api::stock-movement.stock-movement': ['find', 'findOne', 'create', 'update', 'delete'],
};

async function ensureAuthenticatedPermissions(strapi: any) {
  const role = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });
  if (!role) return;

  for (const [uid, actions] of Object.entries(AUTHENTICATED_GRANTS)) {
    for (const action of actions) {
      const permissionAction = `${uid}.${action}`;
      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action: permissionAction, role: role.id } });
      if (!existing) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({ data: { action: permissionAction, role: role.id } });
      }
    }
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: any }) {
    // Keep product stock and the movement log in sync with sales/purchases.
    registerStockSync(strapi);
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    try {
      await ensureAuthenticatedPermissions(strapi);
    } catch (err) {
      strapi.log.error(`[bootstrap] failed to ensure permissions: ${err}`);
    }
  },
};
