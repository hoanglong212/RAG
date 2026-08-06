/**
 * Dieu phoi parser: text tho -> chuan hoa NFC -> metadata + cay cau truc -> danh sach chunk.
 * Doan nao khong hieu duoc thi day vao mang canh_bao, khong im lang bo qua.
 */
import { bocMetadata } from "./metadata";
import { chuanHoaVanBan, demSoTrang, tachCauTruc, taoChunk } from "./structure";
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
  const ketQuaChunk = taoChunk(cauTruc, ketQuaMetadata.metadata, tenFile);

  return {
    metadata: ketQuaMetadata.metadata,
    chunks: ketQuaChunk.chunks,
    canh_bao: [
      ...ketQuaMetadata.canh_bao,
      ...cauTruc.canh_bao,
      ...ketQuaChunk.canh_bao,
    ],
    so_trang: soTrang,
  };
}

export { chuanHoaVanBan, tachCauTruc, taoChunk, uocLuongSoToken } from "./structure";
export { bocMetadata } from "./metadata";
export type {
  CanhBao,
  ChunkParse,
  KetQuaParse,
  LoaiVanBan,
  MetadataVanBan,
} from "./types";
