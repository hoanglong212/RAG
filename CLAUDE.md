# CLAUDE.md

Đặt file này ở gốc repo. Claude Code tự đọc mỗi phiên.

## Bối cảnh

Đây là đồ án tốt nghiệp kỳ thực tập, thời hạn 14 ngày, một người làm. Kế hoạch đầy đủ nằm ở `PLAN.md`. Đọc file đó trước khi làm bất cứ việc gì.

Sản phẩm: hệ thống RAG cho văn bản hành chính Việt Nam, parse theo cấu trúc Chương/Điều/Khoản thay vì cắt theo độ dài, kèm dashboard.

## Quy tắc bắt buộc

**Làm đúng một phase mỗi phiên.** Kế hoạch chia 8 phase ở mục 13. Khi tôi nói làm Phase N, chỉ làm Phase N. Đạt tiêu chí nghiệm thu thì dừng lại và báo cáo. Không viết trước code của phase sau, kể cả khi "tiện tay".

**Không tự ý thêm thư viện.** Stack đã chốt ở mục 2. Muốn thêm bất kỳ package nào ngoài danh sách đó, hỏi trước và nêu lý do. Đặc biệt: không cài LangChain, LlamaIndex, hay bất kỳ framework RAG nào. Toàn bộ logic RAG ở project này viết tay, đó là chủ ý.

**Parser viết test trước.** Module `src/lib/parser/` là phần lõi. Mọi thay đổi ở đây phải có test kèm theo. Bảy cái bẫy ở mục 5.3 của kế hoạch, mỗi cái ít nhất một test case.

**Không nuốt lỗi.** Parser gặp đoạn không hiểu thì đẩy vào mảng `warnings`, không được im lặng bỏ qua. Không dùng `try/catch` rỗng. Không `catch (e) { return null }`.

**Không hardcode số liệu.** Mọi con số trên dashboard phải đến từ query thật. Không có dữ liệu thì hiện trạng thái rỗng, không bịa số mẫu.

**Commit nhỏ, thường xuyên.** Mỗi đơn vị công việc hoàn chỉnh là một commit, thông điệp tiếng Anh, mô tả thay đổi. Không gộp cả phase vào một commit.

**Khi kết quả eval xấu đi, giải thích trước khi sửa.** In ra các trường hợp sai nặng nhất kèm chunk đã lấy về. Không đoán mò rồi chỉnh tham số.

## Chống phình phạm vi

Nếu bạn định làm bất kỳ thứ nào dưới đây, dừng lại và hỏi tôi:

- OCR, xử lý văn bản scan
- Chat nhiều lượt có nhớ ngữ cảnh
- Đăng nhập, phân quyền
- GraphRAG, knowledge graph
- Agent, tool calling
- Tối ưu hiệu năng khi chưa có phép đo cho thấy cần

## Quy ước code

- TypeScript strict mode, không dùng `any`
- Validate mọi input của API route bằng Zod
- Raw SQL cho retrieval (Drizzle `sql` template), ORM cho CRUD thường
- Tên biến và hàm tiếng Anh; chuỗi hiển thị cho người dùng tiếng Việt
- Giữ tên trường tiếng Việt trong schema database (`so_hieu`, `ngay_ban_hanh`) — đây là thuật ngữ nghiệp vụ, dịch sang tiếng Anh sẽ mất nghĩa

## Đặc thù tiếng Việt

- Luôn `normalize('NFC')` mọi văn bản ngay sau khi extract, trước khi chạy regex
- Thứ tự bảng chữ cái cho Điểm: a b c d **đ** e ê g h i k l m n o ô ơ p q r s t u ư v x y. Không có f j w z. Không dùng `localeCompare` mặc định
- Full-text search dùng config `'simple'`, giữ nguyên dấu thanh
- Model embedding gốc PhoBERT phải tách từ bằng `pyvi` trước khi encode

## Khi tôi hỏi "xong chưa"

Trả lời bằng tiêu chí nghiệm thu của phase hiện tại, kèm bằng chứng: kết quả chạy test, số dòng trong bảng, hoặc ảnh chụp output. Không trả lời "đã xong" chung chung.
