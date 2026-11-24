import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Idempotent on purpose: local dev databases may already have these columns from Payload's dev schema push.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "transfer_price" numeric,
      ADD COLUMN IF NOT EXISTS "card_price" numeric;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      DROP COLUMN IF EXISTS "transfer_price",
      DROP COLUMN IF EXISTS "card_price";
  `)
}
