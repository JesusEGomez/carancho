import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_orders_status" AS ENUM('draft', 'pending_payment', 'confirmed', 'cancelled');
    CREATE TYPE "public"."enum_orders_payment_provider" AS ENUM('mercadopago');
    CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');

    CREATE TABLE "orders" (
      "id" serial PRIMARY KEY NOT NULL,
      "status" "enum_orders_status" DEFAULT 'draft' NOT NULL,
      "currency" varchar DEFAULT 'ARS' NOT NULL,
      "subtotal" numeric NOT NULL,
      "total" numeric NOT NULL,
      "customer_name" varchar NOT NULL,
      "customer_email" varchar NOT NULL,
      "customer_phone" varchar NOT NULL,
      "delivery_city" varchar NOT NULL,
      "delivery_address" varchar NOT NULL,
      "delivery_notes" varchar,
      "confirmation_token" varchar NOT NULL,
      "stock_applied" boolean DEFAULT false,
      "payment_provider" "enum_orders_payment_provider",
      "payment_status" "enum_orders_payment_status",
      "external_reference" varchar,
      "provider_preference_id" varchar,
      "provider_payment_id" varchar,
      "provider_raw_status" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "orders_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "product_name" varchar NOT NULL,
      "product_slug" varchar NOT NULL,
      "quantity" numeric NOT NULL,
      "unit_price" numeric NOT NULL,
      "line_total" numeric NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN "orders_id" integer;

    ALTER TABLE "orders_items"
      ADD CONSTRAINT "orders_items_parent_id_fk"
      FOREIGN KEY ("_parent_id")
      REFERENCES "public"."orders"("id")
      ON DELETE cascade
      ON UPDATE no action;

    ALTER TABLE "orders_items"
      ADD CONSTRAINT "orders_items_product_id_products_id_fk"
      FOREIGN KEY ("product_id")
      REFERENCES "public"."products"("id")
      ON DELETE set null
      ON UPDATE no action;

    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_orders_fk"
      FOREIGN KEY ("orders_id")
      REFERENCES "public"."orders"("id")
      ON DELETE cascade
      ON UPDATE no action;

    CREATE UNIQUE INDEX "orders_confirmation_token_idx" ON "orders" USING btree ("confirmation_token");
    CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
    CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
    CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
    CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
    CREATE INDEX "orders_items_product_idx" ON "orders_items" USING btree ("product_id");
    CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "orders_confirmation_token_idx";
    DROP INDEX "orders_updated_at_idx";
    DROP INDEX "orders_created_at_idx";
    DROP INDEX "orders_items_order_idx";
    DROP INDEX "orders_items_parent_id_idx";
    DROP INDEX "orders_items_product_idx";
    DROP INDEX "payload_locked_documents_rels_orders_id_idx";

    ALTER TABLE "orders_items"
      DROP CONSTRAINT "orders_items_parent_id_fk";

    ALTER TABLE "orders_items"
      DROP CONSTRAINT "orders_items_product_id_products_id_fk";

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN "orders_id";

    DROP TABLE "orders_items";
    DROP TABLE "orders";

    DROP TYPE "public"."enum_orders_status";
    DROP TYPE "public"."enum_orders_payment_provider";
    DROP TYPE "public"."enum_orders_payment_status";
  `)
}
