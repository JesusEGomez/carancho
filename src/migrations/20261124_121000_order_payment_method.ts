import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Idempotent on purpose: local dev databases may already have these columns from Payload's dev schema push.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('cash', 'transfer', 'card');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
    ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "payment_method" "enum_orders_payment_method";
    ALTER TABLE "orders_items"
      ADD COLUMN IF NOT EXISTS "cash_unit_price" numeric,
      ADD COLUMN IF NOT EXISTS "transfer_unit_price" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders_items"
      DROP COLUMN IF EXISTS "cash_unit_price",
      DROP COLUMN IF EXISTS "transfer_unit_price";
    ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "payment_method";
    DROP TYPE IF EXISTS "public"."enum_orders_payment_method";
  `)
}
