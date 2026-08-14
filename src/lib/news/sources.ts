export interface ConfiguredNewsSource {
  slug: string;
  name: string;
  feedUrl: string;
  /** Trang chủ tòa soạn. Đây là KHÓA PHÂN BIỆT BÁO, không chỉ là đường dẫn
   *  trang trí: nhiều chuyên mục của cùng một báo dùng chung giá trị này, và
   *  "So sánh nguồn" dựa vào nó để không ghép một báo với chính nó. */
  homepageUrl: string;
}

/**
 * RSS công khai do chính các tòa soạn cung cấp.
 *
 * TRƯỚC ĐÂY LÀ BA FEED TỔNG HỢP: tuoitre.vn/rss/tin-moi-nhat.rss,
 * thanhnien.vn/rss/home.rss, vnexpress.net/rss/tin-moi-nhat.rss.
 *
 * Đó là gốc rễ của việc hai tính năng "So sánh nguồn" và "Đối chiếu pháp luật"
 * gần như không bao giờ chạy được. Đo trên 267 bài lấy từ ba feed đó:
 *
 *   - 120 bài (45%) không phân loại được, rơi vào chủ đề "khac", keywords rỗng;
 *   - 0 bài nhắc tới số hiệu văn bản nào;
 *   - 0 bài khớp được luật hành vi nào trong VIOLATION_RULES;
 *   - chỉ 20 bài có báo khác cùng đưa tin.
 *
 * Kho văn bản thì gồm 69 nghị định, thông tư về XỬ PHẠT VI PHẠM HÀNH CHÍNH
 * trong an toàn thực phẩm, đất đai, giao thông, lao động, người tiêu dùng. Một
 * dòng tin đầy bóng đá, giải trí và tin quốc tế không có gì để đối chiếu với
 * kho đó. Không cách trình bày nào sửa được chuyện này — phải sửa ở đầu vào.
 *
 * Giờ lấy theo chuyên mục. Tất cả đường dẫn dưới đây đã gọi thử và đếm được
 * item thật: Tuổi Trẻ 50 bài mỗi feed, VnExpress 60 bài mỗi feed.
 */
export const DEFAULT_NEWS_SOURCES: readonly ConfiguredNewsSource[] = [
  {
    slug: "tuoi-tre-phap-luat",
    name: "Tuổi Trẻ · Pháp luật",
    feedUrl: "https://tuoitre.vn/rss/phap-luat.rss",
    homepageUrl: "https://tuoitre.vn/",
  },
  {
    slug: "tuoi-tre-kinh-doanh",
    name: "Tuổi Trẻ · Kinh doanh",
    feedUrl: "https://tuoitre.vn/rss/kinh-doanh.rss",
    homepageUrl: "https://tuoitre.vn/",
  },
  {
    slug: "tuoi-tre-xe",
    name: "Tuổi Trẻ · Xe",
    feedUrl: "https://tuoitre.vn/rss/xe.rss",
    homepageUrl: "https://tuoitre.vn/",
  },
  {
    slug: "tuoi-tre-suc-khoe",
    name: "Tuổi Trẻ · Sức khỏe",
    feedUrl: "https://tuoitre.vn/rss/suc-khoe.rss",
    homepageUrl: "https://tuoitre.vn/",
  },
  {
    slug: "vnexpress-phap-luat",
    name: "VnExpress · Pháp luật",
    feedUrl: "https://vnexpress.net/rss/phap-luat.rss",
    homepageUrl: "https://vnexpress.net/",
  },
  {
    slug: "vnexpress-kinh-doanh",
    name: "VnExpress · Kinh doanh",
    feedUrl: "https://vnexpress.net/rss/kinh-doanh.rss",
    homepageUrl: "https://vnexpress.net/",
  },
  {
    slug: "vnexpress-xe",
    name: "VnExpress · Xe",
    feedUrl: "https://vnexpress.net/rss/oto-xe-may.rss",
    homepageUrl: "https://vnexpress.net/",
  },
  {
    slug: "vnexpress-suc-khoe",
    name: "VnExpress · Sức khỏe",
    feedUrl: "https://vnexpress.net/rss/suc-khoe.rss",
    homepageUrl: "https://vnexpress.net/",
  },
  /*
   * Thanh Niên giữ lại feed tổng hợp vì toàn bộ RSS chuyên mục của họ đang trả
   * HTTP 500 và feed này cũng vậy. Giữ để khi phía họ khôi phục thì có báo thứ
   * ba cho việc so sánh nguồn — và trong lúc đó dải trạng thái nói thẳng là
   * nguồn này đang hỏng, thay vì im lặng bỏ qua.
   */
  {
    slug: "thanh-nien",
    name: "Thanh Niên",
    feedUrl: "https://thanhnien.vn/rss/home.rss",
    homepageUrl: "https://thanhnien.vn/",
  },
] as const;
