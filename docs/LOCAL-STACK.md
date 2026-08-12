# Local stack: PostgreSQL, pgvector và embedding tiếng Việt

Tài liệu này ghi lại cấu hình đã được chạy và kiểm chứng trên Windows ngày 2026-08-12.

## Dịch vụ hiện tại

| Dịch vụ | Địa chỉ | Dữ liệu/runtime |
|---|---|---|
| PostgreSQL 18 | `127.0.0.1:5433` | `C:\Users\Admin\AppData\Local\RAG\Postgres18\data` |
| pgvector | `0.8.5` | extension cục bộ trong `...\Postgres18\extensions` |
| Embedding | `http://127.0.0.1:8000` | venv trong `C:\Users\Admin\AppData\Local\RAG\embedding\venv` |
| Model | `bkai-foundation-models/vietnamese-bi-encoder` | cache Hugging Face của người dùng |

PostgreSQL chỉ lắng nghe loopback. Cluster dev dùng trust authentication và không được mở ra mạng ngoài.

## Khởi động lại PostgreSQL

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' `
  -D 'C:\Users\Admin\AppData\Local\RAG\Postgres18\data' `
  -l 'C:\Users\Admin\AppData\Local\RAG\Postgres18\postgres.log' `
  -o '-h 127.0.0.1 -p 5433 -c extension_control_path=C:/Users/Admin/AppData/Local/RAG/Postgres18/extensions/share' `
  start
```

Kiểm tra và chạy migration:

```powershell
npm run db:migrate
npm run db:check
```

Dừng cluster:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' `
  -D 'C:\Users\Admin\AppData\Local\RAG\Postgres18\data' stop
```

## Khởi động embedding service

```powershell
Start-Process `
  -FilePath 'C:\Users\Admin\AppData\Local\RAG\embedding\venv\Scripts\python.exe' `
  -ArgumentList '-m','uvicorn','app:app','--host','127.0.0.1','--port','8000' `
  -WorkingDirectory 'C:\thuc tap\RAG\embedding-service' `
  -WindowStyle Hidden
```

Lần đầu model được tải từ Hugging Face. Kiểm tra service và số chiều:

```powershell
curl.exe http://127.0.0.1:8000/health
```

Kết quả đúng phải có `status=ok` và `dimensions=768`. Service chuẩn hóa NFC, tách từ bằng `pyvi`, rồi trả vector đã normalize.

## Bộ dữ liệu an toàn thực phẩm

Thu thập lại 50 trang toàn văn từ Cổng Thông tin điện tử Chính phủ:

```powershell
npm run data:collect -- --limit 50
```

File thô nằm trong `data/raw` và không commit. `data/manifest-food-safety.json` được commit, chứa URL nguồn, thời điểm thu thập, kích thước và SHA-256 của từng file.

Nạp lại từ đầu:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' `
  -h 127.0.0.1 -p 5433 -U rag_admin -d rag_van_ban `
  -c 'TRUNCATE documents CASCADE;'
npm run ingest
```

Mỗi tài liệu được parse một lần thành `doc_nodes`. Pipeline đồng thời sinh:

- `structural`: theo Điều/Khoản/Điểm, tối đa 800 token, bắt buộc có `node_id`;
- `fixed`: baseline liên tục 512 token, luôn để `node_id = null`.

Văn bản dạng công văn không có Điều vẫn được giữ cảnh báo parser và nạp bằng fixed chunks; hệ thống không dựng node giả.

## SQL nghiệm thu Phase 2

```sql
SELECT ingest_status, count(*) FROM documents GROUP BY 1;
SELECT strategy, count(*), min(so_token), max(so_token), count(node_id)
FROM chunks GROUP BY 1 ORDER BY 1;
SELECT count(*) FROM doc_nodes;
SELECT min(vector_dims(embedding)), max(vector_dims(embedding)) FROM chunks;
```

Snapshot đã kiểm chứng ngày 2026-08-12:

- `documents`: 50 `hoan_tat`;
- `chunks`: 296 fixed và 1.427 structural;
- `doc_nodes`: 2.958;
- vector: tất cả 768 chiều;
- ràng buộc node: 0 structural thiếu node, 0 fixed có node.
