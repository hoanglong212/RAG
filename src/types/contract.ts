/**
 * Kiểu dữ liệu chung giữa hai track.
 *
 * CHÉP NGUYÊN VĂN từ docs/CONTRACT.md mục 1. Không thêm, không bớt, không sửa.
 * Cần đổi thì dừng cả hai track, sửa CONTRACT.md trên main, rồi chép lại.
 *
 * Nhãn hiển thị tiếng Việt nằm ở src/types/nhan.ts, không nằm ở đây.
 */

// ---------- Văn bản ----------

export type LoaiVanBan =
  | 'nghi_dinh' | 'thong_tu' | 'quyet_dinh'
  | 'luat' | 'nghi_quyet' | 'cong_van' | 'khac';

export type TrangThaiHieuLuc = 'con_hieu_luc' | 'het_hieu_luc' | 'chua_xac_dinh';

export interface DocumentSummary {
  id: string;
  soHieu: string | null;            // "15/2020/NĐ-CP"
  loaiVanBan: LoaiVanBan;
  coQuan: string | null;
  trichYeu: string | null;
  ngayBanHanh: string | null;       // ISO date "2020-02-03"
  ngayHieuLuc: string | null;
  trangThai: TrangThaiHieuLuc;
  soDieu: number;                   // tổng số Điều, cho danh sách
  coCanhBao: boolean;               // parse có warning không
}

// ---------- Cây cấu trúc ----------

export type NodeType = 'chuong' | 'muc' | 'dieu' | 'khoan' | 'diem' | 'phu_luc';

export interface DocNode {
  id: string;
  type: NodeType;
  soThuTu: string;                  // "II" | "8" | "3" | "đ"
  tieuDe: string | null;
  noiDung: string;
  breadcrumb: string;               // "Chương II > Điều 8 > Khoản 3"
  children: DocNode[];
}

export interface DocumentDetail extends DocumentSummary {
  tree: DocNode[];
  warnings: ParseWarning[];
}

export interface ParseWarning {
  code:
    | 'DIEU_NHAY_COC' | 'THIEU_SO_HIEU' | 'KHONG_XAC_DINH_LOAI'
    | 'KHOAN_KHONG_TRONG_DIEU' | 'PHU_LUC_KHONG_PARSE';
  message: string;
  line?: number;
}

// ---------- Trích dẫn ----------

export interface Citation {
  chunkId: string;
  documentId: string;
  nodeId: string;                   // để giao diện nhảy tới đúng node
  soHieu: string;
  breadcrumb: string;
  trichDoan: string;                // đoạn ngắn để hiện trong tooltip
  score: number;                    // 0..1
}

// ---------- Chat ----------

export interface ChatRequest {
  question: string;
  strategy?: 'structural' | 'fixed';
  mode?: 'vector' | 'hybrid' | 'hybrid_rerank';
}

export type ChatStatus = 'ok' | 'khong_tim_thay' | 'loi';

export interface ChatResponse {
  status: ChatStatus;
  answer: string | null;            // null khi status !== 'ok'
  citations: Citation[];            // rỗng khi khong_tim_thay
  topScore: number;
  nguong: number;                   // ngưỡng tin cậy đang áp dụng
  latencyMs: number;
}

// ---------- Dashboard ----------

export interface StatsResponse {
  tongVanBan: number;
  tongChunk: number;
  theoLoai:    { loai: LoaiVanBan; soLuong: number }[];
  theoCoQuan:  { coQuan: string; soLuong: number }[];
  theoNam:     { nam: number; soLuong: number }[];
  sapHetHieuLuc: DocumentSummary[];
  tyLeParseSach: number;            // 0..1
  phanBoScore: { khoang: string; soLuong: number }[];
  cauHoiDiemThap: { question: string; topScore: number; at: string }[];
  latencyP50: number;
  latencyP95: number;
  tyLeCoTrichDan: number;           // 0..1
}

// ---------- Eval ----------

export interface EvalRun {
  id: string;
  configName: string;               // "vector-only" | "hybrid" | ...
  recallAt5: number;
  recallAt10: number;
  mrr: number;
  nQuestions: number;
  notes: string | null;
  runAt: string;                    // ISO datetime
}
