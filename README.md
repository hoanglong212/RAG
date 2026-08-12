# RAG văn bản pháp luật Việt Nam

Hệ thống RAG cho văn bản pháp luật, dùng parser cấu trúc Điều/Khoản/Điểm, PostgreSQL + pgvector và embedding tiếng Việt self-host.

Hướng dẫn dựng và vận hành local stack nằm tại [`docs/LOCAL-STACK.md`](docs/LOCAL-STACK.md).

## Chạy local

Sao chép `.env.example` thành `.env.local`, khởi động PostgreSQL và embedding service theo hướng dẫn, sau đó:

```bash
npm run db:migrate
npm run db:check
npm run data:collect -- --query "thực phẩm" --limit 50 --require-structural
npm run ingest
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Kiểm tra

```bash
npm test
npm run typecheck
npm run lint
npm run build
```
