import type { NewsTopic } from "@/types/news";

const TOPIC_FACTS: Partial<Record<NewsTopic, string[]>> = {
  giao_thong: [
    "Loại phương tiện và người trực tiếp điều khiển",
    "Có tai nạn, thiệt hại hoặc tình tiết tăng nặng hay không",
  ],
  lao_dong: [
    "Loại hợp đồng, kỳ trả lương và số tiền còn thiếu",
    "Người sử dụng lao động đã thông báo lý do hoặc thời hạn thanh toán chưa",
  ],
  an_toan_thuc_pham: [
    "Loại sản phẩm, số lượng hoặc giá trị hàng hóa liên quan",
    "Hậu quả sức khỏe và kết quả kiểm nghiệm nếu có",
  ],
  dat_dai_nha_o: [
    "Loại đất, diện tích và giấy tờ về quyền sử dụng đất",
    "Mốc giới, thời điểm bắt đầu sử dụng và cơ quan quản lý địa phương",
  ],
  nguoi_tieu_dung: [
    "Ngày mua, chứng từ, điều kiện bảo hành và giá trị sản phẩm",
    "Nội dung trao đổi hoặc phản hồi của bên bán",
  ],
};

export function buildMissingFacts(scenario: string, topics: NewsTopic[]): string[] {
  const normalized = scenario.toLocaleLowerCase("vi");
  const facts: string[] = [];
  if (!/\b(?:ngày|tháng|năm|hôm|lúc|khi)\b/.test(normalized)) {
    facts.push("Thời điểm sự việc xảy ra để xác định văn bản đang có hiệu lực");
  }
  if (!/\b(?:tại|ở|đường|phường|xã|quận|huyện|tỉnh|thành phố|công ty|cửa hàng)\b/.test(normalized)) {
    facts.push("Địa điểm và cơ quan có thẩm quyền liên quan");
  }
  for (const topic of topics) facts.push(...(TOPIC_FACTS[topic] ?? []));
  facts.push("Tài liệu, hình ảnh, hợp đồng, hóa đơn hoặc biên bản có thể chứng minh sự việc");
  return [...new Set(facts)].slice(0, 6);
}

export function buildNextSteps(hasEvidence: boolean): string[] {
  return hasEvidence
    ? [
        "Đối chiếu lại thời điểm hiệu lực và phạm vi áp dụng của từng căn cứ",
        "Thu thập các chứng cứ tương ứng với những dữ kiện còn thiếu",
        "Liên hệ cơ quan có thẩm quyền hoặc người hành nghề luật khi cần kết luận chính thức",
      ]
    : [
        "Bổ sung các dữ kiện còn thiếu và thử đối chiếu lại",
        "Tra cứu trực tiếp nguồn văn bản chính thức theo chủ đề",
        "Không sử dụng kết quả hiện tại làm kết luận pháp lý",
      ];
}
