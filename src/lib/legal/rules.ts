import type postgres from "postgres";
import type { NewsTopic } from "../../types/news";
import type { RetrievalResult } from "../retrieval";

export interface ViolationRule {
  id: string;
  label: string;
  topic: NewsTopic;
  test: (normalizedScenario: string) => boolean;
  source: { soHieu: string; dieu: number; khoan?: number; diem?: string };
}

export interface MatchedViolationRule {
  id: string;
  label: string;
  topic: NewsTopic;
  source: ViolationRule["source"];
}

export const VIOLATION_RULES: readonly ViolationRule[] = [
  rule(
    "expired-chemical",
    "Sử dụng chất hoặc hóa chất quá hạn/không có thời hạn sử dụng",
    (text) => /(?:chất|hóa chất)/.test(text) && /(?:quá|hết) (?:thời )?hạn|không có thời hạn sử dụng/.test(text),
    { soHieu: "115/2018/NĐ-CP", dieu: 6, khoan: 1 },
  ),
  rule(
    "seafood-adulterant",
    "Trực tiếp đưa tạp chất vào thủy sản",
    (text) => /(?:đưa|trộn|bơm).{0,30}tạp chất.{0,30}thủy sản/.test(text),
    { soHieu: "124/2021/NĐ-CP", dieu: 1, khoan: 5 },
  ),
  rule(
    "expired-food-sale",
    "Bán thực phẩm đã quá hạn sử dụng",
    (text) => /(?:bán|kinh doanh|lưu thông).{0,50}thực phẩm.{0,30}(?:quá|hết) hạn/.test(text),
    { soHieu: "38/2012/NĐ-CP", dieu: 17, khoan: 2 },
  ),
  rule(
    "packaged-food-label",
    "Thực phẩm bao gói sẵn không ghi nhãn theo quy định",
    (text) => /(?:thực phẩm )?bao gói sẵn/.test(text) && /(?:không|thiếu).{0,15}(?:ghi )?nhãn/.test(text),
    { soHieu: "38/2012/NĐ-CP", dieu: 18, khoan: 1 },
  ),
  rule(
    "sick-food-handler",
    "Người trực tiếp chế biến thức ăn đang mắc bệnh thuộc danh mục hạn chế",
    (text) => /(?:người|nhân viên).{0,30}(?:chế biến|nấu).{0,30}(?:tả|lỵ|thương hàn|viêm gan|lao phổi|tiêu chảy)/.test(text),
    { soHieu: "124/2021/NĐ-CP", dieu: 1, khoan: 7 },
  ),
  rule(
    "unsafe-mixed-transport",
    "Vận chuyển chung thực phẩm với hàng hóa có nguy cơ gây ô nhiễm",
    (text) => /vận chuyển chung/.test(text) && /thực phẩm/.test(text) && /(?:ô nhiễm|hàng hóa khác)/.test(text),
    { soHieu: "124/2021/NĐ-CP", dieu: 1, khoan: 4 },
  ),
  rule(
    "expired-ad-confirmation",
    "Quảng cáo sản phẩm thực phẩm khi xác nhận nội dung đã hết hiệu lực",
    (text) => /quảng cáo/.test(text) && /(?:xác nhận|giấy).{0,25}(?:quá|hết) (?:thời hạn|hiệu lực)/.test(text),
    { soHieu: "75/2011/TT-BNNPTNT", dieu: 11, khoan: 1 },
  ),
  ruleForTopic(
    "late-or-unpaid-wages",
    "Trả lương không đúng hạn, không trả hoặc trả không đủ tiền lương",
    "lao_dong",
    (text) => /(?:chậm|không|thiếu).{0,25}(?:trả )?(?:tiền )?lương|khấu trừ.{0,20}lương/.test(text),
    { soHieu: "12/2022/NĐ-CP", dieu: 17, khoan: 2 },
  ),
  ruleForTopic(
    "motorbike-red-light",
    "Người điều khiển xe mô tô, xe gắn máy không chấp hành đèn tín hiệu giao thông",
    "giao_thong",
    (text) => /(?:xe máy|xe mô tô|xe gắn máy).{0,40}(?:vượt|không chấp hành).{0,20}(?:đèn đỏ|đèn tín hiệu)/.test(text),
    { soHieu: "168/2024/NĐ-CP", dieu: 7, khoan: 7, diem: "c" },
  ),
  ruleForTopic(
    "motorbike-no-helmet",
    "Người điều khiển xe mô tô, xe gắn máy không đội mũ bảo hiểm đúng quy cách",
    "giao_thong",
    (text) => /(?:xe máy|xe mô tô|xe gắn máy).{0,40}không đội.{0,20}mũ bảo hiểm/.test(text),
    { soHieu: "168/2024/NĐ-CP", dieu: 7, khoan: 2, diem: "h" },
  ),
  ruleForTopic(
    "land-encroachment",
    "Lấn đất hoặc chiếm đất",
    "dat_dai_nha_o",
    (text) => /(?:lấn|chiếm).{0,15}đất/.test(text),
    { soHieu: "123/2024/NĐ-CP", dieu: 13 },
  ),
  ruleForTopic(
    "consumer-warranty",
    "Không thực hiện đầy đủ trách nhiệm bảo hành sản phẩm, hàng hóa",
    "nguoi_tieu_dung",
    (text) => /(?:từ chối|không|chậm|né).{0,25}bảo hành|bảo hành.{0,25}(?:không|chậm|nhiều lần)/.test(text),
    { soHieu: "19/2023/QH15", dieu: 30 },
  ),
] as const;

export function matchViolationRules(scenario: string): MatchedViolationRule[] {
  const normalized = scenario.normalize("NFKC").toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();
  return VIOLATION_RULES.filter((item) => item.test(normalized)).map(({ id, label, topic, source }) => ({
    id,
    label,
    topic,
    source,
  }));
}

export async function resolveRuleEvidence(
  sql: postgres.Sql,
  matches: MatchedViolationRule[],
): Promise<RetrievalResult[]> {
  const evidence: RetrievalResult[] = [];
  for (const match of matches) {
    const rows = await sql<
      Array<{
        chunk_id: string;
        document_id: string;
        node_id: string | null;
        so_hieu: string | null;
        breadcrumb: string;
        content: string;
      }>
    >`
      SELECT c.id AS chunk_id, c.document_id, c.node_id, d.so_hieu,
             c.duong_dan AS breadcrumb, c.noi_dung AS content
      FROM chunks c
      JOIN documents d ON d.id = c.document_id
      WHERE c.strategy = 'structural'
        AND d.retrieval_enabled = true
        AND d.so_hieu = ${match.source.soHieu}
        AND c.dieu_so = ${match.source.dieu}
        AND (${match.source.khoan ?? null}::int IS NULL OR c.khoan_so = ${match.source.khoan ?? null}::int)
        AND (${match.source.diem ?? null}::text IS NULL OR c.diem = ${match.source.diem ?? null}::text)
      ORDER BY length(c.noi_dung) DESC
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) continue;
    evidence.push({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      nodeId: row.node_id,
      soHieu: row.so_hieu,
      breadcrumb: row.breadcrumb,
      content: row.content,
      score: 1,
      fulltextScore: 1,
    });
  }
  return evidence;
}

function rule(
  id: string,
  label: string,
  test: ViolationRule["test"],
  source: ViolationRule["source"],
): ViolationRule {
  return { id, label, topic: "an_toan_thuc_pham", test, source };
}

function ruleForTopic(
  id: string,
  label: string,
  topic: NewsTopic,
  test: ViolationRule["test"],
  source: ViolationRule["source"],
): ViolationRule {
  return { id, label, topic, test, source };
}
