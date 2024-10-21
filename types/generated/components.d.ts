import type { Struct, Schema } from '@strapi/strapi';

export interface HomepageHighlights extends Struct.ComponentSchema {
  collectionName: 'components_homepage_highlights';
  info: {
    displayName: 'Highlights';
    icon: 'crown';
    description: '';
  };
  attributes: {
    price: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    car: Schema.Attribute.Relation<'oneToOne', 'api::car.car'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'homepage.highlights': HomepageHighlights;
    }
  }
}
