import { z } from "zod";
import type { Citation } from "../../types/contract";
import { NEWS_TOPICS, type LegalCheckStatus, type NewsTopic } from "../../types/news";
import { classifyNews } from "../news/classifier";
import { phanTichTinhHuong, streamGroundedAnswer } from "../llm/provider";
import { timKiem } from "../retrieval";
import { matchViolationRules, resolveRuleEvidence, type MatchedViolationRule } from "./rules";

/**
 * Khuôn phân tích có cấu trúc.
 *
 * Kiểm bằng zod chứ không tin thẳng JSON của LLM: mô hình vẫn có thể trả
 * thiếu trường hoặc bịa số dẫn chứng, và một trang trắng vì `undefined.map`
 * thì tệ hơn là quay về câu trả lời văn xuôi.
 */
const mocSchema = z.object({
  moc: z.string().trim().min(1),
  suKien: z.string().trim().min(1),
  heQua: z.string().trim().default(""),
  danChung: z.array(z.number().int().positive()).default([]),
});

const phanTichSchema = z.object({
  ketLuan: z.string().trim().min(1),
  mucDoChacChan: z.enum(["cao", "trung_binh", "thap"]).default("thap"),
  lyDoChacChan: z.string().trim().default(""),
  dongThoiGian: z.array(mocSchema).default([]),
  viecCanLam: z.array(z.string().trim().min(1)).default([]),
  chungCuCanGiu: z.array(z.string().trim().min(1)).default([]),
  diemYeu: z.array(z.string().trim().min(1)).default([]),
  ngoaiPhamVi: z.string().trim().min(1).nullable().default(null),
});

export type PhanTichTinhHuong = z.infer<typeof phanTichSchema>;

export interface LegalCheckResult {
  status: LegalCheckStatus;
  detectedTopics: NewsTopic[];
  supportedTopics: NewsTopic[];
  answer: string | null;
  /** Bản phân tích có cấu trúc; null khi mô hình không trả đúng khuôn. */
  phanTich: PhanTichTinhHuong | null;
  /**
   * Vì sao không có bản phân tích. Nuốt im lặng thì người dùng chỉ thấy kết
   * quả tự nhiên nghèo đi mà không biết là tạm thời hay vĩnh viễn.
   */
  loiPhanTich: string | null;
  citations: Citation[];
  topScore: number;
  matchedRules: MatchedViolationRule[];
  disclaimer: string;
}

export async function checkLegalScenario(
  scenario: string,
  requestedTopic?: NewsTopic,
): Promise<LegalCheckResult> {
  const detected = classifyNews(scenario).topics;
  const detectedTopics = requestedTopic ? [requestedTopic] : detected;
  const supportedTopics = readSupportedTopics();
  const activeTopics = detectedTopics.filter((topic) => supportedTopics.includes(topic));
  const disclaimer =
    "Kết quả chỉ là đối chiếu sơ bộ từ corpus hiện có, không phải kết luận vi phạm hoặc tư vấn pháp lý.";

  /*
   * KHÔNG chặn theo chủ đề nữa.
   *
   * Bộ phân loại chủ đề đoán từ câu chữ, và nó đoán sai thường xuyên: một
   * tranh chấp đặt cọc mua nhà bị xếp vào "kinh tế", một vụ mượn xe rồi đem
   * bán bị xếp vào "khác". Trước đây gặp chủ đề ngoài danh sách là trả về
   * ngõ cụt "corpus chưa hỗ trợ", trong khi kho VẪN có điều khoản dùng được
   * — chọn tay đúng chủ đề là ra ngay.
   *
   * Giờ chủ đề chỉ còn là gợi ý để thu hẹp khi nó chắc chắn. Đoán không
   * trúng chủ đề nào được hỗ trợ thì tìm trên toàn kho, rồi để NGƯỠNG ĐIỂM
   * quyết định có đủ căn cứ hay không. Ngưỡng là thứ đo được; nhãn chủ đề
   * thì không.
   */
  const locTheoChuDe = activeTopics.length > 0 ? activeTopics : undefined;

  const question = `Tình huống: ${scenario}\nHãy xác định dấu hiệu hành vi có thể liên quan, quy định tương ứng và các dữ kiện còn thiếu để có thể kết luận.`;
  // Retrieval chỉ dùng sự kiện gốc; câu hướng dẫn dài sẽ làm loãng embedding của hành vi.
  const matchedRules = matchViolationRules(scenario);
  const scopedRules = matchedRules.filter((rule) => activeTopics.includes(rule.topic));
  const retrieved = await timKiem(scenario, {
    mode: "hybrid",
    strategy: "structural",
    topK: 8,
    candidateK: 80,
    lexicalWeight: 1,
    legalTopics: locTheoChuDe,
  });
  const ruleEvidence = scopedRules.length === 0
    ? []
    : await resolveRuleEvidence((await import("../db/client")).sql, scopedRules);
  // Rule đã được kiểm chứng theo locator thì không trộn văn bản cũ có nội dung tương tự.
  const results = ruleEvidence.length > 0 ? ruleEvidence : retrieved;
  const topScore = results[0]?.score ?? 0;
  const threshold = readThreshold();
  if (topScore < threshold) {
    return {
      status: "no_match",
      detectedTopics,
      supportedTopics,
      answer: null,
      phanTich: null,
      loiPhanTich: null,
      citations: [],
      topScore,
      matchedRules: scopedRules,
      disclaimer,
    };
  }
  const citations: Citation[] = results.map((result) => ({
    chunkId: result.chunkId,
    documentId: result.documentId,
    nodeId: result.nodeId ?? "",
    soHieu: result.soHieu ?? "Không rõ số hiệu",
    breadcrumb: result.breadcrumb,
    trichDoan: result.content.slice(0, 500),
    score: result.score,
  }));
  const doanTrich = results.map((result, index) => ({
    index: index + 1,
    source: `${result.soHieu ?? "Không rõ số hiệu"} > ${result.breadcrumb}`,
    content: result.content,
  }));

  // Phân tích có cấu trúc chạy trước; văn xuôi chỉ còn là phương án dự phòng.
  const { ket: phanTich, loi: loiPhanTich } = await docPhanTich(
    scenario,
    doanTrich,
    citations.length,
  );
  if (phanTich) {
    return {
      status: "matched",
      detectedTopics,
      supportedTopics,
      answer: null,
      phanTich,
      loiPhanTich: null,
      citations,
      topScore,
      matchedRules: scopedRules,
      disclaimer,
    };
  }

  try {
    let answer = "";
    for await (const token of streamGroundedAnswer({ question, passages: doanTrich })) {
      answer += token;
    }
    if (!answer.trim() || answer.trim() === "KHÔNG_TÌM_THẤY") {
      return { status: "evidence_only", detectedTopics, supportedTopics, answer: null, phanTich: null, loiPhanTich, citations, topScore, matchedRules: scopedRules, disclaimer };
    }
    return { status: "matched", detectedTopics, supportedTopics, answer, phanTich: null, loiPhanTich, citations, topScore, matchedRules: scopedRules, disclaimer };
  } catch (error) {
    // Văn xuôi hỏng nốt: báo lý do của bước phân tích, hoặc của chính lần này.
    return { status: "evidence_only", detectedTopics, supportedTopics, answer: null, phanTich: null, loiPhanTich: loiPhanTich ?? docLoiPhanTich(error), citations, topScore, matchedRules: scopedRules, disclaimer };
  }
}

/**
 * Gọi mô hình lấy bản phân tích, kiểm khuôn, và LỌC BỎ số dẫn chứng vượt
 * ngoài danh sách trích dẫn thật — mô hình hay trả [9] khi chỉ có 8 đoạn,
 * và một dẫn chứng trỏ vào hư vô còn tệ hơn không dẫn.
 */
/** Chuyển lỗi kỹ thuật thành câu người dùng đọc được và biết phải chờ hay sửa. */
function docLoiPhanTich(error: unknown): string {
  const tin = error instanceof Error ? error.message : String(error);
  // Bỏ dấu chấm cuối câu mà nhóm bắt nuốt phải: "55m52.32s." → "55m52.32s".
  const cho = /try again in ([0-9hms.]+)/i.exec(tin)?.[1]?.replace(/\.+$/, "");
  if (/rate_limit|429/i.test(tin)) {
    return `Hết hạn mức token trong ngày của nhà cung cấp LLM${cho ? `, thử lại sau ${cho}` : ""}. Phần căn cứ bên dưới vẫn tra được bình thường vì nó không dùng LLM.`;
  }
  if (/GROQ_API_KEY|LLM_API_KEY|LLM_MODEL/i.test(tin)) {
    return "Chưa cấu hình khoá LLM, nên bước phân tích bị bỏ qua.";
  }
  if (/vượt giới hạn token/i.test(tin)) {
    return "Bản phân tích dài quá mức cho phép nên bị cắt. Hãy rút gọn mô tả tình huống.";
  }
  if (/timeout|abort|ECONNREFUSED|fetch/i.test(tin)) {
    return "Không gọi được dịch vụ LLM. Phần căn cứ bên dưới vẫn dùng được.";
  }
  return "Không dựng được bản phân tích cho tình huống này.";
}

async function docPhanTich(
  scenario: string,
  doanTrich: Array<{ index: number; source: string; content: string }>,
  soTrichDan: number,
): Promise<{ ket: PhanTichTinhHuong | null; loi: string | null }> {
  try {
    const tho = await phanTichTinhHuong(scenario, doanTrich);
    const kq = phanTichSchema.safeParse(tho);
    if (!kq.success) {
      return { ket: null, loi: "Mô hình trả về bản phân tích không đúng khuôn." };
    }

    const dongThoiGian = kq.data.dongThoiGian.map((moc) => ({
      ...moc,
      danChung: moc.danChung.filter((n) => n >= 1 && n <= soTrichDan),
    }));

    /*
     * Chốt trung thực bằng code, không phó mặc lời nhắc.
     *
     * Nếu không mốc nào neo được vào một đoạn trích nào, nghĩa là kết luận
     * được dựng từ chính lời kể của người dùng chứ không từ văn bản trong
     * kho — dù mô hình có tự tin tới đâu. Trường hợp đó buộc hạ mức chắc
     * chắn và nói thẳng ra, vì đây đúng là chỗ một công cụ pháp lý dễ gây
     * hại nhất: một kết luận nghe chắc nịch mà không có căn cứ nào đỡ.
     */
    const khongMocNaoCoCanCu = dongThoiGian.every((moc) => moc.danChung.length === 0);
    const ngoaiPhamVi =
      kq.data.ngoaiPhamVi ??
      (khongMocNaoCoCanCu && dongThoiGian.length > 0
        ? "Không mốc nào trong diễn biến neo được vào văn bản có trong kho. Kết luận dưới đây dựng từ chính mô tả của bạn, chưa có điều khoản nào trong corpus trực tiếp chống lưng — hãy đối chiếu lại với văn bản gốc điều chỉnh quan hệ này trước khi dựa vào."
        : null);

    return {
      ket: {
        ...kq.data,
        dongThoiGian,
        ngoaiPhamVi,
        mucDoChacChan: ngoaiPhamVi ? "thap" : kq.data.mucDoChacChan,
      },
      loi: null,
    };
  } catch (error) {
    console.error(
      "[legal-check] phân tích có cấu trúc thất bại:",
      error instanceof Error ? error.message : error,
    );
    return { ket: null, loi: docLoiPhanTich(error) };
  }
}

export function readSupportedTopics(env: NodeJS.ProcessEnv = process.env): NewsTopic[] {
  const configured = env.LEGAL_CORPUS_TOPICS
    ?.split(",")
    .map((item) => item.trim())
    .filter((item): item is NewsTopic => NEWS_TOPICS.includes(item as NewsTopic));
  return configured?.length
    ? configured
    : ["an_toan_thuc_pham", "lao_dong", "giao_thong", "dat_dai_nha_o", "nguoi_tieu_dung"];
}

function readThreshold(): number {
  const value = Number(process.env.NGUONG_DIEM_TOI_THIEU ?? "0.35");
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.35;
}
