import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export { sql };

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS dog_activities (
      id SERIAL PRIMARY KEY,
      activity_type VARCHAR(50) NOT NULL,
      logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
