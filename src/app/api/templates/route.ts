import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const TEMPLATES = [
  { id: "warranty", name: "Yêu cầu thực hiện bảo hành", fields: ["fullName", "address", "seller", "product", "purchaseDate", "request"] },
  { id: "salary", name: "Yêu cầu thanh toán tiền lương", fields: ["fullName", "employer", "period", "amount", "request"] },
  { id: "complaint", name: "Đơn khiếu nại", fields: ["fullName", "address", "recipient", "facts", "request"] },
] as const;

const schema = z.object({
  templateId: z.enum(["warranty", "salary", "complaint"]),
  fields: z.record(z.string(), z.string().trim().max(2_000)),
  /**
   * Căn cứ và chứng cứ kèm theo, lấy từ hồ sơ đã lưu. Trước đây mục này in
   * cứng "[Liệt kê chứng cứ]" và người dùng phải gõ lại tay đúng những điều
   * khoản hệ thống vừa tìm ra cho họ.
   */
  attachments: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
});

export async function GET() { return NextResponse.json(TEMPLATES); }

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu biểu mẫu không hợp lệ." }, { status: 400 });
  const f = parsed.data.fields;
  const kem = parsed.data.attachments;
  const text = parsed.data.templateId === "warranty"
    ? render("YÊU CẦU THỰC HIỆN BẢO HÀNH", f.seller, f.fullName, f.address,
        `Tôi đã mua sản phẩm ${f.product || "[sản phẩm]"} vào ngày ${f.purchaseDate || "[ngày mua]"}.\n\nYêu cầu: ${f.request || "Đề nghị thực hiện đầy đủ trách nhiệm bảo hành theo thỏa thuận và quy định pháp luật."}`, kem)
    : parsed.data.templateId === "salary"
      ? render("YÊU CẦU THANH TOÁN TIỀN LƯƠNG", f.employer, f.fullName, f.address,
          `Kỳ lương liên quan: ${f.period || "[kỳ lương]"}. Số tiền ước tính còn thiếu: ${f.amount || "[số tiền]"}.\n\nYêu cầu: ${f.request || "Đề nghị thanh toán đầy đủ và phản hồi bằng văn bản."}`, kem)
      : render("ĐƠN KHIẾU NẠI", f.recipient, f.fullName, f.address,
          `Nội dung sự việc:\n${f.facts || "[Mô tả sự việc]"}\n\nYêu cầu giải quyết:\n${f.request || "[Nêu yêu cầu]"}`, kem);
  return NextResponse.json({ text, notice: "Đây là bản nháp hỗ trợ soạn thảo. Người dùng cần kiểm tra thông tin, thẩm quyền và hồ sơ kèm theo trước khi gửi." });
}

function render(
  title: string,
  recipient = "[Cơ quan/tổ chức nhận]",
  name = "[Họ tên]",
  address = "[Địa chỉ]",
  body = "",
  attachments: string[] = [],
) {
  const kem = attachments.length > 0
    ? attachments.map((a, i) => `${i + 1}. ${a}`).join("\n")
    : "[Liệt kê chứng cứ]";
  return `${title}\n\nKính gửi: ${recipient || "[Cơ quan/tổ chức nhận]"}\n\nTôi là: ${name || "[Họ tên]"}\nĐịa chỉ: ${address || "[Địa chỉ]"}\n\n${body}\n\nTài liệu và căn cứ kèm theo:\n${kem}\n\nNgười làm đơn\n(Ký và ghi rõ họ tên)\n${name || "[Họ tên]"}`;
}
