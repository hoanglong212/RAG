import type { NewsTopic } from "../../types/news";

const TOPIC_KEYWORDS: Record<Exclude<NewsTopic, "khac">, string[]> = {
  phap_luat: ["pháp luật", "khởi tố", "bắt giữ", "tòa án", "xét xử", "vi phạm", "mức phạt", "xử phạt"],
  kinh_te: ["kinh tế", "ngân hàng", "lãi suất", "chứng khoán", "doanh nghiệp", "thị trường", "đầu tư"],
  lao_dong: ["lao động", "tiền lương", "bảo hiểm xã hội", "thất nghiệp", "công đoàn", "người lao động"],
  dat_dai_nha_o: ["đất đai", "bất động sản", "nhà ở", "chung cư", "sổ đỏ", "quy hoạch", "dự án nhà"],
  giao_thong: ["giao thông", "tai nạn", "đường bộ", "ô tô", "xe máy", "nồng độ cồn", "giấy phép lái xe"],
  giao_duc: ["giáo dục", "học sinh", "sinh viên", "đại học", "tuyển sinh", "trường học", "giáo viên"],
  y_te: ["y tế", "bệnh viện", "bác sĩ", "bệnh nhân", "dịch bệnh", "thuốc", "sức khỏe"],
  an_toan_thuc_pham: [
    "an toàn thực phẩm", "ngộ độc thực phẩm", "thực phẩm bẩn", "thực phẩm giả",
    "phụ gia", "hết hạn sử dụng", "thu hồi thực phẩm", "vệ sinh thực phẩm",
  ],
  moi_truong: ["môi trường", "ô nhiễm", "khí thải", "nước thải", "rác thải", "biến đổi khí hậu", "sạt lở"],
  cong_nghe: ["công nghệ", "trí tuệ nhân tạo", "ai", "dữ liệu cá nhân", "an ninh mạng", "phần mềm", "internet"],
  nong_nghiep: ["nông nghiệp", "nông dân", "chăn nuôi", "thủy sản", "trồng trọt", "nông sản", "dịch tả lợn"],
  nguoi_tieu_dung: ["người tiêu dùng", "hàng giả", "bảo vệ quyền lợi", "quảng cáo sai", "sản phẩm lỗi", "khiếu nại"],
  van_hoa_giai_tri: ["văn hóa", "giải trí", "nghệ sĩ", "ca sĩ", "điện ảnh", "âm nhạc", "lễ hội"],
  the_thao: ["thể thao", "bóng đá", "vận động viên", "giải đấu", "đội tuyển", "world cup"],
  quoc_te: ["quốc tế", "thế giới", "liên hợp quốc", "châu âu", "hoa kỳ", "trung quốc", "nga", "ukraine"],
  xa_hoi: ["xã hội", "dân sinh", "cộng đồng", "đời sống", "cứu trợ", "dân cư", "địa phương"],
};

const KEYWORD_LABELS = [...new Set(Object.values(TOPIC_KEYWORDS).flat())];

export function classifyNews(text: string): { topics: NewsTopic[]; keywords: string[] } {
  const normalized = normalize(text);
  const scored = Object.entries(TOPIC_KEYWORDS)
    .map(([topic, keywords]) => ({
      topic: topic as NewsTopic,
      score: keywords.filter((keyword) => containsKeyword(normalized, keyword)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.topic.localeCompare(right.topic));
  const topics = scored.slice(0, 4).map((item) => item.topic);
  const keywords = KEYWORD_LABELS
    .filter((keyword) => containsKeyword(normalized, keyword))
    .slice(0, 12);
  return { topics: topics.length > 0 ? topics : ["khac"], keywords };
}

export function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("vi").replace(/\s+/g, " ").trim();
}

function containsKeyword(text: string, keyword: string): boolean {
  const needle = normalize(keyword);
  if (needle.length > 3 || needle.includes(" ")) return text.includes(needle);
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(needle)}([^\\p{L}\\p{N}]|$)`, "u").test(text);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
