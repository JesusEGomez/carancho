import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      ADD COLUMN "show_in_navigation" boolean DEFAULT false;

    UPDATE "categories"
      SET "show_in_navigation" = false
      WHERE "show_in_navigation" IS NULL;

    ALTER TABLE "categories"
      ALTER COLUMN "show_in_navigation" SET NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      DROP COLUMN "show_in_navigation";
  `)
}
