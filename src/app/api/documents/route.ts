/**
 * GET /api/documents — danh sach van ban kem trang thai xu ly.
 * Hien thuc o Phase 3.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { loi: "Chưa hiện thực (Phase 3)." },
    { status: 501 },
  );
}
