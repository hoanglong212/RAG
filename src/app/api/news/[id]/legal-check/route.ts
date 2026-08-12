import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { checkLegalScenario } from "@/lib/legal/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const rows = await sql`
      SELECT title, summary FROM news_articles WHERE id::text = ${id} LIMIT 1
    `;
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Không tìm thấy bài tin." }, { status: 404 });
    const scenario = `${String(row.title)}\n${row.summary === null ? "" : String(row.summary)}`.trim();
    return NextResponse.json(await checkLegalScenario(scenario));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đối chiếu được bài tin." },
      { status: 500 },
    );
  }
}
