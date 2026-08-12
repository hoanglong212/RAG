export const NEWS_TOPICS = [
  "phap_luat",
  "kinh_te",
  "lao_dong",
  "dat_dai_nha_o",
  "giao_thong",
  "giao_duc",
  "y_te",
  "an_toan_thuc_pham",
  "moi_truong",
  "cong_nghe",
  "nong_nghiep",
  "nguoi_tieu_dung",
  "van_hoa_giai_tri",
  "the_thao",
  "quoc_te",
  "xa_hoi",
  "khac",
] as const;

export type NewsTopic = (typeof NEWS_TOPICS)[number];

export interface NewsArticleSummary {
  id: string;
  source: { slug: string; name: string; homepageUrl: string };
  title: string;
  summary: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  topics: NewsTopic[];
  keywords: string[];
  locations: string[];
}

export type LegalCheckStatus = "matched" | "insufficient_corpus" | "no_match" | "evidence_only";
