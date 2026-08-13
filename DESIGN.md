---
name: "Tra cứu văn bản hành chính"
description: "Công cụ tra cứu pháp lý đưa người dùng từ câu hỏi đến đúng Điều, Khoản và nguồn gốc."
colors:
  ink: "#10141b"
  ink-muted: "#38424f"
  label: "#586275"
  desk: "#d7dce5"
  tray: "#e7eaef"
  tray-deep: "#d8dee7"
  paper: "#fdfcfa"
  pen-blue: "#24406b"
  pen-blue-deep: "#16294a"
  pen-blue-pale: "#e6ecf7"
  citation-red: "#a8172c"
  citation-red-spread: "#c33a4d"
  citation-anchor: "#fbf1cf"
  hairline: "#d5dae2"
typography:
  display:
    fontFamily: "Be Vietnam Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5.5vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  page-title:
    fontFamily: "Be Vietnam Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  metric:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  lead:
    fontFamily: "Be Vietnam Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.1875rem, 1.6vw, 1.375rem)"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.011em"
  title:
    fontFamily: "Be Vietnam Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Be Vietnam Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  document:
    fontFamily: "Literata, Georgia, Times New Roman, serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Be Vietnam Pro, Segoe UI, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.08em"
  code:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "-0.01em"
rounded:
  control: "3px"
  surface: "7px"
  pill: "999px"
components:
  button-primary:
    backgroundColor: "{colors.pen-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "40px"
  card-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px 20px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "44px"
  page-header:
    backgroundColor: "{colors.pen-blue-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.surface}"
    padding: "24px 20px"
  filter-selected:
    backgroundColor: "{colors.pen-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    height: "36px"
---

# Design System: Tra cứu văn bản hành chính

## Overview

**Creative North Star: "Bàn tra cứu hồ sơ"**

Giao diện là một dụng cụ mở văn bản hành chính, không phải bản sao của một tờ công văn. Thế giới vật chất có ba lớp rõ ràng: bàn làm nền, khay giữ công cụ và giấy dành cho nội dung cần đọc. Header màu mực tạo gáy cứng cho toàn bộ sản phẩm; đầu mỗi trang là một bìa hồ sơ xanh navy trước khi người dùng đi vào các tờ giấy thao tác.

Hệ thống giữ vẻ nghiêm túc, sáng và có trật tự, nhưng không biến thành trang báo hay giao diện hành chính dày đặc. Provenance là trọng tâm: màu đỏ chỉ xuất hiện khi một chi tiết có thể đưa người dùng về căn cứ gốc.

**Key Characteristics:**

- Ba lớp vật liệu bàn, khay và giấy tạo chiều sâu trước khi dùng bóng.
- Xanh bút bi điều khiển hành động; đỏ mực dấu chứng minh nguồn.
- Tiêu đề trang navy giống bìa hồ sơ, nội dung nằm trên giấy sáng.
- Chuyển động ngắn, có mục đích và luôn có phương án reduced-motion.
- Component dùng chung là nguồn hình thức chuẩn cho mọi trang.

## Colors

Bảng màu lấy tính chất từ mực, bìa hồ sơ và giấy làm việc; mỗi màu có vai trò nghiệp vụ ổn định.

### Primary

- **Xanh bút bi:** dùng cho hành động chính, liên kết, focus và trạng thái đang chọn.
- **Navy bìa hồ sơ:** dùng cho đầu trang và mặt mở đầu cần tách rõ khỏi vùng thao tác.

### Secondary

- **Đỏ mực dấu:** chỉ dùng cho trích dẫn, neo và đường quay về văn bản gốc.
- **Vàng neo:** đánh dấu đoạn văn bản đang được trích dẫn hoặc vừa được điều hướng tới.

### Neutral

- **Mực in:** chữ chính và thanh header.
- **Mực phụ / nhãn:** metadata và chữ hỗ trợ; chữ thông thường phải đạt tối thiểu WCAG AA 4.5:1 trên nền đang dùng.
- **Bàn / khay / giấy:** ba cấp nền từ sâu đến sáng; giấy là bề mặt đọc ấm nhẹ, không phải nền kem trang trí.
- **Đường kẻ mờ:** chỉ chia cấu trúc khi đổi nền chưa đủ rõ.

### Named Rules

**The One Red Meaning Rule.** Thấy đỏ nghĩa là có căn cứ và có đường về nguồn; không dùng đỏ cho nút, cảnh báo hoặc biểu đồ.

**The Three Materials Rule.** Phân cấp bằng bàn, khay và giấy trước khi tăng bóng hoặc thêm đường viền.

## Typography

**Display Font:** Be Vietnam Pro (với Segoe UI và system sans-serif dự phòng)  
**Body Font:** Be Vietnam Pro (với Segoe UI và system sans-serif dự phòng)  
**Document Font:** Literata (với Georgia và Times New Roman dự phòng)  
**Label/Mono Font:** IBM Plex Mono (với Consolas và monospace dự phòng)

**Character:** Be Vietnam Pro giữ giao diện hiện đại và xử lý dấu tiếng Việt ổn định. Literata chỉ xuất hiện trong mặt đọc văn bản gốc; IBM Plex Mono dành cho số hiệu và số liệu cần quét nhanh.

### Hierarchy

- **Display:** chỉ dành cho màn mở màn; mỗi trang dùng đúng một lần.
- **Page title:** tiêu đề trên bìa hồ sơ navy ở đầu mỗi trang.
- **Metric:** con số đo lường trong ô thống kê và số liệu nổi bật, luôn tabular.
- **Title:** dùng cho tiêu đề mục và thành phần dùng chung.
- **Body:** dùng nhịp dòng rộng để dấu tiếng Việt hai tầng không chạm nhau.
- **Document:** dùng cho nội dung văn bản gốc, không lan sang điều khiển giao diện.
- **Label:** chữ hoa chỉ dành cho nhãn ngắn và luôn nới tracking.
- **Code:** số hiệu văn bản và số liệu dùng tabular numerals khi cần thẳng cột.

### Named Rules

**The Tool-versus-Document Rule.** Sans-serif là công cụ; serif là tài liệu gốc. Không dùng serif để trang trí card hoặc heading giao diện.

## Layout

Nội dung chạy trong ba bề rộng theo nhiệm vụ: đọc dài hẹp, trang làm việc vừa và dashboard rộng. Lề trang bắt đầu gọn trên màn hình nhỏ rồi tăng từ breakpoint nhỏ; đầu trang luôn đứng trước nội dung như một bìa hồ sơ độc lập.

Điều hướng đầy đủ chỉ xuất hiện từ breakpoint `xl` (1280px). Dưới ngưỡng đó, header giữ tên sản phẩm và nút menu; menu mở thành một dialog phủ dưới header, có `aria-modal`, đưa focus vào mục đầu, giữ Tab trong menu, đóng bằng Escape và trả focus về nơi mở.

## Elevation & Depth

Hệ thống ưu tiên phân lớp bằng màu nền. Bóng thấp cho giấy nghỉ trên khay, bóng vừa cho phần tử đang chọn hoặc có thể nhấc lên, và bóng cao cho header, dialog, bìa hồ sơ cùng trạng thái focus quan trọng. Không dùng blur kính; các lớp vẫn là màu phẳng để độ tương phản ổn định.

### Shadow Vocabulary

- **Paper rest:** bóng rất sát cho card giấy ở trạng thái nghỉ.
- **Control lift:** bóng vừa cho nút chính, filter đang chọn và nav active.
- **Folder / modal lift:** bóng cao cho đầu trang, menu di động và trạng thái focus nổi bật.

### Named Rules

**The Tonal-First Rule.** Nếu đổi vật liệu đã đủ phân cấp thì không tăng bóng.

## Shapes

Điều khiển dùng góc cong nhỏ, bề mặt lớn dùng góc cong vừa; hình tròn chỉ dành cho con dấu, họa tiết bìa và chip dạng pill. Viền mảnh hoặc inset shadow giữ kích thước trường ổn định; ring rất nhẹ giúp card giấy tách khỏi khay mà không thành hộp nặng.

## Components

### Buttons

- **Primary:** xanh bút bi trên giấy, chữ semibold, cao tối thiểu 40px; hover nhấc 1px, chuyển sang navy và tăng bóng; active hạ xuống 1px.
- **Secondary / Outline / Quiet:** dùng khay hoặc nền trong suốt; vẫn giữ chung hình khối và nhịp chuyển động.
- **Focus / Disabled:** focus dùng outline xanh 2px có offset; disabled tắt tương tác và giảm opacity.

### Chips

- **Filter:** chiều cao tối thiểu 36px; trạng thái chọn là xanh bút bi trên giấy, trạng thái nghỉ là giấy có viền inset.

### Cards / Containers

- **Paper card:** giấy sáng, góc bề mặt, bóng thấp và ring mực rất nhẹ; padding tăng từ 16px lên 20px ở màn hình nhỏ trở lên.
- **Page header:** bìa navy có texture đường chéo và vòng dập chìm; nội dung luôn nằm trên lớp trang trí.

### Inputs / Fields

- **Style:** giấy lõm trong khay, cao tối thiểu 44px, viền bằng inset shadow để không làm lệch chiều cao.
- **Hover / Focus:** nền sáng lên; focus đổi inset sang xanh bút bi và có bóng kéo nhẹ.
- **Disabled:** trở về nền khay, chữ nhãn và con trỏ không khả dụng.

### Navigation

- **Desktop:** header mực cao 64px; logo dùng biểu tượng Landmark xanh trên giấy. Mục đang mở nhấc khỏi dải mực thành thẻ giấy; mục nghỉ là chữ giấy giảm sắc độ.
- **Below `xl`:** dùng dialog điều hướng một cột, chuyển thành hai cột từ breakpoint nhỏ; mỗi mục có icon, tên và mô tả tác vụ.

### Search Panel

Ô hỏi là bề mặt giấy nổi bật, có nhãn phạm vi, cam kết “Có dẫn nguồn”, textarea đủ ba dòng và CTA rõ. Một vạch xanh quét một lần khi xuất hiện; focus-within chỉ nhấc toàn bề mặt 1px.

## Do's and Don'ts

### Do:

- **Do** dùng shared kit cho nút, card, trường, filter, page header và navigation.
- **Do** giữ chữ giao diện đạt tối thiểu 4.5:1 và để focus bàn phím luôn nhìn thấy.
- **Do** đưa nguồn lên trước lời giải thích khi trình bày kết quả tra cứu.
- **Do** tắt keyframe và đưa thời lượng transition về 0 khi người dùng bật reduced motion.

### Don't:

- **Don't** dùng đỏ ngoài provenance, citation và anchor về văn bản gốc.
- **Don't** biến bề mặt đọc thành nhiều card trắng giống nhau hoặc thêm blur kính.
- **Don't** dùng serif ngoài nội dung văn bản gốc, hoặc chữ hoa dài cho tiếng Việt.
- **Don't** hiển thị nav desktop dưới `xl` hay thay dialog di động bằng menu không quản lý focus.
