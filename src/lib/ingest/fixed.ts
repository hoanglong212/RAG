import type { ChunkParse, DocNodeParse } from "../parser";

export const FIXED_CHUNK_TOKENS = 512;
export const FIXED_CHUNK_OVERLAP = 64;

/**
 * Tao corpus canonical tu cac node da nhan dang, moi noi dung chi xuat hien mot lan.
 * Fixed va structural nhờ vậy so sanh tren cung phan than van ban phap ly; fixed
 * khong bi chen them header/can-cu ma structural khong chunk.
 */
export function buildFixedCorpusText(nodes: DocNodeParse[]): string {
  return [...nodes]
    .sort((left, right) => left.order_index - right.order_index)
    .map((node) => {
      const ordinal = node.so_thu_tu ?? "";
      let heading = "";
      if (node.node_type === "chuong") heading = `Chương ${ordinal}`.trim();
      if (node.node_type === "muc") heading = `Mục ${ordinal}`.trim();
      if (node.node_type === "dieu") heading = `Điều ${ordinal}`.trim();
      if (node.node_type === "khoan") heading = ordinal === "" ? "" : `${ordinal}.`;
      if (node.node_type === "diem") heading = ordinal === "" ? "" : `${ordinal})`;
      if (node.node_type === "phu_luc") heading = node.tieu_de ?? `PHỤ LỤC ${ordinal}`.trim();
      if (node.node_type !== "phu_luc" && node.tieu_de) {
        heading = `${heading}${heading === "" ? "" : ". "}${node.tieu_de}`;
      }
      return [heading, node.noi_dung].filter((part) => part.trim() !== "").join("\n");
    })
    .filter((part) => part !== "")
    .join("\n");
}

/** Baseline de so sanh voi structural chunking: cua so 512 tu, chong lan 64 tu. */
export function createFixedChunks(
  text: string,
  documentLabel: string,
  chunkTokens = FIXED_CHUNK_TOKENS,
  overlapTokens = FIXED_CHUNK_OVERLAP,
): ChunkParse[] {
  if (!Number.isInteger(chunkTokens) || chunkTokens <= 0) {
    throw new Error("Kich thuoc fixed chunk phai la so nguyen duong.");
  }
  if (!Number.isInteger(overlapTokens) || overlapTokens < 0 || overlapTokens >= chunkTokens) {
    throw new Error("Overlap fixed chunk phai tu 0 den nho hon kich thuoc chunk.");
  }
  const words = text.normalize("NFC").trim().split(/\s+/).filter(Boolean);
  const chunks: ChunkParse[] = [];
  const stepTokens = chunkTokens - overlapTokens;
  for (let offset = 0; offset < words.length; offset += stepTokens) {
    const noiDung = words.slice(offset, offset + chunkTokens).join(" ");
    const index = chunks.length + 1;
    const duongDan = `${documentLabel} > Khối cố định ${index}`;
    chunks.push({
      node_key: null,
      chuong: null,
      chuong_tieu_de: null,
      muc: null,
      muc_tieu_de: null,
      dieu_so: null,
      dieu_tieu_de: null,
      khoan_so: null,
      diem: null,
      phu_luc: null,
      duong_dan: duongDan,
      noi_dung: noiDung,
      noi_dung_kem_ngu_canh: `${duongDan}\n${noiDung}`,
      vi_tri_trang: 1,
      so_token: Math.min(chunkTokens, words.length - offset),
      bi_cat_cung: false,
    });
    if (offset + chunkTokens >= words.length) break;
  }
  return chunks;
}
