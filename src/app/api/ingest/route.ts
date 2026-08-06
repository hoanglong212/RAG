/**
 * POST /api/ingest — nhan file upload, chay pipeline extract -> parse -> chunk -> embed -> ghi DB.
 * Hien thuc o Phase 3. Input validate bang Zod.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { loi: "Chưa hiện thực (Phase 3)." },
    { status: 501 },
  );
}
