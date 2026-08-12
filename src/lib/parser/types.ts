/**
 * Kieu du lieu dung chung cho parser.
 * Ten truong nghiep vu giu nguyen tieng Viet khong dau de khop voi cot trong DB.
 */
import type { LOAI_VAN_BAN } from "./patterns";
import type { NodeType } from "../../types/contract";

export type LoaiVanBan = (typeof LOAI_VAN_BAN)[number];

export interface MetadataVanBan {
  so_hieu: string | null;
  loai_van_ban: LoaiVanBan | null;
  /** Chuoi loai van ban dung nguyen cach viet trong file goc. */
  loai_van_ban_raw: string | null;
  co_quan_ban_hanh: string | null;
  /** ISO yyyy-mm-dd */
  ngay_ban_hanh: string | null;
  /** ISO yyyy-mm-dd */
  ngay_hieu_luc: string | null;
  trich_yeu: string | null;
}

export type LoaiCanhBao =
  | "thieu_metadata"
  | "khong_co_dieu"
  | "khoan_khong_lien_tuc"
  | "diem_khong_lien_tuc"
  | "chunk_bi_cat_cung"
  | "noi_dung_ngoai_cau_truc";

/** Parser khong nuot loi: cho nao khong hieu duoc thi day vao day. */
export interface CanhBao {
  loai: LoaiCanhBao;
  thong_diep: string;
  /** Chi so dong trong van ban da chuan hoa, neu xac dinh duoc. */
  dong?: number;
}

/** Mot don vi truy hoi, tuong ung mot dong bang `chunks`. */
export interface ChunkParse {
  /** Khoa noi bo de noi chunk structural vao doc_nodes luc persist. */
  node_key: string | null;
  chuong: string | null;
  chuong_tieu_de: string | null;
  muc: string | null;
  muc_tieu_de: string | null;
  dieu_so: number | null;
  dieu_tieu_de: string | null;
  khoan_so: number | null;
  diem: string | null;
  /** Ten phu luc, khac null thi chunk nay thuoc phan phu luc chu khong thuoc Dieu nao. */
  phu_luc: string | null;
  duong_dan: string;
  noi_dung: string;
  /** duong_dan + noi_dung — DAY la thu dem di embed (PLAN.md muc 7.3). */
  noi_dung_kem_ngu_canh: string;
  vi_tri_trang: number;
  so_token: number;
  /** true khi buoc phai cat theo cau vi khoi van ban qua dai. */
  bi_cat_cung: boolean;
}

export type DocNodeType = NodeType;

/** Cay parser dang phang; key chi dung trong mot lan persist, khong ghi vao DB. */
export interface DocNodeParse {
  key: string;
  parent_key: string | null;
  node_type: DocNodeType;
  so_thu_tu: string | null;
  tieu_de: string | null;
  noi_dung: string;
  breadcrumb: string;
  order_index: number;
  depth: number;
}

export interface KetQuaParse {
  metadata: MetadataVanBan;
  nodes: DocNodeParse[];
  chunks: ChunkParse[];
  canh_bao: CanhBao[];
  so_trang: number;
}
