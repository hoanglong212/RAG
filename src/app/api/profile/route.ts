import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import { getOrCreateProfileId } from "@/lib/profile";
import { cookies } from "next/headers";
import type { UserProfileView } from "@/types/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200).nullable().optional(),
});

export async function GET() {
  const id = await getOrCreateProfileId();
  const rows = await sql`SELECT id, display_name, email FROM user_profiles WHERE id = ${id}`;
  return NextResponse.json(toView(rows[0]));
}

export async function PUT(request: Request) {
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thông tin hồ sơ không hợp lệ." }, { status: 400 });
  const id = await getOrCreateProfileId();
  const rows = await sql`
    UPDATE user_profiles
    SET display_name = ${parsed.data.displayName}, email = ${parsed.data.email ?? null}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, display_name, email`;
  return NextResponse.json(toView(rows[0]));
}

export async function DELETE() {
  const id = await getOrCreateProfileId();
  await sql`DELETE FROM user_profiles WHERE id = ${id}`;
  const jar = await cookies();
  jar.delete("legal_profile_id");
  return NextResponse.json({ ok: true });
}

function toView(row: Record<string, unknown>): UserProfileView {
  return { id: String(row.id), displayName: String(row.display_name), email: row.email ? String(row.email) : null };
}
