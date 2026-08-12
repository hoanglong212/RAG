import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { syncAllNewsSources } from "@/lib/news/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;
  try {
    const results = await syncAllNewsSources(sql);
    const ok = results.filter((result) => result.status === "ok").length;
    return NextResponse.json({
      status: ok === results.length ? "ok" : ok === 0 ? "error" : "partial",
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không đồng bộ được nguồn tin." },
      { status: 500 },
    );
  }
}

function authorize(request: Request): Response | null {
  const token = process.env.NEWS_SYNC_TOKEN?.trim();
  if (!token && process.env.NODE_ENV !== "production") return null;
  if (!token) {
    return NextResponse.json({ error: "Production chưa cấu hình NEWS_SYNC_TOKEN." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Không có quyền đồng bộ nguồn tin." }, { status: 401 });
  }
  return null;
}
