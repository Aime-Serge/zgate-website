import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "audit_logs_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "audit_logs_texts" ADD CONSTRAINT "audit_logs_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "audit_logs_texts_order_parent" ON "audit_logs_texts" USING btree ("order","parent_id");
  -- Hand-added: keep existing audit history. Copy every id from the old
  -- JSON array into the new list table before the column is dropped.
  INSERT INTO "audit_logs_texts" ("order", "parent_id", "path", "text")
    SELECT e.ordinality, a."id", 'docIds', e.value
    FROM "audit_logs" a
    CROSS JOIN LATERAL jsonb_array_elements_text(a."doc_ids") WITH ORDINALITY AS e(value, ordinality);
  ALTER TABLE "audit_logs" DROP COLUMN "doc_ids";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Hand-edited: rebuild the JSON column from the list table before
  // dropping it, so rolling back loses no audit history either.
  await db.execute(sql`
   ALTER TABLE "audit_logs" ADD COLUMN "doc_ids" jsonb;
  UPDATE "audit_logs" a SET "doc_ids" = COALESCE(
    (SELECT jsonb_agg(t."text" ORDER BY t."order") FROM "audit_logs_texts" t
      WHERE t."parent_id" = a."id" AND t."path" = 'docIds'),
    '[]'::jsonb);
  ALTER TABLE "audit_logs" ALTER COLUMN "doc_ids" SET NOT NULL;
  DROP TABLE "audit_logs_texts" CASCADE;`)
}
