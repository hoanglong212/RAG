import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { chunks, documents } from "../db/schema";
import type { CompleteDocumentInput, IngestStorage } from "./pipeline";

export class DrizzleIngestStorage implements IngestStorage {
  async createPending(fileName: string): Promise<string> {
    const [created] = await db
      .insert(documents)
      .values({ ten_file: fileName, trang_thai: "dang_xu_ly" })
      .returning({ id: documents.id });
    if (!created) throw new Error("Không tạo được bản ghi document đang xử lý.");
    return created.id;
  }

  async complete(documentId: string, input: CompleteDocumentInput): Promise<void> {
    await db.transaction(async (transaction) => {
      if (input.chunks.length > 0) {
        await transaction.insert(chunks).values(
          input.chunks.map((chunk) => ({
            document_id: documentId,
            chuong: chunk.chuong,
            chuong_tieu_de: chunk.chuong_tieu_de,
            muc: chunk.muc,
            muc_tieu_de: chunk.muc_tieu_de,
            dieu_so: chunk.dieu_so,
            dieu_tieu_de: chunk.dieu_tieu_de,
            khoan_so: chunk.khoan_so,
            diem: chunk.diem,
            phu_luc: chunk.phu_luc,
            duong_dan: chunk.duong_dan,
            noi_dung: chunk.noi_dung,
            noi_dung_kem_ngu_canh: chunk.noi_dung_kem_ngu_canh,
            vi_tri_trang: chunk.vi_tri_trang,
            so_token: chunk.so_token,
            bi_cat_cung: chunk.bi_cat_cung,
            embedding: chunk.embedding,
          })),
        );
      }

      const [updated] = await transaction
        .update(documents)
        .set({
          ...input.metadata,
          so_trang: input.pageCount,
          trang_thai: "hoan_tat",
          loi_chi_tiet: input.warningDetail,
        })
        .where(eq(documents.id, documentId))
        .returning({ id: documents.id });
      if (!updated) throw new Error("Không tìm thấy document để hoàn tất ingest.");
    });
  }

  async fail(documentId: string, detail: string): Promise<void> {
    const [updated] = await db
      .update(documents)
      .set({ trang_thai: "loi", loi_chi_tiet: detail })
      .where(eq(documents.id, documentId))
      .returning({ id: documents.id });
    if (!updated) throw new Error("Không tìm thấy document để ghi trạng thái lỗi.");
  }
}
