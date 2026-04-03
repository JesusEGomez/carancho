import * as migration_20260327_172534_init_schema from './20260327_172534_init_schema';
import * as migration_20260327_190000_product_section_toggles from './20260327_190000_product_section_toggles';
import * as migration_20260329_170000_category_hierarchy from './20260329_170000_category_hierarchy';
import * as migration_20260329_183000_remove_category_order from './20260329_183000_remove_category_order';
import * as migration_20260403_190348_category_navigation_flag from './20260403_190348_category_navigation_flag';
import * as migration_20260403_194500_store_contacts_collection from './20260403_194500_store_contacts_collection';

export const migrations = [
  {
    up: migration_20260327_172534_init_schema.up,
    down: migration_20260327_172534_init_schema.down,
    name: '20260327_172534_init_schema'
  },
  {
    up: migration_20260327_190000_product_section_toggles.up,
    down: migration_20260327_190000_product_section_toggles.down,
    name: '20260327_190000_product_section_toggles'
  },
  {
    up: migration_20260329_170000_category_hierarchy.up,
    down: migration_20260329_170000_category_hierarchy.down,
    name: '20260329_170000_category_hierarchy'
  },
  {
    up: migration_20260329_183000_remove_category_order.up,
    down: migration_20260329_183000_remove_category_order.down,
    name: '20260329_183000_remove_category_order'
  },
  {
    up: migration_20260403_190348_category_navigation_flag.up,
    down: migration_20260403_190348_category_navigation_flag.down,
    name: '20260403_190348_category_navigation_flag'
  },
  {
    up: migration_20260403_194500_store_contacts_collection.up,
    down: migration_20260403_194500_store_contacts_collection.down,
    name: '20260403_194500_store_contacts_collection'
  },
];
