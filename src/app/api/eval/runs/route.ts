import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { toEvalRun } from "@/lib/eval/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await sql`
      SELECT id, ten_lan_chay, cau_hinh, recall_at_5, recall_at_10,
             mrr, so_cau_hoi, created_at
      FROM lan_chay_eval
      ORDER BY created_at ASC
    `;
    return NextResponse.json(rows.map((row) => toEvalRun(row)));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đọc được các lần chạy eval." },
      { status: 500 },
    );
  }
}
