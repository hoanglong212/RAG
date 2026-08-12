import { NextResponse } from "next/server";
import { z } from "zod";
import { createEmbeddingProvider } from "@/lib/embedding/provider";
import { isSupportedDocumentName, UnsupportedDocumentError } from "@/lib/ingest/extract";
import { ingestDocument, IngestDocumentError } from "@/lib/ingest/pipeline";
import { toContractWarnings } from "@/lib/ingest/warnings";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const uploadSchema = z
  .custom<File>((value) => value instanceof File, "Trường file là bắt buộc.")
  .refine((file) => file.size > 0, "Tệp tải lên đang rỗng.")
  .refine((file) => file.size <= MAX_UPLOAD_BYTES, "Tệp vượt quá giới hạn 25 MB.");

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const parsedFile = uploadSchema.safeParse(form.get("file"));
    if (!parsedFile.success) {
      return NextResponse.json(
        { error: parsedFile.error.issues[0]?.message ?? "Tệp không hợp lệ." },
        { status: 400 },
      );
    }

    const file = parsedFile.data;
    if (!isSupportedDocumentName(file.name)) {
      throw new UnsupportedDocumentError(file.name.includes(".") ? `.${file.name.split(".").pop()}` : "");
    }
    const [embeddingProvider, data, { DrizzleIngestStorage }] = await Promise.all([
      createEmbeddingProvider(),
      file.arrayBuffer(),
      import("@/lib/ingest/storage"),
    ]);
    const result = await ingestDocument(
      { fileName: file.name, data: new Uint8Array(data) },
      { storage: new DrizzleIngestStorage(), embeddingProvider },
    );

    return NextResponse.json({
      documentId: result.documentId,
      warnings: toContractWarnings(result.warnings),
    });
  } catch (error) {
    if (error instanceof UnsupportedDocumentError) {
      return NextResponse.json({ error: error.message }, { status: 415 });
    }
    if (error instanceof IngestDocumentError) {
      return NextResponse.json(
        { error: error.message, documentId: error.documentId },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể nạp văn bản." },
      { status: 500 },
    );
  }
}
