import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE 'login';
  ALTER TABLE "audit_logs" ADD COLUMN "actor_email" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Hand-added: the old enum has no 'login', so rolling back would have to
  // delete sign-in history. Refuse instead - export those entries first
  // and delete them deliberately if a rollback is really needed.
  await db.execute(sql`
   DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM "audit_logs" WHERE "action" = 'login') THEN
      RAISE EXCEPTION 'audit_logs holds sign-in entries; rolling back would delete them. Export and remove them first.';
    END IF;
  END $$;
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE text;
  DROP TYPE "public"."enum_audit_logs_action";
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('read', 'create', 'update', 'delete');
  ALTER TABLE "audit_logs" ALTER COLUMN "action" SET DATA TYPE "public"."enum_audit_logs_action" USING "action"::"public"."enum_audit_logs_action";
  ALTER TABLE "audit_logs" DROP COLUMN "actor_email";`)
}
