export interface ConfiguredNewsSource {
  slug: string;
  name: string;
  feedUrl: string;
  homepageUrl: string;
}

/** RSS công khai do chính các tòa soạn cung cấp. */
export const DEFAULT_NEWS_SOURCES: readonly ConfiguredNewsSource[] = [
  {
    slug: "tuoi-tre",
    name: "Tuổi Trẻ",
    feedUrl: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
    homepageUrl: "https://tuoitre.vn/",
  },
  {
    slug: "thanh-nien",
    name: "Thanh Niên",
    feedUrl: "https://thanhnien.vn/rss/home.rss",
    homepageUrl: "https://thanhnien.vn/",
  },
  {
    slug: "vnexpress",
    name: "VnExpress",
    feedUrl: "https://vnexpress.net/rss/tin-moi-nhat.rss",
    homepageUrl: "https://vnexpress.net/",
  },
] as const;
