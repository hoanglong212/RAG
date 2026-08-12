# Backend tin tức đa chủ đề và đối chiếu pháp luật

## Phạm vi hiện tại

- RSS chính thức: Tuổi Trẻ, Thanh Niên, VnExpress.
- 17 nhãn chủ đề, từ pháp luật, kinh tế, lao động và đất đai đến công nghệ, môi trường, giáo dục, thể thao.
- Chỉ lưu metadata RSS và URL nguồn; không lấy toàn văn bài báo.
- Corpus pháp luật hiện mới được xác nhận cho `an_toan_thuc_pham`. Các chủ đề khác trả `insufficient_corpus` cho tới khi được nạp và kiểm định.
- Bảy rule an toàn thực phẩm phổ biến ghim đúng văn bản/Điều/Khoản trước khi dùng RAG. Tình huống chưa có rule dùng hybrid retrieval và luôn kèm cảnh báo không phải kết luận pháp lý.

## Vận hành

```bash
npm run db:migrate
npm run news:sync
```

Trên production, cấu hình `NEWS_SYNC_TOKEN` và gọi `POST /api/news/sync` với header `Authorization: Bearer <token>`. Biến `LEGAL_CORPUS_TOPICS` là danh sách lĩnh vực đã thực sự có corpus, phân cách bằng dấu phẩy.

## API

- `GET /api/news?page&pageSize&topic&source&q&from&to`: danh sách và bộ lọc.
- `GET /api/news/[id]`: metadata một bài.
- `GET /api/news/sources`: trạng thái nguồn và danh mục chủ đề.
- `POST /api/news/sync`: đồng bộ nguồn RSS, được bảo vệ trên production.
- `POST /api/legal-check` với `{ "scenario": "...", "topic": "..." }`: đối chiếu tình huống.
- `POST /api/news/[id]/legal-check`: đối chiếu tiêu đề và tóm tắt của một bài.

`status` của legal check:

- `matched`: có nguồn và phần giải thích grounded.
- `evidence_only`: có nguồn nhưng LLM không khả dụng.
- `no_match`: corpus thuộc đúng lĩnh vực nhưng không có đoạn đủ điểm.
- `insufficient_corpus`: lĩnh vực chưa được nạp/kiểm định; hệ thống từ chối suy đoán.
