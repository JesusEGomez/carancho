import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Idempotent on purpose: local dev databases may already have this column from Payload's dev schema push.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "show_in_offers" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      DROP COLUMN IF EXISTS "show_in_offers";
  `)
}
