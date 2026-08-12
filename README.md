# Nền tảng tin tức và tra cứu pháp luật Việt Nam

Backend tổng hợp metadata RSS đa chủ đề và đối chiếu tình huống với văn bản pháp luật. Phần pháp lý dùng parser cấu trúc Điều/Khoản/Điểm, rule engine, PostgreSQL + pgvector và embedding tiếng Việt self-host.

Hướng dẫn dựng và vận hành local stack nằm tại [`docs/LOCAL-STACK.md`](docs/LOCAL-STACK.md).

## Chạy local

Sao chép `.env.example` thành `.env.local`, khởi động PostgreSQL và embedding service theo hướng dẫn, sau đó:

```bash
npm run db:migrate
npm run db:check
npm run data:collect -- --query "thực phẩm" --limit 50 --require-structural
npm run ingest
npm run news:sync
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Backend tin tức chỉ lưu tiêu đề, tóm tắt, ảnh đại diện và URL bài gốc từ RSS chính thức; không sao chép toàn văn bài báo. Xem [tài liệu API backend](docs/NEWS-LEGAL-BACKEND.md).

## Kiểm tra

```bash
npm test
npm run typecheck
npm run lint
npm run build
```
