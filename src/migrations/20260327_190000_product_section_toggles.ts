import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      ADD COLUMN "show_features" boolean DEFAULT false NOT NULL,
      ADD COLUMN "show_specifications" boolean DEFAULT false NOT NULL;

    UPDATE "products"
    SET "show_features" = true
    WHERE EXISTS (
      SELECT 1
      FROM "products_features"
      WHERE "products_features"."_parent_id" = "products"."id"
    );

    UPDATE "products"
    SET "show_specifications" = true
    WHERE EXISTS (
      SELECT 1
      FROM "products_specifications"
      WHERE "products_specifications"."_parent_id" = "products"."id"
    );
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products"
      DROP COLUMN "show_features",
      DROP COLUMN "show_specifications";
  `)
}
