import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import {
  chunks,
  doc_nodes,
  documents,
  type LoaiVanBanSlug,
} from "../db/schema";
import type { LoaiVanBan } from "../parser";
import type { CompleteDocumentInput, IngestStorage } from "./pipeline";

export class DrizzleIngestStorage implements IngestStorage {
  async createPending(fileName: string): Promise<string> {
    const [created] = await db
      .insert(documents)
      .values({ ten_file: fileName, ingest_status: "dang_xu_ly" })
      .returning({ id: documents.id });
    if (!created) throw new Error("Không tạo được bản ghi document đang xử lý.");
    return created.id;
  }

  async complete(documentId: string, input: CompleteDocumentInput): Promise<void> {
    await db.transaction(async (transaction) => {
      const nodeIds = new Map(input.nodes.map((node) => [node.key, randomUUID()]));
      if (input.nodes.length > 0) {
        await transaction.insert(doc_nodes).values(
          input.nodes.map((node) => {
            const parentId = node.parent_key ? nodeIds.get(node.parent_key) : null;
            if (node.parent_key && !parentId) {
              throw new Error(`Không tìm thấy node cha "${node.parent_key}".`);
            }
            return {
              id: nodeIds.get(node.key),
              document_id: documentId,
              parent_id: parentId,
              node_type: node.node_type,
              so_thu_tu: node.so_thu_tu,
              tieu_de: node.tieu_de,
              noi_dung: node.noi_dung,
              breadcrumb: node.breadcrumb,
              order_index: node.order_index,
              depth: node.depth,
            };
          }),
        );
      }

      if (input.chunks.length > 0) {
        await transaction.insert(chunks).values(
          input.chunks.map((chunk) => {
            const nodeId = chunk.node_key ? nodeIds.get(chunk.node_key) : null;
            if (input.strategy === "structural" && !nodeId) {
              throw new Error(`Chunk structural không ánh xạ được doc_node "${chunk.node_key}".`);
            }
            return {
              document_id: documentId,
              node_id: nodeId,
              strategy: input.strategy,
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
            };
          }),
        );
      }

      const [updated] = await transaction
        .update(documents)
        .set({
          so_hieu: input.metadata.so_hieu,
          loai_van_ban: toDocumentTypeSlug(input.metadata.loai_van_ban),
          loai_van_ban_raw: input.metadata.loai_van_ban_raw,
          co_quan_ban_hanh: input.metadata.co_quan_ban_hanh,
          ngay_ban_hanh: input.metadata.ngay_ban_hanh,
          ngay_hieu_luc: input.metadata.ngay_hieu_luc,
          trich_yeu: input.metadata.trich_yeu,
          so_trang: input.pageCount,
          parse_warnings: input.parseWarnings,
          ingest_status: "hoan_tat",
          loi_chi_tiet: null,
        })
        .where(eq(documents.id, documentId))
        .returning({ id: documents.id });
      if (!updated) throw new Error("Không tìm thấy document để hoàn tất ingest.");
    });
  }

  async fail(documentId: string, detail: string): Promise<void> {
    const [updated] = await db
      .update(documents)
      .set({ ingest_status: "loi", loi_chi_tiet: detail })
      .where(eq(documents.id, documentId))
      .returning({ id: documents.id });
    if (!updated) throw new Error("Không tìm thấy document để ghi trạng thái lỗi.");
  }
}

function toDocumentTypeSlug(value: LoaiVanBan | null): LoaiVanBanSlug {
  const mapping: Partial<Record<LoaiVanBan, LoaiVanBanSlug>> = {
    "Nghị định": "nghi_dinh",
    "Thông tư": "thong_tu",
    "Thông tư liên tịch": "thong_tu",
    "Quyết định": "quyet_dinh",
    Luật: "luat",
    "Nghị quyết": "nghi_quyet",
    "Công văn": "cong_van",
  };
  return value ? (mapping[value] ?? "khac") : "khac";
}
