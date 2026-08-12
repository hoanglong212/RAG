/**
 * Dieu phoi parser: text tho -> chuan hoa NFC -> metadata + cay cau truc -> danh sach chunk.
 * Doan nao khong hieu duoc thi day vao mang canh_bao, khong im lang bo qua.
 */
import { bocMetadata } from "./metadata";
import { chuanHoaVanBan, demSoTrang, tachCauTruc, taoChunk, taoDocNodes } from "./structure";
import type { KetQuaParse } from "./types";

export interface TuyChonParse {
  /** Dung lam ten van ban trong duong_dan khi chua boc duoc so hieu. */
  tenFile?: string;
}

export function parseVanBan(raw: string, tuyChon: TuyChonParse = {}): KetQuaParse {
  const tenFile = tuyChon.tenFile ?? "Văn bản";
  const soTrang = demSoTrang(raw);
  const dong = chuanHoaVanBan(raw);

  const ketQuaMetadata = bocMetadata(dong);
  const cauTruc = tachCauTruc(dong, soTrang);
  const nodes = taoDocNodes(cauTruc);
  const ketQuaChunk = taoChunk(cauTruc, ketQuaMetadata.metadata, tenFile);

  return {
    metadata: ketQuaMetadata.metadata,
    nodes,
    chunks: ketQuaChunk.chunks,
    canh_bao: [
      ...ketQuaMetadata.canh_bao,
      ...cauTruc.canh_bao,
      ...ketQuaChunk.canh_bao,
    ],
    so_trang: soTrang,
  };
}

export { chuanHoaVanBan, tachCauTruc, taoChunk, taoDocNodes, uocLuongSoToken } from "./structure";
export { bocMetadata } from "./metadata";
export type {
  CanhBao,
  ChunkParse,
  DocNodeParse,
  DocNodeType,
  KetQuaParse,
  LoaiVanBan,
  MetadataVanBan,
} from "./types";
