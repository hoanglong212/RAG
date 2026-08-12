# AGENTS.md — Track A (lõi xử lý)

## Bạn phụ trách gì

Toàn bộ phần lõi: parser, pipeline nạp dữ liệu, retrieval, eval, API routes.

Bạn **không** phụ trách giao diện. Có một agent khác đang làm track UI trong worktree riêng. Không sửa file trong `src/app/(ui)/`, `src/components/`, `src/styles/`, `public/`.

## Đọc trước khi bắt đầu

1. `PLAN.md` — đặc tả kỹ thuật đầy đủ
2. `docs/CONTRACT.md` — hợp đồng giữa hai track
3. `KE-HOACH-V2-CODEX-CLAUDE.md` mục 2 — ranh giới phân công

## Thư mục bạn sở hữu

```
src/lib/**          parser, ingest, retrieval, eval
src/db/**           schema, migrations
src/app/api/**      API routes
src/types/**        kiểu dữ liệu (xem quy tắc contract bên dưới)
eval/**             bộ câu hỏi vàng, kết quả
scripts/**          CLI nạp dữ liệu
```

## Quy tắc bắt buộc

**Một phase mỗi phiên.** Kế hoạch chia phase trong `PLAN.md`. Làm đúng phase được giao, đạt tiêu chí nghiệm thu thì dừng và báo cáo. Không viết trước code phase sau.

**Không sửa contract một mình.** `docs/CONTRACT.md` và `src/types/contract.ts` là hợp đồng với track UI. Cần đổi thì dừng lại, nêu rõ đổi gì và tại sao, chờ người dùng xác nhận. Tự sửa sẽ làm hỏng track kia mà không ai biết cho tới ngày gộp.

**Không tự thêm dependency.** Stack chốt trong kế hoạch gốc. Cần thêm package thì hỏi trước, nêu lý do. Tuyệt đối không cài LangChain, LlamaIndex, hay framework RAG nào — toàn bộ logic RAG viết tay, đó là chủ ý của dự án.

**Parser viết test trước.** `src/lib/parser/` là phần lõi. Bảy cái bẫy trong kế hoạch gốc, mỗi cái ít nhất một test case chứng minh đã xử lý.

**Không nuốt lỗi.** Parser gặp đoạn không hiểu thì đẩy vào mảng `warnings`, không im lặng bỏ qua. Không `try/catch` rỗng. Không `catch (e) { return null }`.

**Không hardcode số liệu.** Endpoint `/api/stats` phải query thật. Không có dữ liệu thì trả về mảng rỗng đúng kiểu, để track UI xử lý trạng thái rỗng.

**Commit nhỏ.** Mỗi đơn vị công việc hoàn chỉnh là một commit, thông điệp tiếng Anh. Không gộp cả phase.

**Khi eval xấu đi, giải thích trước khi sửa.** In ra các trường hợp sai nặng nhất kèm chunk đã lấy về. Không đoán mò rồi chỉnh tham số.

## Quy ước code

- TypeScript strict, không dùng `any`
- Validate mọi input API bằng Zod, schema đặt cùng chỗ với contract
- Raw SQL cho retrieval (Drizzle `sql` template), ORM cho CRUD thường
- Tên biến và hàm tiếng Anh
- Giữ tên trường tiếng Việt trong database (`so_hieu`, `ngay_ban_hanh`) — thuật ngữ nghiệp vụ, dịch sang tiếng Anh mất nghĩa

## Đặc thù tiếng Việt

- Luôn `normalize('NFC')` mọi văn bản ngay sau khi extract, trước khi chạy regex
- Thứ tự bảng chữ cái cho Điểm: a b c d **đ** e ê g h i k l m n o ô ơ p q r s t u ư v x y. Không có f j w z. Không dùng `localeCompare` mặc định
- Full-text search dùng config `'simple'`, giữ nguyên dấu thanh
- Model embedding gốc PhoBERT phải tách từ bằng `pyvi` trước khi encode

## Chống phình phạm vi

Định làm bất kỳ thứ nào dưới đây thì dừng và hỏi:

- OCR, xử lý văn bản scan
- Chat nhiều lượt có nhớ ngữ cảnh
- Đăng nhập, phân quyền
- GraphRAG, knowledge graph
- Agent, tool calling
- Tối ưu hiệu năng khi chưa có phép đo cho thấy cần

## Khi được hỏi "xong chưa"

Trả lời bằng tiêu chí nghiệm thu của phase hiện tại kèm bằng chứng: kết quả chạy test, số dòng trong bảng, output thật. Không trả lời "đã xong" chung chung.
