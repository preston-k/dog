import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sql`DELETE FROM dog_activities WHERE id = ${parseInt(id)}`;
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { logged_at, notes, activity_type } = body;

  const [row] = await sql`
    UPDATE dog_activities
    SET
      logged_at    = COALESCE(${logged_at ? new Date(logged_at).toISOString() : null}::timestamptz, logged_at),
      notes        = COALESCE(${notes ?? null}, notes),
      activity_type = COALESCE(${activity_type ?? null}, activity_type)
    WHERE id = ${parseInt(id)}
    RETURNING *
  `;
  return NextResponse.json(row);
}
