# CLAUDE.md — Track B (thiết kế và giao diện)

Đặt ở gốc repo. Claude Code đọc file này mỗi phiên.

> Bản này thay thế CLAUDE.md ở kế hoạch v1. Các quy tắc về lõi xử lý đã chuyển sang `AGENTS.md`.

## Bạn phụ trách gì

Toàn bộ phần nhìn thấy được: design system, mọi trang, chat UI, dashboard, trạng thái rỗng và lỗi, typography, chuyển động.

Bạn **không** phụ trách logic. Có agent khác đang làm track lõi trong worktree riêng. Không sửa file trong `src/lib/`, `src/db/`, `src/app/api/`, `eval/`, `scripts/`.

## Đọc trước khi bắt đầu

1. `KE-HOACH-V2-CODEX-CLAUDE.md` **mục 6** — design brief đầy đủ. Đây là tài liệu quan trọng nhất với bạn
2. `docs/CONTRACT.md` — hình dạng dữ liệu bạn sẽ nhận
3. `src/mocks/` — dữ liệu giả để phát triển

## Thư mục bạn sở hữu

```
src/app/(ui)/**     các trang
src/components/**   component
src/styles/**       token, global CSS
public/**           font, ảnh
```

## Quy tắc bắt buộc

**Phát triển trên mock cho tới ngày 9.** Không chờ track lõi. Mọi thứ import từ `src/mocks/`, đúng kiểu trong `src/types/contract.ts`. Ngày gộp chỉ đổi nguồn dữ liệu, không sửa component.

**Không sửa contract.** Thấy contract thiếu thứ gì thì dừng lại, nêu rõ cần gì và tại sao, chờ xác nhận. Tự thêm trường sẽ làm hỏng track kia.

**Design plan trước, code sau.** Trước khi viết dòng CSS đầu tiên, trình bày: bảng màu 4–6 giá trị hex có tên, cặp typeface cho ít nhất 2 vai trò, ý tưởng bố cục kèm wireframe ASCII, và yếu tố chữ ký. Chờ duyệt.

**Tự phê bình bản plan trước khi trình.** Đọc lại và tự hỏi: nếu đề bài là một sản phẩm khác hoàn toàn, mình có ra đúng thiết kế này không? Nếu có, đó là mặc định chứ không phải lựa chọn — làm lại phần đó và nói rõ đã đổi gì, vì sao.

**Chụp màn hình và tự nhìn.** Có Playwright MCP thì dùng. Một ảnh chụp đáng giá hơn nghìn token suy đoán. Đặc biệt bắt buộc khi kiểm tra chữ tiếng Việt.

**Trạng thái rỗng, đang tải, lỗi là công dân hạng nhất.** Làm cùng lúc với trạng thái có dữ liệu, không để sau. Mock đã có sẵn ba trạng thái này.

**Không hardcode số liệu.** Số trên dashboard đến từ mock hoặc API thật. Không bịa số cho đẹp.

## Đặc thù tiếng Việt — kiểm tra mỗi lần dựng component có chữ

- `line-height` body **1.65–1.75**, không phải 1.5. Chữ như `ế ộ ữ ỹ` có hai tầng dấu, leading mặc định làm dấu chạm dòng trên
- Font phải có bộ ký tự tiếng Việt. Lọc theo ngôn ngữ Vietnamese trên Google Fonts trước khi chốt. Font thiếu sẽ ra ô vuông hoặc rơi về font dự phòng
- Hạn chế `text-transform: uppercase`. Chữ hoa toàn phần nén dấu lại, khó đọc hơn hẳn tiếng Anh. Dùng thì phải tăng `letter-spacing` và chỉ cho nhãn ngắn
- Chuỗi kiểm thử bắt buộc: `Ủy ban nhân dân — Nghị định 15/2020/NĐ-CP — Điều 8 Khoản 3 Điểm đ`. Dán vào mỗi component có chữ, chụp lại xem có bị cắt hay tràn không

## Ba cái bẫy thẩm mỹ phải tránh

Thiết kế do AI sinh đang tụ về ba kiểu, xuất hiện bất kể đề bài:

1. Nền kem ấm khoảng `#F4F1EA` + serif tương phản cao + điểm nhấn đất nung khoảng `#D97757`
2. Nền gần đen + đúng một màu chói
3. Bố cục kiểu báo giấy: kẻ chỉ mảnh, bo góc bằng không, cột dày đặc

Định hướng trong brief đứng gần kiểu 3. Biết điều đó và chủ động đẩy ra xa: trục văn bản phải sống động, có trạng thái, có chuyển động — không phải thêm một cột kẻ chỉ. Và đừng rơi về Inter mặc định cho mọi vai trò.

## Kỷ luật màu

`--dau-do` (#A8172C) **chỉ** dùng cho những gì liên quan trực tiếp tới neo trích dẫn. Không dùng cho nút, không cho cảnh báo, không cho biểu đồ. Một màu, một nghĩa.

## Chữ nghĩa trong giao diện

- Gọi tên theo thứ người dùng nhận ra, không theo cách hệ thống vận hành
- Nút nói đúng việc sẽ xảy ra: "Tra cứu", không phải "Gửi". Tên hành động giữ nguyên suốt luồng
- Trạng thái rỗng là lời mời hành động. Màn hình chat trống gợi ý ba câu hỏi mẫu lấy từ bộ tài liệu thật
- Lỗi không xin lỗi và không mơ hồ về chuyện đã xảy ra
- Câu quan trọng nhất hệ thống: khi độ tin cậy thấp phải hiện **"Không tìm thấy trong bộ tài liệu"**. Thiết kế cho nó một trạng thái đàng hoàng, đừng để trông như lỗi

## Chống phình phạm vi

Định làm bất kỳ thứ nào dưới đây thì dừng và hỏi:

- Chế độ tối
- Đa ngôn ngữ giao diện
- Thư viện hoạt ảnh nặng
- Component tự viết trong khi shadcn/ui đã có sẵn
- Tối ưu hiệu năng khi chưa đo

## Quy ước code

- TypeScript strict, không `any`
- Tailwind + shadcn/ui. Token màu và type khai trong `src/styles/tokens.css`, không rải giá trị hex trong component
- Cẩn thận với độ ưu tiên selector CSS. Class dạng `.section` và selector theo phần tử rất dễ triệt tiêu nhau, hay xảy ra ở padding/margin giữa các khối
- Sàn chất lượng, làm mà không cần nói: responsive xuống mobile, focus bàn phím nhìn thấy được, tôn trọng `prefers-reduced-motion`

## Khi được hỏi "xong chưa"

Trả lời kèm ảnh chụp màn hình. Không mô tả bằng lời thứ có thể nhìn thấy.
