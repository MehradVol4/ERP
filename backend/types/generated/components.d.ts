import type { Schema, Struct } from '@strapi/strapi';

export interface SharedPurchaseItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_purchase_items';
  info: {
    displayName: 'PurchaseItem';
    icon: 'package';
  };
  attributes: {
    cost: Schema.Attribute.Decimal;
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>;
    quantity: Schema.Attribute.Integer;
  };
}

export interface SharedSaleItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_sale_items';
  info: {
    displayName: 'SaleItem';
    icon: 'book';
  };
  attributes: {
    cost: Schema.Attribute.Decimal;
    price: Schema.Attribute.Decimal;
    product: Schema.Attribute.Relation<'oneToOne', 'api::product.product'>;
    quantity: Schema.Attribute.Integer;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.purchase-item': SharedPurchaseItem;
      'shared.sale-item': SharedSaleItem;
    }
  }
}
