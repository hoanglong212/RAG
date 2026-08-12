# DECISIONS-D1.md — Chốt xung đột schema ↔ contract

Đặt tại `docs/DECISIONS-D1.md`. Cả hai track đọc trước khi chạy tiếp.

---

## Phát hiện chính

7 trong 8 mục Claude nêu **không phải contract đòi thêm.** Chúng là những trường đã có trong mục 4 của `KE-HOACH-RAG-VAN-BAN.md` nhưng bị lược đi khi Codex viết `schema.ts`.

Cụ thể, kế hoạch gốc đã đặc tả sẵn: bảng `doc_nodes` đầy đủ, cột `parse_warnings jsonb`, cột `trang_thai`, cột `strategy` trên `chunks`, và cả `recall_at_5` lẫn `recall_at_10` trên `eval_runs`.

Vậy hướng xử lý không phải là thương lượng giữa hai bên, mà là **khôi phục lại đặc tả**. Chỉ có đúng một mục là câu hỏi mở thật (`LoaiVanBan`), giải ở mục 3 dưới đây.

---

## 1. Bảng `doc_nodes` — bắt buộc, không có phương án thay thế

Claude hỏi: dựng cây lúc chạy từ `chunks`, hay lưu bảng riêng?

**Bắt buộc bảng riêng.** Ba lý do, mỗi lý do đủ để loại phương án dựng lại lúc chạy:

1. **Chunk là đầu ra của một chiến lược, cây là thuộc tính của văn bản.** Với `strategy = 'fixed'`, chunk cắt cứng 512 token, không còn quan hệ nào với cấu trúc Điều/Khoản. Dựng cây từ đó là không thể.
2. **Một chunk = một Điều làm mất hai tầng trên.** Chương và Mục không xuất hiện trong bảng `chunks`, nên cây dựng lại sẽ phẳng.
3. **`chunks.id` không ổn định.** Mỗi lần re-index sinh id mới. Contract hứa với giao diện một `nodeId` bền để neo trích dẫn và deep link. Không được phép đổi khi re-index.

**Nguyên tắc thiết kế:** `doc_nodes` sinh **một lần** lúc parse, độc lập hoàn toàn với chunking. Re-chunk bằng chiến lược khác không đụng tới `doc_nodes`. `chunks.node_id` trỏ ngược về nó.

```
parse  →  doc_nodes  (một lần, bền)
              ↑
           chunks.node_id  (sinh lại tự do theo từng strategy)
```

---

## 2. DDL sau khi sửa

Migration mới, không sửa migration cũ (4 commit đã đẩy rồi).

```sql
-- ============ documents: bổ sung 3 cột ============
ALTER TABLE documents
  ADD COLUMN trang_thai        text NOT NULL DEFAULT 'chua_xac_dinh',
  ADD COLUMN parse_warnings    jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN loai_van_ban_raw  text;

-- loi_chi_tiet cũ: giữ lại cho lỗi hạ tầng (đọc file hỏng, hết quota...).
-- parse_warnings dành riêng cho cảnh báo của parser. Hai thứ khác nhau,
-- đừng gộp.
-- coCanhBao KHÔNG lưu thành cột. Suy ra khi query:
--   jsonb_array_length(parse_warnings) > 0

-- ============ doc_nodes: bảng mới ============
CREATE TABLE doc_nodes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  parent_id    uuid REFERENCES doc_nodes(id) ON DELETE CASCADE,
  node_type    text NOT NULL,   -- chuong|muc|dieu|khoan|diem|phu_luc
  so_thu_tu    text,
  tieu_de      text,
  noi_dung     text NOT NULL DEFAULT '',
  breadcrumb   text NOT NULL,
  order_index  int  NOT NULL,
  depth        int  NOT NULL DEFAULT 0
);
CREATE INDEX ON doc_nodes(document_id, order_index);
CREATE INDEX ON doc_nodes(parent_id);

-- ============ chunks: bổ sung 2 cột ============
ALTER TABLE chunks
  ADD COLUMN node_id  uuid REFERENCES doc_nodes(id) ON DELETE CASCADE,
  ADD COLUMN strategy text NOT NULL DEFAULT 'structural';
CREATE INDEX ON chunks(strategy);
CREATE INDEX ON chunks(node_id);

-- node_id nullable có chủ ý: chunk sinh bởi strategy='fixed'
-- cắt ngang cấu trúc nên không map được về một node duy nhất.
-- Ràng buộc: strategy='structural' thì node_id BẮT BUỘC không null.
ALTER TABLE chunks ADD CONSTRAINT chunk_structural_has_node
  CHECK (strategy <> 'structural' OR node_id IS NOT NULL);

-- ============ eval_runs: bổ sung ============
ALTER TABLE eval_runs
  ADD COLUMN recall_at_10 real,
  ADD COLUMN embedder_name text,
  ADD COLUMN strategy text;
```

`depth` thêm vào để giao diện dựng cây không phải đệ quy đếm — track UI cần nó cho phần thụt lề của trục văn bản.

`embedder_name` và `strategy` trên `eval_runs`: ma trận 5 thí nghiệm ở mục 9.3 kế hoạch gốc thay đổi ba biến, mà bảng cũ chỉ có `config_name` dạng chuỗi tự do. Tách ra thì biểu đồ so sánh mới vẽ được đàng hoàng.

---

## 3. `LoaiVanBan` — mục duy nhất là câu hỏi mở thật

**Quyết định: slug thắng, giữ thêm chuỗi gốc.**

- `loai_van_ban` — slug từ enum đóng: `nghi_dinh | thong_tu | quyet_dinh | luat | nghi_quyet | cong_van | khac`
- `loai_van_ban_raw` — chuỗi parser trích được, nguyên văn

Lý do: text tự do sẽ làm biểu đồ "theo loại" trên dashboard tách `"Nghị định"`, `"NGHỊ ĐỊNH"`, `"Nghị Định"` thành ba cột riêng. Không nhóm được, không lọc được.

Giữ `raw` vì khi slug rơi vào `khac`, bạn cần biết parser đã thấy gì để sửa. Đây cũng là dữ liệu cho một dòng trên dashboard: số văn bản không phân loại được.

Nhãn hiển thị là bảng ánh xạ phía UI, không lưu DB:

```ts
export const NHAN_LOAI: Record<LoaiVanBan, string> = {
  nghi_dinh: 'Nghị định', thong_tu: 'Thông tư', quyet_dinh: 'Quyết định',
  luat: 'Luật', nghi_quyet: 'Nghị quyết', cong_van: 'Công văn', khac: 'Khác',
};
```

---

## 4. `mode: 'hybrid_rerank'`

Không đụng schema, chỉ là giá trị enum trong request. Contract giữ nguyên. Codex thực thi ở Phase 4.

---

## 5. Contract giữ nguyên, không sửa

Sau các thay đổi trên, `docs/CONTRACT.md` mục 1 **đúng như đang có**. Không cần chỉnh. Ghi một dòng vào nhật ký thay đổi cuối file CONTRACT:

| Ngày | Đổi gì | Lý do | Ai yêu cầu |
|---|---|---|---|
| D1 | Không đổi contract. Sửa schema cho khớp | schema.ts lược mất các trường đã đặc tả ở mục 4 kế hoạch gốc | Track B phát hiện |

---

## 6. Trạng thái phase thật

Codex báo "hoàn thành Phase 3". Theo tiêu chí nghiệm thu của kế hoạch:

| Phase | Yêu cầu | Thực tế |
|---|---|---|
| 1 — Parser | 5 văn bản mẫu, đúng 100% số Điều, test đủ 7 bẫy | 40/40 test pass, **cần xác minh có đủ 7 bẫy không** |
| 2 — Nạp dữ liệu | Nạp 50 văn bản, `count(*) GROUP BY strategy` ra hai con số | **Chưa đạt.** Không có dữ liệu, không có `.env.local`, và cột `strategy` còn chưa tồn tại |
| 3 — Retrieval + eval | 40 câu hỏi vàng, `hybrid.ts`, eval runner, 2 dòng `eval_runs` | **Chưa bắt đầu** |

Đang ở **giữa Phase 2**. Không cho sang Phase 4.

Việc cần làm để xác minh Phase 1: mở `src/lib/parser/__tests__/`, đối chiếu với 7 bẫy ở mục 5.3 kế hoạch gốc, đánh dấu bẫy nào chưa có test. Bẫy hay bị bỏ nhất là số 3 (chữ "Điều" giữa câu) và số 5 (chữ `đ` trong bảng chữ cái Điểm).

---

## 7. Thứ tự thực thi

| # | Việc | Ai làm |
|---|---|---|
| 1 | Xác minh branch, đổi `master` → `main`, tạo `track/core` `track/ui` | Bạn |
| 2 | Migration theo mục 2, cập nhật `schema.ts`, sửa pipeline ghi `doc_nodes` | Codex |
| 3 | Chép `src/types/contract.ts` từ CONTRACT mục 1, dựng 5 file mock | Claude |
| 4 | Dựng worktree | Bạn |
| 5 | `.env.local` + `data/raw` | Bạn — xem mục 8 |
| 6 | Hoàn tất Phase 2: nạp 50 văn bản thật, hai strategy | Codex |

Bước 2 và 3 chạy song song được — Codex sửa `src/lib/db/`, Claude viết `src/types/` và `src/mocks/`, không giao nhau.

---

## 8. Chặn cứng: chỉ bạn gỡ được

Codex đang đứng vì thiếu hai thứ, và không agent nào tạo ra chúng được.

**`.env.local`** — Postgres có pgvector, khoá API embedding. Neon free tier khoảng 5 phút.

**`data/raw` với 50–80 văn bản** — đây mới là phần tốn thời gian thật, vài tiếng ngồi tải và chọn. Không bỏ qua được, và cũng không nên bỏ qua: đây chính là buổi bạn đọc kỹ bộ tài liệu của mình, mà tới Phase 3 bạn sẽ cần hiểu chúng để soạn 40 câu hỏi vàng.

Gợi ý chọn: lấy trọn một lĩnh vực hẹp thay vì rải rác nhiều lĩnh vực. Một nghị định gốc kèm các thông tư hướng dẫn nó, cộng vài quyết định liên quan. Bộ tài liệu có liên kết chéo sẽ cho câu hỏi vàng hay hơn hẳn, và làm phần trích dẫn chéo ở trục văn bản có ý nghĩa.
