# KE-HOACH-D7.md — 8 ngày còn lại

Đặt tại `docs/KE-HOACH-D7.md`. Thay thế phần lịch trong các kế hoạch trước. Nội dung kỹ thuật vẫn lấy từ `PLAN.md` trong repo.

---

## 1. Trạng thái thật

| | Xong | Đang vướng |
|---|---|---|
| Track A | Phase 0, 1, 2 (code) | 296 chunks fixed chưa giải thích; pyvi chưa xác minh; Phase 3 chưa bắt đầu |
| Track B | Token, 3 typeface, component nền, 3 trang, trục văn bản chạy trên mock | Chưa chụp màn hình; responsive dưới 1280 mới là ẩn cột; chưa đo tương phản |
| Bạn | 50 văn bản, Postgres, embedding service | 40 câu hỏi vàng; pane Browser; trường `nguong` |

**Đã đi trước kế hoạch:** embedding tiếng Việt self-host (vốn là Phase 4), và toàn bộ nền track UI gọn trong một phiên.

**Đã đi sau:** Phase 3 chưa động, và bộ câu hỏi vàng chặn ba lượt liền.

---

## 2. Đường găng

Bốn thứ này xếp chuỗi, mỗi cái chặn cái sau. Mọi việc khác chạy song song được.

```
40 câu hỏi vàng (bạn)
   └→ eval runner chạy được (A)
        └→ bảng số so sánh (A)
             └→ trang /eval + slide bảo vệ (B, bạn)

hybrid.ts (A)
   └→ /api/chat SSE (A)
        └→ tích hợp trang tra cứu (B)
             └→ chế độ tra vi phạm (A + B)
```

Suy ra hai điều:

**`/api/chat` là điểm bàn giao quan trọng nhất.** Làm sớm hơn kế hoạch cũ. Track B đang chạy mock, mỗi ngày chậm là một ngày rủi ro dồn về cuối.

**Không có ngày gộp lớn.** `/api/documents` đã xong từ Phase 2, nên trang kho văn bản và trang xem văn bản tích hợp được **ngay hôm nay**. Gộp từng phần, đừng dồn vào một ngày.

---

## 3. Track A — Codex

### D7: gỡ hai chốt trước Phase 3

Không sang Phase 3 khi chưa xong.

**Chốt 1 — độ phủ chunk fixed.**
```sql
SELECT strategy, count(*) AS n_chunks,
       count(DISTINCT document_id) AS n_docs,
       sum(token_count) AS total_tokens
FROM chunks GROUP BY strategy;
```
Hai chiến lược chạy trên cùng corpus nên `total_tokens` phải xấp xỉ nhau, và `fixed` phải nhỉnh hơn vì có chồng lấn 64 token. Nếu `n_docs` của `fixed` dưới 50 thì chạy lại cho phủ đủ.

**Chốt 2 — pyvi.** Mở service embedding, tìm `pyvi.ViTokenizer.tokenize()`. BKAI dựng trên PhoBERT nên bắt buộc phải tách từ trước khi encode. Thiếu thì thêm và **embed lại toàn bộ** — vector cũ và mới không so sánh được với nhau.

Nghiệm thu: hai con số `total_tokens` chênh nhau dưới 20%; xác nhận có tokenize.

### D8: retrieval đầy đủ

Viết `hybrid.ts` trọn gói ngay, không tách hai lần như kế hoạch cũ. Nhánh vector, nhánh full-text, trộn bằng RRF hằng số 60. Tham số `mode` chọn chế độ lúc chạy — contract đã có sẵn `'vector' | 'hybrid' | 'hybrid_rerank'`.

Vẫn đo tách bạch được: chạy eval với `mode='vector'` cho ra baseline, không cần viết hai bản code.

Kèm `/api/search` theo contract.

Nghiệm thu: hỏi "Nghị định 115/2018/NĐ-CP quy định mức phạt tối đa bao nhiêu" ở hai mode, in ra top-5 của từng bên. Mode `vector` phải trả về sai số hiệu, mode `hybrid` phải trả đúng. Đây là ví dụ bạn sẽ demo trực tiếp.

### D9: `/api/chat` + `/api/stats` — ngày bàn giao

SSE đúng giao thức mục 2.1 CONTRACT: `citations` trước, rồi `token`, rồi `done`. Thứ tự này track B đã dựng giao diện theo, không được đổi.

System prompt bắt buộc: chỉ trả lời dựa trên ngữ cảnh được cấp; không tìm thấy thì trả `status: 'khong_tim_thay'`, không bịa; mọi khẳng định kèm citation.

Thêm trường `nguong` vào response (xem mục 6).

`/api/stats` làm luôn trong ngày này — track B cần nó cho dashboard.

**Báo cho track B ngay khi xong.** Đây là chốt chặn duy nhất của bên kia.

### D10: eval

Cần 40 câu hỏi vàng đã có. Viết runner, chạy đủ ma trận mục 5, ghi vào `lan_chay_eval`.

Nghiệm thu: đủ số dòng, và giải thích được từng bước tăng đến từ đâu.

### D11: dẫn chiếu chéo + tra vi phạm

**Dẫn chiếu chéo** — parser đã có regex `thamChieu`. Chỉ cần bảng lưu và một endpoint:
```sql
CREATE TABLE cross_refs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id uuid REFERENCES doc_nodes(id) ON DELETE CASCADE,
  to_so_hieu   text,
  to_dieu      text,
  to_khoan     text,
  to_node_id   uuid REFERENCES doc_nodes(id),  -- null nếu trỏ ra ngoài corpus
  raw_text     text
);
```
`to_node_id` null có nghĩa: văn bản được dẫn chiếu không nằm trong corpus. Đó là dữ liệu hữu ích, hiện lên dashboard được.

**Tra vi phạm** — retrieval hai bước. Bước 1 tìm quy định bị vi phạm trong các nghị định quy định. Bước 2 tìm chế tài tương ứng trong 115/2018. Endpoint `/api/compliance`, response mở rộng từ `ChatResponse` thêm mảng `cheTai: Citation[]`.

Điều kiện: 115/2018 và 124/2021 phải có trong corpus. Kiểm tra trước.

### D12–13: hỗ trợ deploy, seed script, dự phòng

### D14: đóng băng code

---

## 4. Track B — Claude Code

### D7: responsive trước, mọi thứ khác sau

Đây là việc gấp nhất của track B, gấp hơn dashboard.

Máy chiếu phòng họp thường 1280×720. Laptop mentor phổ biến 1366×768. Ở những độ phân giải đó, "ẩn cột" nghĩa là **trục văn bản biến mất đúng lúc cần nhất** — yếu tố chữ ký của cả dự án không xuất hiện trong buổi bảo vệ.

Không cần bottom sheet cầu kỳ. Cần trục thu thành dải hẹp vẫn thấy được vị trí, hoặc tấm trượt gọi ra bằng nút. Miễn là không biến mất.

Cùng ngày: mở pane Browser, chụp đủ bốn trạng thái, đo tương phản WCAG. `--nhan` #6B7280 trên nền #FBFBFA nằm sát ngưỡng AA cho chữ nhỏ — đo trước khi có thêm 30 component, vì đổi màu nhãn sau đó phải rà lại từng cái.

### D8: tích hợp phần đã sẵn sàng

`/api/documents` và `/api/documents/[id]` đã xong từ Phase 2. Chuyển trang kho văn bản và trang xem văn bản sang API thật ngay.

Giữ nguyên mock cho trang tra cứu, chưa đụng.

Đây là lúc lộ ra mọi chỗ lệch giữa contract và thực tế, khi còn rẻ để sửa.

### D9: dashboard khu A

Năm biểu đồ bộ tài liệu. Dùng `/api/stats` nếu Codex đã bàn giao, không thì mock.

### D10: tích hợp trang tra cứu

Bỏ mock, nối SSE thật. Trục văn bản phải phản ứng đúng như trên mock: citations về trước, trục cuộn và đóng dấu, chữ chảy sau.

Kiểm tra kỹ hai trạng thái ít gặp: `khong_tim_thay` và `loi`. Đây là chỗ hay vỡ khi chuyển từ mock sang thật.

### D11: giao diện tra vi phạm

Không phải trang mới — là một chế độ của trang tra cứu. Ô nhập cho mô tả tình huống thay vì câu hỏi. Kết quả chia hai khối: **quy định liên quan** và **chế tài**.

Chữ nghĩa ở đây phải cẩn thận. Hệ thống **trình bày quy định, không phán quyết**. Không viết "bạn sẽ bị phạt 15 triệu". Viết "hành vi này liên quan tới Điều X; mức phạt quy định tại Điều Y là...". Kèm một dòng nói rõ đây là công cụ tra cứu, không thay thế tư vấn pháp lý.

Chi tiết này mentor sẽ để ý — nó cho thấy bạn hiểu hệ quả thật của sản phẩm.

### D12: trang `/eval` + vòng phê bình thiết kế

Bảng lịch sử các lần chạy, biểu đồ Recall@5. Đây là trang bạn mở khi mentor hỏi "có gì chứng minh không".

Chạy `/design-review` trên toàn bộ giao diện. Cần pane Browser mở.

Kiểm tra riêng phần tiếng Việt: dấu chồng có bị cắt không, `Bộ Nông nghiệp và Phát triển nông thôn` có tràn không, `trichYeu` dài có vỡ thẻ không.

### D13: đánh bóng, hỗ trợ deploy

### D14: dự phòng

---

## 5. Ma trận eval — dựng lại

Ma trận cũ giả định dùng API hosted trước, đổi sang model tiếng Việt ở bước cuối. Giờ chỉ có BKAI self-host, nên phải sắp lại.

Sắp lại thế này **tốt hơn bản cũ**: mỗi bước đổi đúng một biến, nên quy được nguyên nhân rõ ràng.

| # | Chunking | Retrieval | Embedder | Cô lập điều gì |
|---|---|---|---|---|
| E1 | fixed 512 | vector | BKAI | — (đường cơ sở) |
| E2 | structural | vector | BKAI | **tác dụng của chunking theo cấu trúc** |
| E3 | structural | hybrid | BKAI | **tác dụng của full-text + RRF** |
| E4 | structural | hybrid + rerank | BKAI | tác dụng của rerank (tuỳ chọn) |

E1→E2 là luận điểm chính của dự án. E2→E3 là chỗ nhóm 10 câu hỏi có số hiệu sẽ nhảy vọt.

**Nếu còn thời gian:** chạy thêm E3 với một API embedding hosted, thành bảng so sánh embedder. Nhưng đây là phần thêm, không phải phần bắt buộc — bốn dòng trên đã đủ kể câu chuyện.

---

## 6. Sửa contract — làm hôm nay

Một trường, năm phút, gỡ chỗ ghim cứng 0,35 trong giao diện.

```ts
export interface ChatResponse {
  status: ChatStatus;
  answer: string | null;
  citations: Citation[];
  topScore: number;
  nguong: number;        // ← thêm
  latencyMs: number;
}
```

Ghi vào nhật ký cuối `CONTRACT.md`:

| Ngày | Đổi gì | Lý do | Ai yêu cầu |
|---|---|---|---|
| D7 | Thêm `nguong: number` vào `ChatResponse` | Giao diện cần hiện "đoạn gần nhất 0,31 — ngưỡng 0,35" mà không ghim cứng | Track B |

Báo cả hai track sau khi sửa.

---

## 7. Rủi ro deploy — bắt đầu từ D11, không phải D13

Postgres ở `127.0.0.1:5433`, embedding service ở `127.0.0.1:8000`. App trên Vercel không gọi được cả hai.

Vấn đề khó nằm ở embedding service: **câu hỏi của người dùng phải được embed bằng đúng model đã embed tài liệu.** Dùng API hosted cho query trong khi tài liệu embed bằng BKAI là hỏng hoàn toàn — hai không gian vector khác nhau.

Ba đường:

| | Cách làm | Rủi ro |
|---|---|---|
| A | Đẩy service BKAI lên Railway/Fly.io, dump Postgres sang Neon | Container `sentence-transformers` + PhoBERT tốn RAM, free tier có thể chật |
| B | Demo trên máy, không deploy | Mất điểm, và phụ thuộc máy bạn chạy đúng lúc bảo vệ |
| C | Chuẩn bị cả hai: thử A, giữ B làm dự phòng | Tốn thêm nửa ngày |

Chọn C. Và thử A **từ D11**, không phải D13 — nếu container không lên được, bạn cần biết sớm để còn xoay.

Kể cả không deploy được, vẫn nên **quay một video demo 2–3 phút** phòng khi máy trục trặc lúc trình bày.

---

## 8. Cắt theo thứ tự này nếu thiếu thời gian

1. E4 (rerank)
2. Đồ thị dẫn chiếu chéo dạng hình — giữ dữ liệu, chỉ hiện danh sách
3. Năm biểu đồ khu B của dashboard
4. Deploy (chuyển sang demo máy + video)
5. Hoạt ảnh trục văn bản (giữ chức năng, bỏ chuyển động)

**Không bao giờ cắt:** 40 câu hỏi vàng, bảng eval, trích dẫn bấm được, và trục văn bản ở độ phân giải 1280.

---

## 9. Việc của bạn

| Khi nào | Việc | Vì sao gấp |
|---|---|---|
| Hôm nay | Mở pane Browser | Chặn `/design-review` và mọi ảnh chụp |
| Hôm nay | Thêm `nguong` vào contract | 5 phút, gỡ chỗ ghim cứng |
| Hôm nay | Kiểm tra 115/2018 và 124/2021 có trong corpus | Điều kiện cần của chế độ tra vi phạm |
| **D7–D8** | **40 câu hỏi vàng** | **Chặn toàn bộ Phase 3. Không giao được cho agent nào** |
| D11 | Thử deploy embedding service | Biết sớm nếu không lên được |
| D13 | README, ảnh chụp trên dữ liệu thật | Không dùng ảnh chụp mock — nội dung điều khoản trong mock là bịa |
| D14 | Tập demo, quay video dự phòng | |

### Về 40 câu hỏi vàng

Chia: 15 câu hỏi trực tiếp dùng từ trong văn bản, 15 câu diễn đạt lại không trùng từ, 10 câu nhắc số hiệu cụ thể.

Nhóm thứ ba chứng minh hybrid search cần thiết. Nếu chia đúng tỷ lệ, bạn sẽ thấy mode `vector` làm rất tệ ở nhóm này còn `hybrid` xử lý được — đó là biểu đồ đẹp nhất trong báo cáo.

Tự viết, không nhờ agent. Lúc bảo vệ mentor sẽ hỏi một câu bất kỳ rồi bảo giải thích tại sao hệ thống trả về đúng chỗ đó.

---

## 10. Checklist bảo vệ

- [ ] Nói được luận điểm trong 15 giây không nhìn giấy
- [ ] Mở `/eval` chiếu bảng E1→E4
- [ ] Demo câu hỏi có số hiệu, giải thích vì sao `vector` sai còn `hybrid` đúng
- [ ] Demo chế độ tra vi phạm với một tình huống thật
- [ ] Mở đúng một file — `structure.ts` — giải thích được từng đoạn
- [ ] Trả lời "tại sao không dùng RAGFlow": template Laws không khớp cấu trúc Chương/Điều/Khoản Việt Nam
- [ ] Trả lời "tại sao Postgres không phải Pinecone": cần join vector search với metadata quan hệ cho dashboard
- [ ] Trả lời "quy trình làm việc thế nào": hai agent, ranh giới rõ, contract đóng băng từ ngày đầu, bạn duyệt từng phase
- [ ] Nêu được 3 hạn chế mà không cần ai gợi ý
- [ ] Lịch sử commit trải đều
- [ ] Video demo dự phòng
