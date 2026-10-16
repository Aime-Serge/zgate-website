/**
 * The schemas other products rely on, whose compatibility is guarded
 * (compat.test.ts). Add every schema consumers may parse with; never
 * remove one in place.
 */
import { z } from "zod";
import { attributionSchema, leadFormSchema, leadWebhookPayloadSchema } from "../src/index.ts";

const published = {
  leadFormSchema,
  attributionSchema,
  leadWebhookPayloadSchema,
};

/** JSON Schema of each published schema, as consumers see validated data. */
export function currentSnapshot(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(published).map(([name, schema]) => [
      name,
      z.toJSONSchema(schema, { io: "output", unrepresentable: "any" }),
    ]),
  );
}
