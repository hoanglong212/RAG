/**
 * POST /api/ask — nhan cau hoi, timKiem(mode='hybrid', topK=8), goi LLM, ghi log vao bang truy_van.
 * Hien thuc o Phase 6. Input validate bang Zod.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { loi: "Chưa hiện thực (Phase 6)." },
    { status: 501 },
  );
}
