import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      ADD COLUMN "is_visible" boolean DEFAULT true;

    UPDATE "categories"
      SET "is_visible" = true
      WHERE "is_visible" IS NULL;

    ALTER TABLE "categories"
      ALTER COLUMN "is_visible" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      DROP COLUMN "is_visible";
  `)
}
