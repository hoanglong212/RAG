# Nền tảng pháp luật đa lĩnh vực

## Các lát cắt đã triển khai

1. Hồ sơ tình huống: phân tích có căn cứ, nêu dữ kiện thiếu, bước tiếp theo, lưu và in/PDF.
2. Hiệu lực theo thời điểm: dùng ngày hiệu lực và quan hệ thay thế/bãi bỏ đã xác minh.
3. So sánh văn bản: diff theo node cấu trúc tương ứng; không tự nhận là văn bản hợp nhất.
4. Máy đọc mức phạt: chỉ hiện khoảng tiền trích được từ chunk căn cứ, không để LLM tự tạo số.
5. Theo dõi: lưu chủ đề/văn bản, gom văn bản và tin mới kể từ lần xem gần nhất.
6. Tin–pháp luật: đối chiếu corpus và tìm bài cùng chủ đề/từ khóa từ nguồn khác.
7. Ma trận phạm vi: công khai số văn bản, chunk, xác minh và cảnh báo theo từng chủ đề.
8. Biểu mẫu: tạo bản nháp khiếu nại, bảo hành và yêu cầu thanh toán lương.
9. Hồ sơ người dùng: profile theo cookie thiết bị, không phải hệ thống đăng nhập có mật khẩu.
10. Quản trị chất lượng: hàng đợi parse, metadata cũ, nguồn RSS lỗi và truy vấn điểm thấp.

## Ranh giới an toàn

- Kết quả là đối chiếu sơ bộ, không phải kết luận vi phạm hoặc tư vấn pháp lý.
- Ma trận phạm vi là nguồn sự thật về chủ đề nào thực sự có corpus.
- So sánh node chỉ hỗ trợ rà soát; văn bản hợp nhất phải lấy từ nguồn chính thức.
- Theo dõi hiện hiển thị trong ứng dụng; gửi email cần thêm nhà cung cấp mail và xác thực người dùng.
- Profile hiện gắn với một trình duyệt. Đăng nhập đa thiết bị là bước production riêng.
