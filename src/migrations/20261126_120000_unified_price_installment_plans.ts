import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Cash and transfer now share `price`, Mercado Pago charges `price` again and installment plans
// are informational only. Idempotent on purpose: local dev databases may already match this
// schema from Payload's dev schema push.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_installment_plans" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "installments" numeric NOT NULL,
      "installment_amount" numeric NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "products_installment_plans"
        ADD CONSTRAINT "products_installment_plans_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "products_installment_plans_order_idx"
      ON "products_installment_plans" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_installment_plans_parent_id_idx"
      ON "products_installment_plans" USING btree ("_parent_id");

    ALTER TABLE "products"
      DROP COLUMN IF EXISTS "transfer_price",
      DROP COLUMN IF EXISTS "card_price";

    -- Every payment method charges "unit_price" now, so the per-method snapshots are dead.
    -- "unit_price", "line_total" and the order totals are untouched.
    ALTER TABLE "orders_items"
      DROP COLUMN IF EXISTS "cash_unit_price",
      DROP COLUMN IF EXISTS "transfer_unit_price";
  `)
}

// Dropped prices cannot be recovered: products come back without transfer or card prices
// (both fall back to "price"), and order item snapshots are rebuilt from "unit_price".
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders_items"
      ADD COLUMN IF NOT EXISTS "cash_unit_price" numeric,
      ADD COLUMN IF NOT EXISTS "transfer_unit_price" numeric;
    UPDATE "orders_items" SET "cash_unit_price" = "unit_price" WHERE "cash_unit_price" IS NULL;
    UPDATE "orders_items" SET "transfer_unit_price" = "unit_price" WHERE "transfer_unit_price" IS NULL;

    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "transfer_price" numeric,
      ADD COLUMN IF NOT EXISTS "card_price" numeric;

    DROP TABLE IF EXISTS "products_installment_plans" CASCADE;
  `)
}
