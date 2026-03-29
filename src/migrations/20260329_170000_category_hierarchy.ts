import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories"
      ADD COLUMN "parent_id" integer;

    ALTER TABLE "categories"
      ADD CONSTRAINT "categories_parent_id_categories_id_fk"
      FOREIGN KEY ("parent_id")
      REFERENCES "public"."categories"("id")
      ON DELETE set null
      ON UPDATE no action;

    CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");

    UPDATE "categories"
    SET "featured" = false
    WHERE "parent_id" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "categories_parent_idx";

    ALTER TABLE "categories"
      DROP CONSTRAINT "categories_parent_id_categories_id_fk";

    ALTER TABLE "categories"
      DROP COLUMN "parent_id";
  `)
}
