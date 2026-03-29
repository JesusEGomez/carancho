import * as migration_20260327_172534_init_schema from './20260327_172534_init_schema';
import * as migration_20260327_190000_product_section_toggles from './20260327_190000_product_section_toggles';

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
];
