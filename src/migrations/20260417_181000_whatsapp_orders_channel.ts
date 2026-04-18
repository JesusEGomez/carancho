import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_status" RENAME TO "enum_orders_status_old";
    CREATE TYPE "public"."enum_orders_status" AS ENUM('draft', 'pending_payment', 'pending_whatsapp', 'confirmed', 'fulfillment_blocked', 'cancelled');
    ALTER TABLE "orders"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "public"."enum_orders_status"
      USING ("status"::text::"public"."enum_orders_status"),
      ALTER COLUMN "status" SET DEFAULT 'draft';
    DROP TYPE "public"."enum_orders_status_old";

    ALTER TYPE "public"."enum_orders_payment_provider" RENAME TO "enum_orders_payment_provider_old";
    CREATE TYPE "public"."enum_orders_payment_provider" AS ENUM('mercadopago', 'whatsapp');
    ALTER TABLE "orders"
      ALTER COLUMN "payment_provider" TYPE "public"."enum_orders_payment_provider"
      USING ("payment_provider"::text::"public"."enum_orders_payment_provider");
    DROP TYPE "public"."enum_orders_payment_provider_old";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "orders"
    SET "status" = 'cancelled'
    WHERE "status" = 'pending_whatsapp';

    UPDATE "orders"
    SET "payment_provider" = NULL
    WHERE "payment_provider" = 'whatsapp';

    ALTER TYPE "public"."enum_orders_status" RENAME TO "enum_orders_status_old";
    CREATE TYPE "public"."enum_orders_status" AS ENUM('draft', 'pending_payment', 'confirmed', 'fulfillment_blocked', 'cancelled');
    ALTER TABLE "orders"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "public"."enum_orders_status"
      USING ("status"::text::"public"."enum_orders_status"),
      ALTER COLUMN "status" SET DEFAULT 'draft';
    DROP TYPE "public"."enum_orders_status_old";

    ALTER TYPE "public"."enum_orders_payment_provider" RENAME TO "enum_orders_payment_provider_old";
    CREATE TYPE "public"."enum_orders_payment_provider" AS ENUM('mercadopago');
    ALTER TABLE "orders"
      ALTER COLUMN "payment_provider" TYPE "public"."enum_orders_payment_provider"
      USING ("payment_provider"::text::"public"."enum_orders_payment_provider");
    DROP TYPE "public"."enum_orders_payment_provider_old";
  `)
}
