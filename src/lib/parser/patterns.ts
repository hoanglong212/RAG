/**
 * Toan bo regex nhan dang cau truc van ban hanh chinh, tap trung mot cho.
 *
 * P       — bo mau goc theo PLAN.md muc 7.1, dung de nhan dien nhanh (co co `i`, `m`).
 * P_CHAT  — ban chat che hon, phan biet HOA/thuong, dung de xac nhan mot dong
 *           that su la tieu de chu khong phai chu "Dieu" nam giua cau (bay so 10).
 */

export const P = {
  chuong: /^\s*Chương\s+([IVXLCDM]+)\s*[.:-]?\s*(.*)$/im,
  muc: /^\s*Mục\s+(\d+)\s*[.:-]?\s*(.*)$/im,
  dieu: /^\s*Điều\s+(\d+)\s*[.:]?\s*(.*)$/im,
  khoan: /^\s*(\d+)\s*[.)]\s+(.+)$/m,
  diem: /^\s*([a-zđăâêôơưuý])\s*\)\s+(.+)$/im,

  soHieu: /\b(\d{1,4})\/(\d{4})\/([A-ZĐ]+(?:-[A-ZĐ]+)*)\b/,
  ngay: /ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i,

  // tham chieu cheo — bat de lam tinh nang nang cao
  thamChieu:
    /(?:khoản\s+(\d+)\s+)?Điều\s+(\d+)(?:\s+(?:của\s+)?(Nghị định|Thông tư|Luật|Quyết định)\s+số\s*([\d/A-ZĐ-]+))?/gi,
} as const;

/**
 * Mau bo sung. Ly do ton tai tung cai ghi ngay tai cho.
 */
export const P_CHAT = {
  /**
   * Tieu de Dieu that su. Khac P.dieu o hai diem:
   *  - phan biet HOA/thuong (khong khop "dieu 5")
   *  - sau so phai la dau . hoac : roi moi toi tieu de; neu khong co dau thi
   *    dong phai ket thuc ngay. Nho vay "Điều 5 nêu trên không áp dụng..." bi loai.
   */
  dieu: /^Điều\s+(\d+)\s*(?:([.:])\s*(.*))?$/,
  chuong: /^Chương\s+([IVXLCDM]+)\s*[.:-]?\s*(.*)$/,
  muc: /^Mục\s+(\d+)\s*[.:-]?\s*(.*)$/,
  /** Khoan: toi da 2 chu so, bat buoc co noi dung phia sau. */
  khoan: /^(\d{1,2})\s*[.)]\s+(\S.*)$/,
  /** Diem: chi cac chu cai co trong bang chu cai tieng Viet (xem THU_TU_DIEM). */
  diem: /^([a-zđăâêôơư])\s*\)\s+(\S.*)$/i,
  phuLuc: /^(PHỤ\s*LỤC|Phụ\s*lục)\b[.:]?\s*(.*)$/,

  /** "có hiệu lực thi hành kể từ ngày 01 tháng 7 năm 2020" */
  hieuLuc:
    /hiệu\s+lực(?:\s+thi\s+hành)?\s+(?:kể\s+)?từ\s+ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i,
  /** So hieu cua Luat / Nghi quyet Quoc hoi: 59/2020/QH14 — P.soHieu khong bat duoc vi co chu so. */
  soHieuQuocHoi: /\b(\d{1,4})\/(\d{4})\/(QH\d{1,2})\b/,

  /** Dong rac dau/cuoi trang PDF: so trang tran, "Trang 3", "3/40". */
  dongRac: /^(?:\d{1,3}|Trang\s+\d{1,3}(?:\s*\/\s*\d{1,3})?|\d{1,3}\s*\/\s*\d{1,3})$/i,
  /** Dong ket thuc mot cau — dieu kien de dong ke tiep duoc coi la tieu de. */
  ketCau: /[.:;!?”"')]$/,
  /** Cat cau de chia nho chunk qua dai. */
  ranhCau: /(?<=[.;!?])\s+(?=[«"“(]?\p{Lu}|\d)/u,
} as const;

export const LOAI_VAN_BAN = [
  "Nghị định",
  "Thông tư",
  "Thông tư liên tịch",
  "Quyết định",
  "Nghị quyết",
  "Luật",
  "Pháp lệnh",
  "Chỉ thị",
  "Công văn",
  "Kế hoạch",
] as const;

/**
 * Suy ra loai van ban tu ma trong so hieu khi phan dau van ban khong ghi ro.
 * Vi du 15/2020/NĐ-CP -> ma "NĐ" -> Nghi dinh.
 */
export const MA_LOAI_VAN_BAN: Readonly<Record<string, (typeof LOAI_VAN_BAN)[number]>> = {
  NĐ: "Nghị định",
  TT: "Thông tư",
  TTLT: "Thông tư liên tịch",
  QĐ: "Quyết định",
  NQ: "Nghị quyết",
  L: "Luật",
  PL: "Pháp lệnh",
  CT: "Chỉ thị",
  CV: "Công văn",
  KH: "Kế hoạch",
};

/**
 * Thu tu bang chu cai dung danh so Diem trong van ban phap quy Viet Nam.
 * Khong co f, j, w, z. Khong dung localeCompare mac dinh vi no xep sai cho "đ".
 */
export const THU_TU_DIEM = [
  "a", "b", "c", "d", "đ", "e", "ê", "g", "h", "i", "k", "l", "m", "n",
  "o", "ô", "ơ", "p", "q", "r", "s", "t", "u", "ư", "v", "x", "y",
] as const;

/** Nhung dong sao ngu trong phan dau van ban, khong phai co quan ban hanh. */
export const DONG_QUOC_HIEU = [
  "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
  "CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM",
  "ĐỘC LẬP - TỰ DO - HẠNH PHÚC",
  "Độc lập - Tự do - Hạnh phúc",
] as const;

/** Nguong token cua mot chunk truoc khi phai cat nho hon (PLAN.md muc 7.2). */
export const NGUONG_TOKEN = 800;
