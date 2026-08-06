# Kế hoạch xây dựng: Hệ thống RAG cho văn bản hành chính Việt Nam + Dashboard

> Tài liệu này viết để nạp vào Claude Code. Đọc mục 0 trước khi bắt đầu.

---

## 0. Hướng dẫn sử dụng tài liệu này

### Đừng paste cả file này vào Claude Code cùng lúc

Nếu paste hết, Claude Code sẽ cố làm tất cả trong một lượt và mọi thứ đều xong 70%. Cách dùng đúng:

1. Tạo thư mục dự án, lưu file này vào đó với tên `PLAN.md`.
2. Mỗi Phase là **một phiên làm việc riêng**. Mở phiên mới, gõ đúng câu prompt ghi ở đầu Phase đó.
3. Chạy phần "Nghiệm thu" ở cuối mỗi Phase. Chưa qua thì chưa sang Phase tiếp theo.
4. Sau mỗi Phase, commit. Không gộp nhiều Phase vào một commit.

### Giả định đã chốt — sửa nếu không đúng

| Hạng mục | Đã chọn | Đổi nếu |
|---|---|---|
| Ngôn ngữ | TypeScript, Next.js App Router | Mentor yêu cầu tách riêng backend |
| Database | Postgres + pgvector (Neon hoặc Supabase free tier) | Công ty bắt dùng DB nội bộ |
| ORM | Drizzle | — |
| Embedding | API hosted ở Phase 1, model tiếng Việt ở Phase 7 | Dữ liệu nội bộ không được gửi ra ngoài → làm Phase 7 trước |
| Nguồn dữ liệu | Văn bản pháp quy công khai, 50–100 file | Có tài liệu nội bộ thì dùng, nhưng **phải hỏi mentor trước khi gửi lên API bên ngoài** |
| Thời gian | 12–14 ngày | — |

### Cảnh báo quan trọng về dữ liệu

Nếu dùng tài liệu nội bộ của công ty, **hỏi mentor trước** xem có được gửi nội dung lên API bên thứ ba (OpenAI, Google, Anthropic) không. Nhiều nơi cấm tuyệt đối. Nếu bị cấm, bạn phải làm Phase 7 (self-host embedding) ngay từ đầu, và dùng LLM self-host hoặc chỉ demo với dữ liệu công khai.

---

## 1. Sản phẩm cần đạt

Một web app cho phép:

- Upload văn bản hành chính (PDF/DOCX), hệ thống tự bóc tách cấu trúc Chương/Mục/Điều/Khoản/Điểm và metadata (số hiệu, loại văn bản, cơ quan ban hành, ngày ban hành).
- Đặt câu hỏi bằng tiếng Việt, nhận câu trả lời **kèm trích dẫn chính xác tới Điều/Khoản**, bấm vào là nhảy tới đúng đoạn văn bản gốc.
- Một dashboard thống kê kho văn bản và chất lượng truy hồi.
- Một bộ đánh giá (eval) đo Recall@5 và MRR, có bảng so sánh trước/sau từng cải tiến.

### Điểm khác biệt cần bảo vệ được

1. Chunk theo cấu trúc pháp lý, không cắt cứng theo độ dài.
2. Hybrid search: vector + full-text, để bắt được số hiệu văn bản dạng `15/2020/NĐ-CP`.
3. Có số đo định lượng, không chỉ có demo chạy được.

### Ngoài phạm vi — KHÔNG làm

Ghi rõ để Claude Code không tự ý mở rộng:

- Không OCR. Chỉ nhận PDF có sẵn text layer. File scan thì báo lỗi rõ ràng cho người dùng.
- Không chat nhiều lượt có nhớ ngữ cảnh. Mỗi câu hỏi độc lập.
- Không phân quyền nhiều vai trò. Một tài khoản admin duy nhất là đủ.
- Không GraphRAG, không agent, không multi-hop reasoning.
- Không real-time, không websocket.
- Không mobile app.
- Không i18n. Toàn bộ UI tiếng Việt.

---

## 2. Tech stack — đã chốt, không bàn lại

```
Next.js 15 (App Router) + TypeScript
Tailwind CSS + shadcn/ui
Drizzle ORM + Postgres 16 + pgvector
Recharts (biểu đồ dashboard)
Vitest (test cho parser)
```

**Vì sao Drizzle chứ không Prisma:** Drizzle có kiểu cột `vector` và hàm `cosineDistance` hỗ trợ sẵn cho pgvector. Prisma phải khai `Unsupported("vector(768)")` rồi viết raw SQL, rườm rà hơn nhiều cho đúng use case này.

**Vì sao Postgres chứ không Pinecone/Qdrant:** cần một kho duy nhất phục vụ cả vector search, full-text search, và aggregate cho dashboard. Tách hai kho là tự chuốc khổ ở Phase 8.

---

## 3. Lược đồ cơ sở dữ liệu

```typescript
// documents — mỗi văn bản gốc
documents {
  id              uuid PK
  ten_file        text
  so_hieu         text        // "15/2020/NĐ-CP"
  loai_van_ban    text        // "Nghị định" | "Thông tư" | "Quyết định" | ...
  co_quan_ban_hanh text
  ngay_ban_hanh   date
  ngay_hieu_luc   date
  trich_yeu       text        // tiêu đề tóm tắt
  so_trang        integer
  trang_thai      text        // 'dang_xu_ly' | 'hoan_tat' | 'loi'
  loi_chi_tiet    text
  created_at      timestamptz
}

// chunks — đơn vị truy hồi
chunks {
  id              uuid PK
  document_id     uuid FK -> documents
  chuong          text        // "Chương II"
  chuong_tieu_de  text
  muc             text
  dieu_so         integer     // 8
  dieu_tieu_de    text        // "Điều kiện cấp giấy phép"
  khoan_so        integer     // 3, null nếu chunk là cả Điều
  diem            text        // "a", null nếu không có
  duong_dan       text        // "Nghị định 15/2020 > Chương II > Điều 8 > Khoản 3"
  noi_dung        text        // text đầy đủ của chunk
  noi_dung_kem_ngu_canh text  // duong_dan + noi_dung, ĐÂY là thứ đem đi embed
  vi_tri_trang    integer
  so_token        integer
  embedding       vector(768)
  tsv             tsvector    // generated column, xem mục 6
  created_at      timestamptz
}

// truy_van — log mọi câu hỏi, nuôi dashboard
truy_van {
  id                uuid PK
  cau_hoi           text
  cau_tra_loi       text
  chunk_ids         uuid[]      // các chunk được retrieve
  diem_cao_nhat     real        // điểm của chunk top 1
  co_trich_dan      boolean     // LLM có trích được nguồn không
  latency_ms        integer
  che_do_tim        text        // 'vector' | 'hybrid'
  created_at        timestamptz
}

// cau_hoi_eval — bộ đánh giá tự soạn
cau_hoi_eval {
  id                uuid PK
  cau_hoi           text
  chunk_dung_ids    uuid[]      // đáp án: chunk nào MỚI đúng
  ghi_chu           text
}

// lan_chay_eval — kết quả từng lần đo
lan_chay_eval {
  id                uuid PK
  ten_lan_chay      text        // "baseline-vector-only"
  cau_hinh          jsonb       // {mode, topK, model, ...}
  recall_at_5       real
  mrr               real
  so_cau_hoi        integer
  created_at        timestamptz
}
```

Index bắt buộc:

```sql
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON chunks USING gin (tsv);
CREATE INDEX ON chunks (document_id);
CREATE INDEX ON chunks (dieu_so);
CREATE INDEX ON truy_van (created_at DESC);
```

---

## 4. Cấu trúc thư mục

```
src/
  app/
    (chat)/page.tsx           # giao diện hỏi đáp
    dashboard/page.tsx
    documents/page.tsx        # danh sách + upload
    documents/[id]/page.tsx   # xem văn bản, highlight chunk
    api/
      ingest/route.ts
      ask/route.ts
      documents/route.ts
  lib/
    parser/
      index.ts                # điều phối
      metadata.ts             # bóc số hiệu, ngày, cơ quan
      structure.ts            # tách Chương/Điều/Khoản/Điểm
      patterns.ts             # toàn bộ regex, tập trung một chỗ
      types.ts
    retrieval/
      vector.ts
      fulltext.ts
      hybrid.ts               # RRF
      index.ts
    embedding/
      provider.ts             # interface
      hosted.ts               # Phase 1
      local.ts                # Phase 7
    db/
      schema.ts
      client.ts
  components/
scripts/
  ingest.ts                   # CLI nạp hàng loạt
  eval.ts                     # CLI chạy eval
data/
  raw/                        # PDF gốc (gitignore)
  eval/cau-hoi.json           # bộ eval
```

---

## 5. Phase 0 — Khởi tạo

**Prompt cho Claude Code:**

```
Đọc PLAN.md. Thực hiện Phase 0.
Khởi tạo Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui.
Cài drizzle-orm, drizzle-kit, postgres, và các thư viện đọc PDF/DOCX.
Tạo cấu trúc thư mục đúng như mục 4 của PLAN.md, file rỗng có comment mô tả vai trò.
Tạo .env.example với các biến ở mục 12.
Chưa viết logic nghiệp vụ nào cả.
```

**Nghiệm thu:** `npm run dev` chạy được, mở localhost thấy trang trắng có tiêu đề. `npx drizzle-kit --version` chạy được.

---

## 6. Phase 1 — Schema và kết nối database

**Prompt:**

```
Đọc PLAN.md mục 3. Thực hiện Phase 1.
Viết src/lib/db/schema.ts bằng Drizzle theo đúng lược đồ ở mục 3.
Cột embedding dùng kiểu vector với số chiều lấy từ biến môi trường EMBEDDING_DIM (mặc định 768).
Cột tsv là generated column, dùng: to_tsvector('simple', unaccent(coalesce(noi_dung,'')))
Viết migration bật extension vector và unaccent trước khi tạo bảng.
Tạo toàn bộ index ở mục 3.
Viết script scripts/check-db.ts kiểm tra kết nối và in ra danh sách bảng.
```

**Lưu ý kỹ thuật quan trọng — nói rõ cho Claude Code:**

Postgres **không có** cấu hình full-text search cho tiếng Việt. Đừng dùng `to_tsvector('vietnamese', ...)`, sẽ lỗi. Dùng `'simple'` kết hợp extension `unaccent` để bỏ dấu, như vậy tìm "nghi dinh" vẫn ra "nghị định".

**Nghiệm thu:** `npx tsx scripts/check-db.ts` in ra đủ 5 bảng. Chạy được câu SQL `SELECT '[1,2,3]'::vector;` không lỗi.

---

## 7. Phase 2 — Parser văn bản hành chính (phần quan trọng nhất)

Đây là phần tạo nên giá trị của đồ án. Dành nhiều thời gian nhất ở đây.

**Prompt:**

```
Đọc PLAN.md mục 7. Thực hiện Phase 2.
Viết src/lib/parser/ theo đúng các mẫu regex ở dưới.
Đây là phần lõi, viết test trước bằng Vitest.
Tạo ít nhất 12 test case với đoạn văn bản mẫu đại diện cho từng tình huống ở mục 7.4.
Chưa động tới database hay embedding.
```

### 7.1 Mẫu nhận dạng cấu trúc

```typescript
// src/lib/parser/patterns.ts
export const P = {
  chuong:  /^\s*Chương\s+([IVXLCDM]+)\s*[.:-]?\s*(.*)$/im,
  muc:     /^\s*Mục\s+(\d+)\s*[.:-]?\s*(.*)$/im,
  dieu:    /^\s*Điều\s+(\d+)\s*[.:]?\s*(.*)$/im,
  khoan:   /^\s*(\d+)\s*[.)]\s+(.+)$/m,
  diem:    /^\s*([a-zđăâêôơưuý])\s*\)\s+(.+)$/im,

  soHieu:  /\b(\d{1,4})\/(\d{4})\/([A-ZĐ]+(?:-[A-ZĐ]+)*)\b/,
  ngay:    /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i,

  // tham chiếu chéo — bắt để làm tính năng nâng cao
  thamChieu: /(?:khoản\s+(\d+)\s+)?Điều\s+(\d+)(?:\s+(?:của\s+)?(Nghị định|Thông tư|Luật|Quyết định)\s+số\s*([\d/A-ZĐ-]+))?/gi,
};

export const LOAI_VAN_BAN = [
  'Nghị định', 'Thông tư', 'Thông tư liên tịch', 'Quyết định',
  'Nghị quyết', 'Luật', 'Pháp lệnh', 'Chỉ thị', 'Công văn', 'Kế hoạch',
];
```

### 7.2 Quy tắc chunking

- **Một Khoản = một chunk.** Đây là mặc định.
- Nếu Điều không có Khoản (chỉ có một đoạn văn), **cả Điều = một chunk**.
- Nếu một Khoản dài quá 800 token, cắt tiếp theo Điểm (a, b, c).
- Nếu một Điểm vẫn quá 800 token, mới cắt theo câu, và ghi cờ `bi_cat_cung = true` để sau này biết mà kiểm tra.
- **Không bao giờ để một chunk bắc cầu qua hai Điều khác nhau.** Đây là lỗi mà template có sẵn của các framework hay mắc.

### 7.3 Nhồi ngữ cảnh vào chunk trước khi embed

Đây là mẹo rẻ tiền nhưng hiệu quả cao. Trường `noi_dung_kem_ngu_canh` được tạo như sau:

```
[Nghị định 15/2020/NĐ-CP — Chương II — Điều 8: Điều kiện cấp giấy phép — Khoản 3]
<nội dung khoản 3>
```

Embed chuỗi này, không phải `noi_dung` trần. Lý do: chunk trần thường bắt đầu bằng "3. Trường hợp quy định tại điểm b..." — hoàn toàn vô nghĩa với embedding model nếu không có ngữ cảnh cha.

### 7.4 Các tình huống bắt buộc có test

1. Văn bản có đủ Chương → Mục → Điều → Khoản → Điểm
2. Văn bản chỉ có Điều, không có Chương
3. Điều không có Khoản (một đoạn liền)
4. Khoản có Điểm a, b, c
5. Số hiệu dạng `15/2020/NĐ-CP`
6. Số hiệu dạng `08/2023/TT-BTC`
7. Có bảng biểu chen giữa các Điều
8. Có phụ lục ở cuối (phải tách riêng, không trộn vào Điều)
9. Điều bị ngắt qua hai trang PDF
10. Chữ "Điều" xuất hiện giữa câu (ví dụ "theo Điều 5 nêu trên") — **không được** hiểu nhầm là tiêu đề Điều mới
11. Đánh số La Mã ở Chương (I, II, III, IV, V, X)
12. Văn bản sửa đổi bổ sung, có cụm "sửa đổi, bổ sung Điều 12"

Tình huống 10 là bẫy hay gặp nhất. Điều kiện phải là: khớp `P.dieu` **và** ở đầu dòng **và** dòng đó không nằm giữa một câu đang dở.

**Nghiệm thu:** `npm test` xanh toàn bộ 12 case. Chạy parser lên một PDF thật, in ra cây cấu trúc, mắt thường đối chiếu với file gốc thấy khớp.

---

## 8. Phase 3 — Pipeline nạp dữ liệu

**Prompt:**

```
Đọc PLAN.md mục 8. Thực hiện Phase 3.
Viết src/lib/embedding/provider.ts định nghĩa interface EmbeddingProvider
với phương thức embed(texts: string[]): Promise<number[][]>.
Viết hosted.ts hiện thực interface đó gọi API embedding (đọc từ env).
Viết scripts/ingest.ts: quét thư mục data/raw, với mỗi file thì
extract text → parse → chunk → embed theo lô 50 → ghi vào DB.
Có thanh tiến trình, có xử lý lỗi từng file (một file lỗi không làm dừng cả mẻ),
ghi trạng thái vào documents.trang_thai.
Nếu file PDF không có text layer, đánh dấu trang_thai='loi' với thông báo rõ ràng, bỏ qua.
```

**Nghiệm thu:** `npx tsx scripts/ingest.ts` nạp xong 50 file. `SELECT count(*) FROM chunks;` ra vài nghìn dòng. Kiểm tra ngẫu nhiên 5 chunk, thấy `duong_dan` đúng.

---

## 9. Phase 4 — Truy hồi: vector trước, hybrid sau

Làm hai bước riêng biệt. Có baseline mới có cái để so.

**Prompt bước 1:**

```
Đọc PLAN.md mục 9. Thực hiện Phase 4 bước 1.
Viết src/lib/retrieval/vector.ts: nhận câu hỏi, embed, tìm top K theo cosine distance.
Viết src/lib/retrieval/index.ts export hàm timKiem(cauHoi, {mode, topK}).
Mode hiện tại chỉ hỗ trợ 'vector'.
Viết scripts/thu-tim.ts để thử tay từ terminal.
```

**Prompt bước 2 (sau khi đã có eval ở Phase 5):**

```
Thực hiện Phase 4 bước 2.
Viết fulltext.ts dùng ts_rank trên cột tsv, nhớ unaccent câu hỏi trước khi truy vấn.
Viết hybrid.ts trộn kết quả hai bên bằng Reciprocal Rank Fusion với k=60:
  diem(chunk) = Σ 1/(60 + thu_hang_trong_tung_bang_xep)
Thêm mode 'hybrid' vào timKiem.
```

Công thức RRF:

```typescript
const K = 60;
const diem = new Map<string, number>();
for (const bangXep of [ketQuaVector, ketQuaFulltext]) {
  bangXep.forEach((chunk, i) => {
    diem.set(chunk.id, (diem.get(chunk.id) ?? 0) + 1 / (K + i + 1));
  });
}
```

**Nghiệm thu:** hỏi "Nghị định 15/2020/NĐ-CP quy định gì về điều kiện cấp phép" — chế độ vector thường trả nhầm sang nghị định khác cùng chủ đề, chế độ hybrid trả đúng. **Chụp màn hình cả hai, đây là bằng chứng đắt giá cho báo cáo.**

---

## 10. Phase 5 — Bộ đánh giá (làm TRƯỚC giao diện)

Đây là thứ tách đồ án của bạn khỏi mọi tutorial. Đừng để tới cuối mới làm.

### 10.1 Soạn bộ câu hỏi

Tự tay soạn 30–50 câu, lưu ở `data/eval/cau-hoi.json`:

```json
[
  {
    "cau_hoi": "Điều kiện để được cấp giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm là gì?",
    "van_ban": "15/2020/NĐ-CP",
    "dieu": 8,
    "khoan": null,
    "ghi_chu": "câu hỏi ngữ nghĩa thông thường"
  },
  {
    "cau_hoi": "Nghị định 15/2020/NĐ-CP có hiệu lực từ khi nào?",
    "van_ban": "15/2020/NĐ-CP",
    "dieu": 42,
    "ghi_chu": "câu hỏi khớp số hiệu chính xác — vector search sẽ trượt"
  }
]
```

Trộn đủ 4 loại: câu hỏi ngữ nghĩa thuần, câu hỏi có số hiệu chính xác, câu hỏi cần ghép nhiều Khoản, câu hỏi mà kho **không có** đáp án (để kiểm tra hệ thống có biết nói "không tìm thấy" không).

### 10.2 Chỉ số

- **Recall@5** — tỉ lệ câu hỏi mà chunk đúng nằm trong top 5.
- **MRR** — trung bình của 1/thứ_hạng_chunk_đúng_đầu_tiên.

**Prompt:**

```
Đọc PLAN.md mục 10. Thực hiện Phase 5.
Viết scripts/eval.ts: đọc data/eval/cau-hoi.json, ánh xạ (van_ban, dieu, khoan)
sang chunk id thật trong DB, chạy timKiem với cấu hình truyền vào,
tính Recall@5 và MRR, in bảng kết quả ra terminal
và ghi một dòng vào bảng lan_chay_eval.
Hỗ trợ cờ --mode=vector|hybrid --topK=N --ten="tên lần chạy".
```

**Nghiệm thu:** chạy được hai lệnh và có hai con số khác nhau để so:

```bash
npx tsx scripts/eval.ts --mode=vector --ten="baseline"
npx tsx scripts/eval.ts --mode=hybrid --ten="hybrid-rrf"
```

Ghi lại vào bảng này, mang thẳng vào báo cáo:

| Lần chạy | Recall@5 | MRR | Ghi chú |
|---|---|---|---|
| baseline-vector | | | |
| hybrid-rrf | | | |
| hybrid + model tiếng Việt | | | Phase 7 |

---

## 11. Phase 6 — Giao diện hỏi đáp có trích dẫn

**Prompt:**

```
Đọc PLAN.md mục 11. Thực hiện Phase 6.
Viết api/ask/route.ts: nhận câu hỏi, gọi timKiem mode hybrid topK=8,
dựng prompt cho LLM theo mẫu ở dưới, gọi LLM, ghi log vào bảng truy_van.
Viết giao diện chat ở app/(chat)/page.tsx.
Mỗi trích dẫn hiển thị dạng chip bấm được, dẫn sang /documents/[id] và
cuộn tới đúng chunk, highlight nền vàng nhạt.
Nếu điểm cao nhất dưới ngưỡng, hiển thị "Không tìm thấy căn cứ trong kho văn bản"
thay vì để LLM bịa.
```

Mẫu prompt gửi LLM:

```
Bạn là trợ lý tra cứu văn bản hành chính. Chỉ trả lời dựa trên các trích đoạn dưới đây.

QUY TẮC:
- Mỗi ý phải kèm trích dẫn dạng [1], [2] tương ứng số thứ tự trích đoạn.
- Nếu các trích đoạn không đủ căn cứ, trả lời đúng câu: "Không tìm thấy căn cứ trong kho văn bản."
- Không suy diễn, không bổ sung kiến thức ngoài trích đoạn.

TRÍCH ĐOẠN:
[1] {duong_dan}
{noi_dung}

[2] ...

CÂU HỎI: {cau_hoi}
```

**Nghiệm thu:** hỏi 5 câu, cả 5 đều có trích dẫn bấm được và nhảy đúng chỗ. Hỏi một câu ngoài phạm vi kho, hệ thống nói không tìm thấy chứ không bịa.

---

## 12. Phase 7 — Model embedding tiếng Việt (tính năng chiều sâu)

**Prompt:**

```
Đọc PLAN.md mục 12. Thực hiện Phase 7.
Tạo thư mục embedding-service/: một app FastAPI nhỏ,
load model từ biến môi trường MODEL_NAME (mặc định bkai-foundation-models/vietnamese-bi-encoder),
tách từ bằng pyvi trước khi encode,
expose POST /embed nhận {texts: string[]} trả {embeddings: number[][]}.
Kèm Dockerfile và requirements.txt.
Viết src/lib/embedding/local.ts hiện thực EmbeddingProvider gọi service này.
Chọn provider qua biến EMBEDDING_PROVIDER=hosted|local.
```

**Bẫy chết người:** các model dòng PhoBERT **bắt buộc phải tách từ** trước khi encode. Bỏ qua bước `pyvi` thì chất lượng tụt thấy rõ mà không hiểu vì sao.

```python
from pyvi import ViTokenizer
text_da_tach = ViTokenizer.tokenize(text)
```

Sau khi đổi model, phải **embed lại toàn bộ chunk** (số chiều có thể khác). Cập nhật `EMBEDDING_DIM` rồi chạy lại `ingest.ts --reembed`.

**Nghiệm thu:** chạy lại eval với provider mới, điền dòng thứ ba vào bảng ở mục 10.2. Dù kết quả tốt hơn hay tệ hơn, **vẫn ghi vào báo cáo** — một thí nghiệm cho kết quả âm vẫn là một thí nghiệm, và mentor đánh giá cao chuyện đó hơn là giấu đi.

---

## 13. Phase 8 — Dashboard

Chia hai khu, đừng trộn.

**Khu A — Kho văn bản** (đọc từ `documents` + `chunks`):
- Tổng số văn bản, tổng số chunk, số văn bản lỗi
- Biểu đồ cột: số văn bản theo loại (Nghị định, Thông tư, Quyết định...)
- Biểu đồ cột: số văn bản theo cơ quan ban hành
- Biểu đồ đường: số văn bản theo năm ban hành
- Bảng: văn bản có nhiều Điều nhất

**Khu B — Chất lượng hệ thống** (đọc từ `truy_van` + `lan_chay_eval`) — khu này mới là thứ gây ấn tượng:
- Tổng số câu hỏi đã nhận, latency trung vị
- Tỉ lệ câu trả lời có trích dẫn
- **Danh sách câu hỏi có điểm truy hồi thấp nhất** — đây chính là bản đồ lỗ hổng của kho dữ liệu, và là thứ bạn nói được thành câu trong buổi bảo vệ
- Biểu đồ so sánh Recall@5 và MRR qua các lần chạy eval

**Prompt:**

```
Đọc PLAN.md mục 13. Thực hiện Phase 8.
Viết app/dashboard/page.tsx là server component, truy vấn aggregate trực tiếp bằng Drizzle.
Dùng Recharts. Hai khu tách biệt có tiêu đề rõ ràng.
Không tạo API route riêng cho dashboard, query thẳng trong server component.
```

**Nghiệm thu:** dashboard tải dưới 2 giây với 50 văn bản. Mọi con số đối chiếu được bằng SQL thủ công.

---

## 14. Phase 9 — Deploy và bàn giao

```
Deploy Next.js lên Vercel, database dùng Neon.
Nếu có embedding-service thì deploy riêng (Render/Fly.io free tier),
hoặc để chế độ hosted khi demo và ghi rõ trong README.

README phải có:
- Ảnh chụp kiến trúc
- Hướng dẫn chạy local từ đầu (clone → env → migrate → ingest → dev)
- Bảng kết quả eval qua các lần chạy
- Mục "Hạn chế đã biết" liệt kê đúng phần Ngoài phạm vi ở mục 1
- Mục "Hướng phát triển"
```

---

## 15. Biến môi trường

```bash
DATABASE_URL=postgresql://...
EMBEDDING_PROVIDER=hosted          # hosted | local
EMBEDDING_API_KEY=
EMBEDDING_MODEL=
EMBEDDING_DIM=768
LOCAL_EMBEDDING_URL=http://localhost:8000
LLM_API_KEY=
LLM_MODEL=
NGUONG_DIEM_TOI_THIEU=0.35         # dưới ngưỡng thì trả lời "không tìm thấy"
```

---

## 16. Lịch 14 ngày

| Ngày | Phase | Sản phẩm đầu ra |
|---|---|---|
| 1 | 0, 1 | Dự án chạy, DB có bảng |
| 2–4 | 2 | Parser + 12 test xanh |
| 5 | 3 | 50 văn bản đã nạp vào DB |
| 6 | 4 bước 1 | Vector search chạy |
| 7 | 5 | Có con số baseline |
| 8 | 4 bước 2 | Hybrid + con số thứ hai |
| 9–10 | 6 | Giao diện hỏi đáp có trích dẫn |
| 11 | 7 | Model tiếng Việt + con số thứ ba |
| 12 | 8 | Dashboard |
| 13 | 9 | Deploy |
| 14 | — | README, tập demo, dự phòng |

Ngày 14 để trống là cố ý. Sẽ có thứ vỡ.

---

## 17. Nguyên tắc cho Claude Code

Nhắc lại ở đầu mỗi phiên:

1. Chỉ làm đúng Phase được giao. Không làm trước Phase sau.
2. Không thêm thư viện ngoài danh sách ở mục 2 nếu chưa hỏi.
3. Không tự ý mở rộng sang các mục ở phần "Ngoài phạm vi".
4. Viết code có kiểu rõ ràng, không dùng `any`.
5. Toàn bộ chuỗi hiển thị cho người dùng bằng tiếng Việt; tên biến và hàm có thể tiếng Việt không dấu hoặc tiếng Anh, nhưng nhất quán.
6. Sau mỗi Phase, in ra tóm tắt những file đã tạo/sửa và cách kiểm chứng.

---

## 18. Chuẩn bị bảo vệ

Những câu gần như chắc chắn bị hỏi — chuẩn bị sẵn:

- Vì sao chunk theo Điều/Khoản mà không cắt theo độ dài? *(có ví dụ chunk bị cắt sai để đối chiếu)*
- Hybrid search giải quyết vấn đề gì mà vector search không làm được? *(có ảnh chụp hai kết quả)*
- Recall@5 tăng bao nhiêu, nhờ thay đổi nào? *(có bảng)*
- Vì sao chọn Postgres/pgvector mà không dùng vector database chuyên dụng?
- Hệ thống sai ở đâu, và bạn biết được điều đó bằng cách nào? *(chỉ vào Khu B của dashboard)*
- Nếu cho thêm một tháng, bạn làm gì tiếp?

Câu cuối cùng luôn được hỏi. Trả lời cụ thể — OCR cho file scan, reranker cross-encoder, xử lý quan hệ sửa đổi/hết hiệu lực giữa các văn bản — chứ đừng nói "em sẽ cải thiện thêm".
