import { NextRequest, NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

const VALID_TYPES = ["pee", "poop", "eat", "drink"];

export async function GET(req: NextRequest) {
  await initDb();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "200");
  const type = searchParams.get("type");

  const rows = type && VALID_TYPES.includes(type)
    ? await sql`SELECT * FROM dog_activities WHERE activity_type = ${type} ORDER BY logged_at DESC LIMIT ${limit}`
    : await sql`SELECT * FROM dog_activities ORDER BY logged_at DESC LIMIT ${limit}`;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const { activity_type, logged_at, notes } = body;

  if (!activity_type || !VALID_TYPES.includes(activity_type)) {
    return NextResponse.json({ error: "Invalid activity_type" }, { status: 400 });
  }

  const timestamp = logged_at ? new Date(logged_at) : new Date();
  const [row] = await sql`
    INSERT INTO dog_activities (activity_type, logged_at, notes)
    VALUES (${activity_type}, ${timestamp.toISOString()}, ${notes ?? null})
    RETURNING *
  `;

  return NextResponse.json(row, { status: 201 });
}
