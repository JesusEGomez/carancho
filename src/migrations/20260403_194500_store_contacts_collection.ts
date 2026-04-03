import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "store_contacts" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "address" varchar,
      "phone" varchar,
      "email" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN "store_contacts_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_store_contacts_fk"
      FOREIGN KEY ("store_contacts_id")
      REFERENCES "public"."store_contacts"("id")
      ON DELETE cascade
      ON UPDATE no action;

    CREATE INDEX "store_contacts_updated_at_idx" ON "store_contacts" USING btree ("updated_at");
    CREATE INDEX "store_contacts_created_at_idx" ON "store_contacts" USING btree ("created_at");
    CREATE INDEX "payload_locked_documents_rels_store_contacts_id_idx" ON "payload_locked_documents_rels" USING btree ("store_contacts_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "store_contacts_updated_at_idx";
    DROP INDEX "store_contacts_created_at_idx";
    DROP INDEX "payload_locked_documents_rels_store_contacts_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT "payload_locked_documents_rels_store_contacts_fk";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN "store_contacts_id";

    DROP TABLE "store_contacts";
  `)
}
