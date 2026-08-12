import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/client";
import { getOrCreateProfileId } from "@/lib/profile";
import { NEWS_TOPICS } from "@/types/news";
import type { LegalCaseView } from "@/types/platform";

export const runtime = "nodejs";

const createSchema = z.object({
  title: z.string().trim().min(1).max(200),
  scenario: z.string().trim().min(10).max(5_000),
  topic: z.enum(NEWS_TOPICS).nullable().optional(),
  status: z.string().trim().max(30).default("analyzed"),
  analysis: z.unknown().nullable().optional(),
});

export async function GET() {
  const userId = await getOrCreateProfileId();
  const rows = await sql`
    SELECT id, title, scenario, topic, status, analysis, created_at, updated_at
    FROM legal_cases WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 100`;
  return NextResponse.json(rows.map(toView));
}

export async function POST(request: Request) {
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Hồ sơ không hợp lệ." }, { status: 400 });
  const userId = await getOrCreateProfileId();
  const rows = await sql`
    INSERT INTO legal_cases (user_id, title, scenario, topic, status, analysis)
    VALUES (${userId}, ${parsed.data.title}, ${parsed.data.scenario}, ${parsed.data.topic ?? null},
            ${parsed.data.status}, ${JSON.stringify(parsed.data.analysis ?? null)}::jsonb)
    RETURNING id, title, scenario, topic, status, analysis, created_at, updated_at`;
  return NextResponse.json(toView(rows[0]), { status: 201 });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Mã hồ sơ không hợp lệ." }, { status: 400 });
  const userId = await getOrCreateProfileId();
  await sql`DELETE FROM legal_cases WHERE id = ${id} AND user_id = ${userId}`;
  return NextResponse.json({ ok: true });
}

function toView(row: Record<string, unknown>): LegalCaseView {
  return {
    id: String(row.id), title: String(row.title), scenario: String(row.scenario),
    topic: (row.topic as LegalCaseView["topic"]) ?? null, status: String(row.status),
    analysis: (row.analysis as LegalCaseView["analysis"]) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}
