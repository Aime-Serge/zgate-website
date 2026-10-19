import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_hero_visual" AS ENUM('none', 'gate');
  CREATE TYPE "public"."enum_pages_blocks_doors_items_division" AS ENUM('advisory', 'academy', 'tech', 'data', 'bundle');
  CREATE TYPE "public"."enum_pages_blocks_commitments_items_division" AS ENUM('advisory', 'academy', 'tech', 'data');
  CREATE TYPE "public"."enum__pages_v_blocks_hero_visual" AS ENUM('none', 'gate');
  CREATE TYPE "public"."enum__pages_v_blocks_doors_items_division" AS ENUM('advisory', 'academy', 'tech', 'data', 'bundle');
  CREATE TYPE "public"."enum__pages_v_blocks_commitments_items_division" AS ENUM('advisory', 'academy', 'tech', 'data');
  CREATE TABLE "pages_blocks_fact_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_doors_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"need" varchar,
  	"answer" varchar,
  	"division" "enum_pages_blocks_doors_items_division",
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_market_facts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"figure" varchar,
  	"statement" varchar
  );
  
  CREATE TABLE "pages_blocks_market_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_commitments_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"figure" varchar,
  	"label" varchar,
  	"division" "enum_pages_blocks_commitments_items_division"
  );
  
  CREATE TABLE "pages_blocks_commitments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"note" varchar DEFAULT 'Targets from our client service agreements: commitments we are held to, not past results.',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "pages_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_fact_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_doors_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"need" varchar,
  	"answer" varchar,
  	"division" "enum__pages_v_blocks_doors_items_division",
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_doors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_market_facts_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"figure" varchar,
  	"statement" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_market_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"source" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_commitments_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"figure" varchar,
  	"label" varchar,
  	"division" "enum__pages_v_blocks_commitments_items_division",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_commitments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"note" varchar DEFAULT 'Targets from our client service agreements: commitments we are held to, not past results.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "divisions_commitments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"figure" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "divisions_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "_divisions_v_version_commitments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"figure" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_divisions_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "site_settings_company_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fact" varchar
  );
  
  CREATE TABLE "_site_settings_v_version_company_facts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"fact" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "pages_blocks_hero" ADD COLUMN "visual" "enum_pages_blocks_hero_visual" DEFAULT 'none';
  ALTER TABLE "pages_blocks_rich_text" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_feature_list" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_feature_list" ADD COLUMN "numbered" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_division_grid" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_division_grid" ADD COLUMN "intro" varchar;
  ALTER TABLE "pages_blocks_course_list" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_faq" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_call_to_action" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_hero" ADD COLUMN "visual" "enum__pages_v_blocks_hero_visual" DEFAULT 'none';
  ALTER TABLE "_pages_v_blocks_rich_text" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_feature_list" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_feature_list" ADD COLUMN "numbered" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_division_grid" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_division_grid" ADD COLUMN "intro" varchar;
  ALTER TABLE "_pages_v_blocks_course_list" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_faq" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_call_to_action" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "divisions" ADD COLUMN "subtitle" varchar;
  ALTER TABLE "divisions" ADD COLUMN "pillar" varchar;
  ALTER TABLE "divisions" ADD COLUMN "headline" varchar;
  ALTER TABLE "divisions" ADD COLUMN "audience" varchar;
  ALTER TABLE "_divisions_v" ADD COLUMN "version_subtitle" varchar;
  ALTER TABLE "_divisions_v" ADD COLUMN "version_pillar" varchar;
  ALTER TABLE "_divisions_v" ADD COLUMN "version_headline" varchar;
  ALTER TABLE "_divisions_v" ADD COLUMN "version_audience" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "boilerplate" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_text" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_label" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "announcement_href" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_boilerplate" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_announcement_text" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_announcement_label" varchar;
  ALTER TABLE "_site_settings_v" ADD COLUMN "version_announcement_href" varchar;
  ALTER TABLE "pages_blocks_fact_strip" ADD CONSTRAINT "pages_blocks_fact_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_doors_items" ADD CONSTRAINT "pages_blocks_doors_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_doors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_doors" ADD CONSTRAINT "pages_blocks_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_market_facts_items" ADD CONSTRAINT "pages_blocks_market_facts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_market_facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_market_facts" ADD CONSTRAINT "pages_blocks_market_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_commitments_items" ADD CONSTRAINT "pages_blocks_commitments_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_commitments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_commitments" ADD CONSTRAINT "pages_blocks_commitments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps_items" ADD CONSTRAINT "pages_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_steps" ADD CONSTRAINT "pages_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_fact_strip" ADD CONSTRAINT "_pages_v_blocks_fact_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_doors_items" ADD CONSTRAINT "_pages_v_blocks_doors_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_doors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_doors" ADD CONSTRAINT "_pages_v_blocks_doors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_market_facts_items" ADD CONSTRAINT "_pages_v_blocks_market_facts_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_market_facts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_market_facts" ADD CONSTRAINT "_pages_v_blocks_market_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_commitments_items" ADD CONSTRAINT "_pages_v_blocks_commitments_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_commitments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_commitments" ADD CONSTRAINT "_pages_v_blocks_commitments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps_items" ADD CONSTRAINT "_pages_v_blocks_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_steps" ADD CONSTRAINT "_pages_v_blocks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "divisions_commitments" ADD CONSTRAINT "divisions_commitments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."divisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "divisions_faq" ADD CONSTRAINT "divisions_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."divisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_divisions_v_version_commitments" ADD CONSTRAINT "_divisions_v_version_commitments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_divisions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_divisions_v_version_faq" ADD CONSTRAINT "_divisions_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_divisions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_company_facts" ADD CONSTRAINT "site_settings_company_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_site_settings_v_version_company_facts" ADD CONSTRAINT "_site_settings_v_version_company_facts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_site_settings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_fact_strip_order_idx" ON "pages_blocks_fact_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_fact_strip_parent_id_idx" ON "pages_blocks_fact_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_fact_strip_path_idx" ON "pages_blocks_fact_strip" USING btree ("_path");
  CREATE INDEX "pages_blocks_doors_items_order_idx" ON "pages_blocks_doors_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_doors_items_parent_id_idx" ON "pages_blocks_doors_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_doors_order_idx" ON "pages_blocks_doors" USING btree ("_order");
  CREATE INDEX "pages_blocks_doors_parent_id_idx" ON "pages_blocks_doors" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_doors_path_idx" ON "pages_blocks_doors" USING btree ("_path");
  CREATE INDEX "pages_blocks_market_facts_items_order_idx" ON "pages_blocks_market_facts_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_market_facts_items_parent_id_idx" ON "pages_blocks_market_facts_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_market_facts_order_idx" ON "pages_blocks_market_facts" USING btree ("_order");
  CREATE INDEX "pages_blocks_market_facts_parent_id_idx" ON "pages_blocks_market_facts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_market_facts_path_idx" ON "pages_blocks_market_facts" USING btree ("_path");
  CREATE INDEX "pages_blocks_commitments_items_order_idx" ON "pages_blocks_commitments_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_commitments_items_parent_id_idx" ON "pages_blocks_commitments_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_commitments_order_idx" ON "pages_blocks_commitments" USING btree ("_order");
  CREATE INDEX "pages_blocks_commitments_parent_id_idx" ON "pages_blocks_commitments" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_commitments_path_idx" ON "pages_blocks_commitments" USING btree ("_path");
  CREATE INDEX "pages_blocks_steps_items_order_idx" ON "pages_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_items_parent_id_idx" ON "pages_blocks_steps_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_order_idx" ON "pages_blocks_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_steps_parent_id_idx" ON "pages_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_steps_path_idx" ON "pages_blocks_steps" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_fact_strip_order_idx" ON "_pages_v_blocks_fact_strip" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_fact_strip_parent_id_idx" ON "_pages_v_blocks_fact_strip" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_fact_strip_path_idx" ON "_pages_v_blocks_fact_strip" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_doors_items_order_idx" ON "_pages_v_blocks_doors_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_doors_items_parent_id_idx" ON "_pages_v_blocks_doors_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_doors_order_idx" ON "_pages_v_blocks_doors" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_doors_parent_id_idx" ON "_pages_v_blocks_doors" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_doors_path_idx" ON "_pages_v_blocks_doors" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_market_facts_items_order_idx" ON "_pages_v_blocks_market_facts_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_market_facts_items_parent_id_idx" ON "_pages_v_blocks_market_facts_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_market_facts_order_idx" ON "_pages_v_blocks_market_facts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_market_facts_parent_id_idx" ON "_pages_v_blocks_market_facts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_market_facts_path_idx" ON "_pages_v_blocks_market_facts" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_commitments_items_order_idx" ON "_pages_v_blocks_commitments_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_commitments_items_parent_id_idx" ON "_pages_v_blocks_commitments_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_commitments_order_idx" ON "_pages_v_blocks_commitments" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_commitments_parent_id_idx" ON "_pages_v_blocks_commitments" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_commitments_path_idx" ON "_pages_v_blocks_commitments" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_steps_items_order_idx" ON "_pages_v_blocks_steps_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_items_parent_id_idx" ON "_pages_v_blocks_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_order_idx" ON "_pages_v_blocks_steps" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_steps_parent_id_idx" ON "_pages_v_blocks_steps" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_steps_path_idx" ON "_pages_v_blocks_steps" USING btree ("_path");
  CREATE INDEX "divisions_commitments_order_idx" ON "divisions_commitments" USING btree ("_order");
  CREATE INDEX "divisions_commitments_parent_id_idx" ON "divisions_commitments" USING btree ("_parent_id");
  CREATE INDEX "divisions_faq_order_idx" ON "divisions_faq" USING btree ("_order");
  CREATE INDEX "divisions_faq_parent_id_idx" ON "divisions_faq" USING btree ("_parent_id");
  CREATE INDEX "_divisions_v_version_commitments_order_idx" ON "_divisions_v_version_commitments" USING btree ("_order");
  CREATE INDEX "_divisions_v_version_commitments_parent_id_idx" ON "_divisions_v_version_commitments" USING btree ("_parent_id");
  CREATE INDEX "_divisions_v_version_faq_order_idx" ON "_divisions_v_version_faq" USING btree ("_order");
  CREATE INDEX "_divisions_v_version_faq_parent_id_idx" ON "_divisions_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "site_settings_company_facts_order_idx" ON "site_settings_company_facts" USING btree ("_order");
  CREATE INDEX "site_settings_company_facts_parent_id_idx" ON "site_settings_company_facts" USING btree ("_parent_id");
  CREATE INDEX "_site_settings_v_version_company_facts_order_idx" ON "_site_settings_v_version_company_facts" USING btree ("_order");
  CREATE INDEX "_site_settings_v_version_company_facts_parent_id_idx" ON "_site_settings_v_version_company_facts" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_fact_strip" CASCADE;
  DROP TABLE "pages_blocks_doors_items" CASCADE;
  DROP TABLE "pages_blocks_doors" CASCADE;
  DROP TABLE "pages_blocks_market_facts_items" CASCADE;
  DROP TABLE "pages_blocks_market_facts" CASCADE;
  DROP TABLE "pages_blocks_commitments_items" CASCADE;
  DROP TABLE "pages_blocks_commitments" CASCADE;
  DROP TABLE "pages_blocks_steps_items" CASCADE;
  DROP TABLE "pages_blocks_steps" CASCADE;
  DROP TABLE "_pages_v_blocks_fact_strip" CASCADE;
  DROP TABLE "_pages_v_blocks_doors_items" CASCADE;
  DROP TABLE "_pages_v_blocks_doors" CASCADE;
  DROP TABLE "_pages_v_blocks_market_facts_items" CASCADE;
  DROP TABLE "_pages_v_blocks_market_facts" CASCADE;
  DROP TABLE "_pages_v_blocks_commitments_items" CASCADE;
  DROP TABLE "_pages_v_blocks_commitments" CASCADE;
  DROP TABLE "_pages_v_blocks_steps_items" CASCADE;
  DROP TABLE "_pages_v_blocks_steps" CASCADE;
  DROP TABLE "divisions_commitments" CASCADE;
  DROP TABLE "divisions_faq" CASCADE;
  DROP TABLE "_divisions_v_version_commitments" CASCADE;
  DROP TABLE "_divisions_v_version_faq" CASCADE;
  DROP TABLE "site_settings_company_facts" CASCADE;
  DROP TABLE "_site_settings_v_version_company_facts" CASCADE;
  ALTER TABLE "pages_blocks_hero" DROP COLUMN "visual";
  ALTER TABLE "pages_blocks_division_grid" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_division_grid" DROP COLUMN "intro";
  ALTER TABLE "pages_blocks_rich_text" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_feature_list" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_feature_list" DROP COLUMN "numbered";
  ALTER TABLE "pages_blocks_course_list" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_faq" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_call_to_action" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_hero" DROP COLUMN "visual";
  ALTER TABLE "_pages_v_blocks_division_grid" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_division_grid" DROP COLUMN "intro";
  ALTER TABLE "_pages_v_blocks_rich_text" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_feature_list" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_feature_list" DROP COLUMN "numbered";
  ALTER TABLE "_pages_v_blocks_course_list" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_faq" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_call_to_action" DROP COLUMN "eyebrow";
  ALTER TABLE "divisions" DROP COLUMN "subtitle";
  ALTER TABLE "divisions" DROP COLUMN "pillar";
  ALTER TABLE "divisions" DROP COLUMN "headline";
  ALTER TABLE "divisions" DROP COLUMN "audience";
  ALTER TABLE "_divisions_v" DROP COLUMN "version_subtitle";
  ALTER TABLE "_divisions_v" DROP COLUMN "version_pillar";
  ALTER TABLE "_divisions_v" DROP COLUMN "version_headline";
  ALTER TABLE "_divisions_v" DROP COLUMN "version_audience";
  ALTER TABLE "site_settings" DROP COLUMN "boilerplate";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_text";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_label";
  ALTER TABLE "site_settings" DROP COLUMN "announcement_href";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_boilerplate";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_announcement_text";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_announcement_label";
  ALTER TABLE "_site_settings_v" DROP COLUMN "version_announcement_href";
  DROP TYPE "public"."enum_pages_blocks_hero_visual";
  DROP TYPE "public"."enum_pages_blocks_doors_items_division";
  DROP TYPE "public"."enum_pages_blocks_commitments_items_division";
  DROP TYPE "public"."enum__pages_v_blocks_hero_visual";
  DROP TYPE "public"."enum__pages_v_blocks_doors_items_division";
  DROP TYPE "public"."enum__pages_v_blocks_commitments_items_division";`)
}
