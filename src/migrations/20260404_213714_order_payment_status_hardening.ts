import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_status"
      ADD VALUE IF NOT EXISTS 'fulfillment_blocked';

    ALTER TYPE "public"."enum_orders_payment_status"
      ADD VALUE IF NOT EXISTS 'refunded';

    ALTER TYPE "public"."enum_orders_payment_status"
      ADD VALUE IF NOT EXISTS 'charged_back';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_orders_status" RENAME TO "enum_orders_status_old";
    CREATE TYPE "public"."enum_orders_status" AS ENUM('draft', 'pending_payment', 'confirmed', 'cancelled');
    ALTER TABLE "orders"
      ALTER COLUMN "status" DROP DEFAULT,
      ALTER COLUMN "status" TYPE "public"."enum_orders_status"
      USING (
        CASE
          WHEN "status"::text = 'fulfillment_blocked' THEN 'cancelled'
          ELSE "status"::text
        END
      )::"public"."enum_orders_status",
      ALTER COLUMN "status" SET DEFAULT 'draft';
    DROP TYPE "public"."enum_orders_status_old";

    ALTER TYPE "public"."enum_orders_payment_status" RENAME TO "enum_orders_payment_status_old";
    CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
    ALTER TABLE "orders"
      ALTER COLUMN "payment_status" TYPE "public"."enum_orders_payment_status"
      USING (
        CASE
          WHEN "payment_status"::text IN ('refunded', 'charged_back') THEN 'cancelled'
          ELSE "payment_status"::text
        END
      )::"public"."enum_orders_payment_status";
    DROP TYPE "public"."enum_orders_payment_status_old";
  `)
}
