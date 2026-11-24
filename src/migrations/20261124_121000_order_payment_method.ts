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

    -- Orders created before per-method prices were charged the cash price, so it is
    -- the only snapshot available for both methods.
    UPDATE "orders_items" SET "cash_unit_price" = "unit_price" WHERE "cash_unit_price" IS NULL;
    UPDATE "orders_items" SET "transfer_unit_price" = "unit_price" WHERE "transfer_unit_price" IS NULL;
    UPDATE "orders" SET "payment_method" = 'cash'
      WHERE "payment_method" IS NULL AND "payment_provider" = 'whatsapp';
    UPDATE "orders" SET "payment_method" = 'card'
      WHERE "payment_method" IS NULL AND "payment_provider" = 'mercadopago';
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
