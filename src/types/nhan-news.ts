import type { LegalCheckStatus, NewsTopic } from "./news";

export const NHAN_CHU_DE_TIN: Record<NewsTopic, string> = {
  phap_luat: "Pháp luật",
  kinh_te: "Kinh tế",
  lao_dong: "Lao động",
  dat_dai_nha_o: "Đất đai, nhà ở",
  giao_thong: "Giao thông",
  giao_duc: "Giáo dục",
  y_te: "Y tế",
  an_toan_thuc_pham: "An toàn thực phẩm",
  moi_truong: "Môi trường",
  cong_nghe: "Công nghệ",
  nong_nghiep: "Nông nghiệp",
  nguoi_tieu_dung: "Người tiêu dùng",
  van_hoa_giai_tri: "Văn hóa, giải trí",
  the_thao: "Thể thao",
  quoc_te: "Quốc tế",
  xa_hoi: "Xã hội",
  khac: "Khác",
};

export const NHAN_KET_QUA_PHAP_LY: Record<LegalCheckStatus, string> = {
  matched: "Có quy định liên quan",
  evidence_only: "Có căn cứ để tự đối chiếu",
  no_match: "Chưa tìm thấy căn cứ đủ gần",
  insufficient_corpus: "Corpus chưa hỗ trợ chủ đề này",
};
