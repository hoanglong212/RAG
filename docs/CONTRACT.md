# CONTRACT.md — Hợp đồng giữa hai track

Đặt tại `docs/CONTRACT.md`.

> **Đóng băng từ ngày 0.** Không track nào được sửa file này một mình. Cần đổi thì dừng cả hai track, sửa trên `main`, rebase, rồi mới chạy tiếp.

---

## 1. Kiểu dữ liệu chung

Đặt tại `src/types/contract.ts`. Cả hai track import từ đây.

```ts
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
```

---

## 2. API routes

| Đường dẫn | Method | Request | Response |
|---|---|---|---|
| `/api/documents` | GET | `?page&loai&coQuan` | `{ items: DocumentSummary[], total: number }` |
| `/api/documents/[id]` | GET | — | `DocumentDetail` |
| `/api/chat` | POST | `ChatRequest` | `ChatResponse` (stream, xem 2.1) |
| `/api/search` | POST | `ChatRequest` | `{ citations: Citation[] }` |
| `/api/stats` | GET | — | `StatsResponse` |
| `/api/eval/runs` | GET | — | `EvalRun[]` |
| `/api/eval/run` | POST | `{ configName }` | `EvalRun` |
| `/api/ingest` | POST | multipart | `{ documentId, warnings }` |

### 2.1 Giao thức stream của `/api/chat`

Server-Sent Events. Ba loại sự kiện:

```
event: citations
data: {"citations": [...]}          // gửi TRƯỚC, để UI hiện nguồn ngay

event: token
data: {"text": "..."}               // nhiều lần

event: done
data: {"status":"ok","topScore":0.82,"latencyMs":1430}
```

Gửi citations trước là chủ ý: người dùng thấy được nguồn trong lúc câu trả lời còn đang chảy ra. Đây cũng là chi tiết đáng nói khi demo.

### 2.2 Quy ước lỗi

Mọi lỗi trả HTTP 200 kèm `status` trong body, trừ lỗi hạ tầng thật (500). Lý do: `khong_tim_thay` không phải lỗi, nó là một câu trả lời hợp lệ và cần giao diện riêng.

```json
{ "status": "khong_tim_thay", "answer": null, "citations": [], "topScore": 0.31, "latencyMs": 890 }
```

---

## 3. Mock fixture

Đặt tại `src/mocks/`. Track UI dùng cho tới ngày 9.

```
src/mocks/
  documents.ts      3 văn bản: 1 nghị định đủ Chương/Điều/Khoản,
                    1 thông tư ngắn, 1 có warning parse
  detail.ts         DocumentDetail đầy đủ cho văn bản 1
  chat.ts           4 phản hồi:
                      - ok, 3 citation, score cao
                      - ok, 1 citation, score thấp
                      - khong_tim_thay
                      - loi
  stats.ts          StatsResponse đầy đủ + một bản mọi số bằng 0
  evalRuns.ts       5 dòng, recall tăng dần
```

**Bắt buộc có bản rỗng và bản lỗi.** Đây là hai trạng thái hay bị bỏ quên nhất, và là hai trạng thái dễ vỡ nhất lúc demo trực tiếp.

Dữ liệu mock phải dùng văn bản tiếng Việt thật, có dấu đầy đủ, có tên cơ quan dài (`Bộ Nông nghiệp và Phát triển nông thôn`) để lộ sớm lỗi tràn khung.

---

## 4. Nhật ký thay đổi

Mọi thay đổi contract ghi lại đây, kèm ngày và lý do.

| Ngày | Đổi gì | Lý do | Ai yêu cầu |
|---|---|---|---|
| | | | |
