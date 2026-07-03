import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
config({ path: ".env.local" });

// drizzle-kit needs a direct/session connection (port 5432), not the transaction
// pooler (port 6543) which hangs on introspection queries.
// DRIZZLE_URL overrides DATABASE_URL when running drizzle-kit commands.
const dbUrl = process.env.DRIZZLE_URL ?? process.env.DATABASE_URL!;

export default defineConfig({
  schema: "./lib/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
  verbose: true,
  strict: true,
});
