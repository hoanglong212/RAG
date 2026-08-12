# Kế hoạch v2 — Hai agent song song, Claude phụ trách thiết kế

Tài liệu này bổ sung cho `KE-HOACH-RAG-VAN-BAN.md`. Nội dung kỹ thuật (schema, parser, retrieval, eval) vẫn lấy từ file đó. File này quy định **ai làm gì, ranh giới ở đâu, và định hướng thiết kế**.

---

## 1. Nguyên tắc nền: contract-first

Sai lầm phổ biến nhất khi dùng hai agent là cho cả hai cùng vào một thư mục rồi hy vọng. Kết quả: hai bên sửa cùng file, đè lên nhau, và bạn mất nửa ngày gỡ conflict cho một việc lẽ ra làm tay 20 phút.

Cách đúng gồm ba điều kiện, thiếu một là hỏng:

1. **Đóng băng hợp đồng trước.** Schema database, kiểu TypeScript, chữ ký API — chốt xong trước khi bất kỳ agent nào chạy. Nằm ở `docs/CONTRACT.md`.
2. **Mỗi agent một worktree, một branch, một tập thư mục riêng.** Không giao nhau.
3. **Có dữ liệu giả.** Track thiết kế không được phép chờ track backend. Mock fixture đúng theo contract cho phép hai bên chạy song song thật sự.

Điểm cộng phụ: "em áp dụng contract-first development, định nghĩa interface trước rồi hai luồng thực thi song song" là câu trả lời rất tốt khi mentor hỏi về quy trình. Đây là kỹ thuật thật trong công nghiệp, không phải mẹo dùng AI.

---

## 2. Phân công

| | **Track A — Codex** | **Track B — Claude Code** |
|---|---|---|
| Vai trò | Logic, dữ liệu, số đo | Thiết kế, giao diện, trải nghiệm |
| Sở hữu thư mục | `src/lib/**`, `src/db/**`, `src/app/api/**`, `eval/**`, `scripts/**` | `src/app/(ui)/**`, `src/components/**`, `src/styles/**`, `public/**` |
| Branch | `track/core` | `track/ui` |
| Đầu ra | Parser có test, pipeline nạp, hybrid search, eval runner | Design system, toàn bộ trang, dashboard, chat UI |
| File cấu hình | `AGENTS.md` | `CLAUDE.md` |

**Lý do chia thế này, không phải ngược lại.** Parser và eval là việc đặc tả rõ, kết quả đúng/sai xác định được bằng test — hợp với agent chạy tự động dài. Thiết kế cần vòng lặp nhìn–sửa–nhìn lại, cần đánh giá thẩm mỹ, cần agent xem được ảnh chụp màn hình. Không phải "Codex giỏi hơn ở X" mà là hai loại công việc có bản chất khác nhau.

### Không ai được đụng vào

- `docs/CONTRACT.md` — sửa phải có bạn đồng ý, và phải báo cả hai track
- `src/db/schema.ts` — Codex sở hữu, nhưng mọi thay đổi sau ngày 1 đều là sự kiện, không phải commit thường
- `package.json` — bạn tự sửa. Hai agent cùng thêm dependency là nguồn conflict số một

---

## 3. Thiết lập worktree

```bash
# Trong repo chính
git checkout -b track/core
git checkout -b track/ui
git checkout main

git worktree add ../rag-core   track/core
git worktree add ../rag-ui     track/ui

# Terminal 1 — Codex
cd ../rag-core && codex

# Terminal 2 — Claude Code
cd ../rag-ui && claude
```

Hoặc dùng cờ tích hợp của Claude Code:

```bash
claude --worktree ui
```

**Ba cái bẫy của worktree:**

- Mỗi worktree cần `npm install` riêng (`node_modules` không dùng chung).
- File `.env` không được git theo dõi nên không tự sang worktree mới. Copy tay, hoặc để ngoài repo rồi symlink.
- **Hai worktree cùng chạy migration lên một database sẽ giẫm chân nhau.** Cho track UI một database riêng, hoặc chỉ cho nó đọc. Đây là lỗi hay gặp nhất.

---

## 4. Hợp đồng giữa hai bên

Chốt trong `docs/CONTRACT.md` vào ngày 0. Xem file mẫu kèm theo.

Ba thứ phải có:

**Kiểu dữ liệu chung** đặt ở `src/types/contract.ts`, cả hai track import, không track nào được sửa một mình.

**Chữ ký API** — đường dẫn, hình dạng request, hình dạng response, mã lỗi. Viết dưới dạng schema Zod, dùng làm nguồn sự thật duy nhất.

**Mock fixture** ở `src/mocks/` — dữ liệu giả bám đúng kiểu thật. Ít nhất: 3 văn bản, 1 cây node đầy đủ, 1 phản hồi chat có trích dẫn, 1 bộ số liệu dashboard, và **một trường hợp lỗi cùng một trường hợp rỗng**. Hai cái sau hay bị bỏ quên, rồi giao diện vỡ ngay lúc demo.

Track UI phát triển hoàn toàn trên mock cho tới ngày 9.

---

## 5. Lịch hai luồng, 14 ngày

### Ngày 0 — nửa ngày, bạn tự làm, không agent nào chạy

Viết `docs/CONTRACT.md`, `src/types/contract.ts`, mock fixture. Chốt schema. Tạo worktree.

Nửa ngày này quyết định 13 ngày sau. Đừng nhảy cóc.

### Ngày 1

| Track A (Codex) | Track B (Claude Code) |
|---|---|
| Khởi tạo dự án, DB, migration, chạy được | Cài các skill UI ở phần 7. Đọc design brief phần 6. **Chỉ làm design plan, chưa code** |

Cuối ngày: bạn duyệt design plan. Nếu nó nghe giống bất kỳ trang admin nào từng thấy, bắt làm lại. Đây là điểm can thiệp rẻ nhất trong cả dự án.

### Ngày 2–4

| Track A | Track B |
|---|---|
| Parser theo mục 5 kế hoạch gốc. Test trước, code sau | Design token, layout khung, thư viện component nền, trạng thái rỗng/lỗi/đang tải |

Ngày 4: merge cả hai vào `main`, kiểm tra typecheck. Sync đầu tiên.

### Ngày 5–6

| Track A | Track B |
|---|---|
| Extract, chunk hai chiến lược, embed, nạp 50 văn bản | Trang chat và trang chi tiết văn bản, chạy trên mock |

### Ngày 7–8

| Track A | Track B |
|---|---|
| Eval runner, chạy cấu hình 1–2, có số đầu tiên | Dựng "trục văn bản" — xem phần 6.5. Đây là phần khó nhất của track UI |

Ngày 8: sync lần hai.

### Ngày 9 — ngày gộp

Cả hai track dừng làm mới. Nối UI thật vào API thật, bỏ mock. Sửa mọi chỗ lệch so với contract.

Dự trù nguyên ngày. Nếu xong sớm thì tốt, nếu không thì đây đúng là chỗ nó phải tốn.

### Ngày 10–11

| Track A | Track B |
|---|---|
| Hybrid + RRF, rerank, service embedding tiếng Việt, chạy nốt cấu hình 3–5 | Dashboard đủ 10 biểu đồ, trang `/eval` |

### Ngày 12 — vòng phê bình thiết kế

Chạy `/design-review` (xem phần 7) trên toàn bộ giao diện. Sửa những gì nó chỉ ra. Kiểm tra riêng: tiếng Việt dấu chồng có bị cắt không, tên cơ quan dài có tràn không, bảng trên màn hình hẹp thế nào.

### Ngày 13 — deploy, README, seed data

### Ngày 14 — tập demo, dự phòng

---

## 6. Design brief

Phần này viết cho Claude Code. Đọc kỹ trước khi vẽ bất cứ thứ gì.

### 6.1 Chủ thể

**Sản phẩm là gì:** công cụ tra cứu văn bản quy phạm pháp luật Việt Nam bằng câu hỏi tự nhiên, trả lời kèm trích dẫn tới đúng Điều.

**Người dùng:** cán bộ văn phòng cần tra một quy định cụ thể trong lúc đang làm việc khác. Họ không đọc để giải trí. Họ cần một câu trả lời và một chỗ để kiểm chứng.

**Việc duy nhất của trang chính:** đưa người dùng từ câu hỏi tới một Điều cụ thể, **và làm họ tin câu trả lời vì thấy được nó đến từ đâu.**

Vế sau mới là phần khó. Một chatbot trả lời trôi chảy mà không chứng minh được nguồn thì vô dụng trong bối cảnh pháp lý.

### 6.2 Thế giới vật chất của chủ thể

Đây là nơi lấy chất liệu thiết kế:

- Header hai cột: tên cơ quan bên trái, quốc hiệu bên phải, gạch ngang bên dưới
- Con dấu đỏ tròn, mực dấu loang, đóng đè lên chữ ký
- Số hiệu dạng `15/2020/NĐ-CP` — một chuỗi mã hoá cả số thứ tự, năm, loại văn bản, cơ quan
- Hệ thống đánh số nghiêm ngặt: Chương → Điều → Khoản → Điểm
- Chữ Times New Roman 13–14, căn đều hai bên, dày đặc

### 6.3 Căng thẳng thiết kế cốt lõi

Văn bản hành chính **cố tình khó đọc lướt**. Đồng nhất, dày, không có điểm nhấn thị giác. Đó là bản chất của thể loại.

Vì vậy **đừng bắt chước văn bản.** Sản phẩm không phải bản sao đẹp hơn của tờ công văn — nó là **dụng cụ mở tờ công văn ra**. Giống mục lục tra cứu, tủ phiếu thư viện, con dao rọc giấy. Ngôn ngữ thị giác nên là ngôn ngữ của công cụ điều hướng, không phải của tài liệu.

Nếu Claude Code định làm giao diện trông giống một tờ giấy A4 có bóng đổ, đó là hiểu sai brief.

### 6.4 Đề xuất token — điểm khởi đầu, không phải mệnh lệnh

```css
--muc-in:   #14181F;  /* chữ chính, đen ngả xanh chứ không đen tuyệt đối */
--giay:     #FBFBFA;  /* nền, trắng hơi lạnh — KHÔNG phải kem */
--dau-do:   #A8172C;  /* đỏ mực dấu — CHỈ dùng cho neo trích dẫn */
--but-xanh: #24406B;  /* xanh bút bi — liên kết, trạng thái đang chọn */
--ke-mo:    #DDE1E6;  /* đường kẻ mảnh */
--nhan:     #6B7280;  /* nhãn, metadata */
```

**Kỷ luật về màu đỏ:** `--dau-do` chỉ xuất hiện ở chỗ liên quan trực tiếp tới trích dẫn. Không dùng cho nút, không dùng cho cảnh báo, không dùng cho biểu đồ. Khi người dùng thấy màu đỏ đó, họ biết ngay: đây là chỗ neo về văn bản gốc. Một màu, một nghĩa, dạy được người dùng chỉ sau vài phút dùng.

### 6.5 Yếu tố chữ ký: trục văn bản

**Đây là thứ khiến sản phẩm này không phải một con chatbot nữa.**

Một dải dọc cố định bên trái, hiển thị cây Chương → Điều → Khoản của văn bản đang được nhắc tới. Khi câu trả lời trích dẫn Điều 8 Khoản 3, trục cuộn tới đúng vị trí đó và đánh dấu, đồng thời vẫn cho thấy các Điều xung quanh.

Nó biến "AI bảo thế" thành "đây, chính xác chỗ này trong nghị định". Người dùng thấy được câu trả lời nằm ở đâu trong tổng thể, thấy được nó thuộc Chương nào, và thấy được có Điều nào liên quan ngay bên cạnh.

Đây là chỗ dồn toàn bộ độ táo bạo. Mọi thứ còn lại giữ trầm và kỷ luật.

### 6.6 Chữ tiếng Việt — ràng buộc thật, hay bị bỏ qua

Đa số giao diện tiếng Việt xấu vì ba lý do sau, và không ai nhắc tới chúng:

**Dấu chồng cần thêm khoảng thở.** Các chữ như `ế` `ộ` `ữ` `ỹ` cao hơn chữ Latin thường vì có hai tầng dấu. `line-height: 1.5` mặc định làm dấu chạm vào dòng trên. Dùng **1.65–1.75 cho body**, 1.25–1.35 cho tiêu đề lớn. Kiểm tra bằng một đoạn chứa `ẫ ộ ợ ữ ẳ`.

**Nhiều font không có bộ ký tự tiếng Việt.** Chọn phải font thiếu là ra ô vuông hoặc rơi về font dự phòng, chữ nhìn lệch hẳn. Lọc theo ngôn ngữ Vietnamese trên Google Fonts trước khi chốt. Be Vietnam Pro do người Việt thiết kế riêng cho tiếng Việt, vị trí dấu chuẩn nhất — ứng viên mạnh cho vai display hoặc UI.

**Chữ hoa toàn phần rất hại.** `TIÊU ĐỀ VIẾT HOA` làm dấu bị nén và khó đọc hơn hẳn tiếng Anh. Hạn chế `text-transform: uppercase`, hoặc nếu dùng thì tăng `letter-spacing` và chỉ dùng cho nhãn ngắn.

Ba điều này đưa vào README được: "xử lý typography tiếng Việt" là chi tiết cho thấy bạn để ý tới thứ người khác bỏ qua.

### 6.7 Ba cái bẫy phải tránh

Thiết kế do AI sinh hiện đang tụ về ba kiểu, và chúng xuất hiện bất kể đề bài là gì:

1. Nền kem ấm khoảng `#F4F1EA` + serif tương phản cao + điểm nhấn đất nung khoảng `#D97757`
2. Nền gần đen + đúng một màu chói (xanh acid hoặc đỏ son)
3. Bố cục kiểu báo giấy: kẻ chỉ mảnh, bo góc bằng không, cột dày đặc

Định hướng ở 6.4 **đứng gần kiểu số 3 một cách nguy hiểm**. Nói thẳng ra ở đây để Claude Code tự ý thức. Cách thoát: trục văn bản ở 6.5 phải là thứ sống động, có chuyển động, có trạng thái — không phải một cột kẻ chỉ nữa. Và bảng chữ phải có cá tính, không rơi về Inter mặc định.

Nếu design plan đọc lên nghe giống bất kỳ trang admin nào bạn từng thấy, làm lại.

### 6.8 Chữ nghĩa trong giao diện

Chữ trong giao diện là vật liệu thiết kế, không phải trang trí.

- Gọi tên theo thứ người dùng nhận ra, không theo cách hệ thống vận hành. "Không tìm thấy trong bộ văn bản" chứ không phải "Retrieval trả về 0 kết quả"
- Nút nói đúng việc sẽ xảy ra: "Tra cứu", không phải "Gửi"
- Trạng thái rỗng là lời mời hành động, không phải thông báo buồn. Màn hình chat trống nên gợi ý ba câu hỏi mẫu lấy từ chính bộ tài liệu đã nạp
- Lỗi không xin lỗi, và không mơ hồ về chuyện gì đã xảy ra
- Câu quan trọng nhất toàn hệ thống: khi độ tin cậy thấp, phải nói **"Không tìm thấy trong bộ tài liệu"** chứ không được bịa. Viết cho câu này một trạng thái giao diện riêng, đàng hoàng — đừng để nó trông như một lỗi

---

## 7. Skill và công cụ UI/UX

### 7.1 Cảnh báo bảo mật — đọc trước khi cài bất cứ thứ gì

Một skill là thư mục chứa `SKILL.md` kèm script mà agent sẽ chạy. <cite index="63-1">Một skill độc hại có thể giấu reverse shell trong phần hướng dẫn và kích hoạt ngay khi được nạp.</cite>

Nguyên tắc: **mở file `SKILL.md` đọc bằng mắt trước khi cài**, đặc biệt phần script. Repo lạ, ít sao, mới tạo thì bỏ qua. Không chạy `install.sh` mà chưa đọc nội dung.

Đây cũng là câu trả lời tốt nếu mentor hỏi về an toàn khi dùng công cụ AI.

### 7.2 Nên cài

**Ưu tiên một — quy trình phê bình thiết kế**

<cite index="74-1">`OneRedOak/claude-code-workflows/design-review` là hệ thống phê bình thiết kế tự động, dùng Playwright MCP điều khiển trình duyệt thật kết hợp với subagent chuyên trách, đánh giá thay đổi frontend về tính khả dụng, khả năng tiếp cận, và độ đáp ứng.</cite> <cite index="72-1">Nó chạy trên UI đã render thật chứ không chỉ phân tích code tĩnh, và đối chiếu với các chuẩn thiết kế của Stripe, Airbnb, Linear, bao gồm phân cấp thị giác và WCAG AA+.</cite> <cite index="73-1">Gồm ba phần: đoạn cấu hình cho CLAUDE.md, slash command `/design-review` gọi khi cần, và subagent.</cite>

Đây là thứ đáng cài nhất. Nó cho bạn một vòng phê bình khách quan mà không cần người thứ hai.

**Ưu tiên hai — bộ skill UX**

<cite index="66-1">`tommyjepsen/awesome-ux-skills` gồm nhiều skill đáng chú ý: một skill chụp ảnh một URL rồi trả về dữ liệu thiết kế đo được — typography, bảng màu kèm tỷ lệ diện tích ở cả hex và OKLCH, bố cục, khoảng cách, hình khối, chuyển động — rồi xuất thành token shadcn/ui; một skill đánh giá sản phẩm theo 10 nguyên tắc thiết kế tốt của Dieter Rams; và một skill kiểm tra code UI theo 12 quy tắc thủ công thị giác như không gradient, không glow, không `transition: all`, không chữ giữ chỗ.</cite>

Skill trích token từ ảnh chụp rất hợp với dự án này: tìm một trang tra cứu văn bản pháp lý làm tốt, chụp lại, lấy token ra làm điểm khởi đầu — rồi cố tình đi khác đi.

**Ưu tiên ba — nguồn chính thức**

<cite index="63-1">Anthropic công bố skill mẫu tại github.com/anthropics/skills, trong đó có `frontend-design`.</cite> Đây là nguồn an toàn nhất, nên xem trước các repo cộng đồng.

### 7.3 Danh mục để tự tìm thêm

- `rohitg00/awesome-claude-design` — tổng hợp theo trường phái thẩm mỹ
- `BehiSecc/awesome-claude-skills` và `ComposioHQ/awesome-claude-skills` — danh mục chung
- `Owl-Listener/designer-skills` — bộ lớn chia theo giai đoạn: nghiên cứu, chiến lược, UI, kiểm thử, bàn giao

Cài 3–4 cái thật sự dùng. Cài 20 cái chỉ làm loãng ngữ cảnh và agent chọn sai skill.

### 7.4 Playwright MCP

Cài cái này cho track UI. Nó cho Claude Code mở trình duyệt thật, chụp màn hình, tự nhìn kết quả của chính mình. Khác biệt giữa agent đoán mò giao diện có ổn không và agent nhìn thấy nó.

Với dự án tiếng Việt, đây là cách duy nhất bắt được lỗi dấu bị cắt hay chữ tràn khung.

---

## 8. Chống trôi giữa hai track

**Sau mỗi lần sync, chạy `npx tsc --noEmit` trên `main`.** Kiểu dữ liệu là hợp đồng — lệch kiểu là dấu hiệu sớm nhất của việc hai bên hiểu khác nhau.

**Khi một track cần đổi contract:** dừng lại, sửa `docs/CONTRACT.md` và `src/types/contract.ts` trên `main`, rebase cả hai track. Không bao giờ để một track tự sửa contract trong branch riêng — bên kia sẽ không biết, và bạn phát hiện ra vào ngày gộp.

**Mỗi track một file nhật ký.** `docs/log-core.md` và `docs/log-ui.md`, mỗi ngày vài dòng: làm gì, quyết định gì, còn vướng gì. Chi phí gần bằng không, và tới ngày 13 viết README bạn sẽ có sẵn nguyên liệu.

---

## 9. Khi mentor hỏi về quy trình

Câu này gần như chắc chắn sẽ có, và trả lời tốt thì được điểm cao hơn cả phần code.

**Nói thật là dùng AI.** Giấu thì sẽ lộ, và lộ thì mất tin tưởng hoàn toàn. Cách nói tốt:

> Em dùng hai agent song song với ranh giới rõ ràng: một luồng làm lõi xử lý, một luồng làm giao diện, ngăn cách bằng một contract đóng băng từ ngày đầu. Em viết đặc tả và tiêu chí nghiệm thu, agent thực thi, em duyệt từng phase. Phần parser em bắt viết test trước và tự đọc lại toàn bộ vì đó là chỗ quyết định chất lượng cả hệ thống.

Nghe như một kỹ sư biết cách dùng công cụ, không phải người nộp bài của máy.

**Chuẩn bị cho câu hỏi tiếp theo:** "vậy em thật sự hiểu code không". Cách duy nhất trả lời được là bạn đã đọc kỹ ít nhất `src/lib/parser/structure.ts` và giải thích được từng đoạn. Dành hẳn một buổi tối làm việc này.

---

## 10. Nếu thiếu thời gian, cắt theo thứ tự này

1. Rerank bằng LLM
2. Service embedding tiếng Việt (giữ API hosted)
3. Cấu hình eval số 5
4. Năm biểu đồ khu B của dashboard, giữ lại 5 cái khu A
5. Hoạt ảnh của trục văn bản (giữ chức năng, bỏ chuyển động)

**Không bao giờ cắt:** bộ câu hỏi vàng, bảng eval, trích dẫn bấm được. Ba thứ này là toàn bộ luận điểm của dự án. Không có chúng thì đây chỉ là một con chatbot nữa.
