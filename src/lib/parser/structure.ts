/**
 * Chuan hoa van ban, tach cay cau truc Chuong / Muc / Dieu / Khoan / Diem,
 * roi sinh chunk theo quy tac o PLAN.md muc 7.2:
 *  - mot Khoan = mot chunk (mac dinh)
 *  - Dieu khong co Khoan  -> ca Dieu = mot chunk
 *  - Khoan > 800 token    -> cat tiep theo Diem
 *  - Diem  > 800 token    -> cat theo cau, danh co bi_cat_cung
 *  - khong bao gio de mot chunk bac cau qua hai Dieu khac nhau
 */
import {
  DONG_QUOC_HIEU,
  NGUONG_TOKEN,
  P,
  P_CHAT,
  THU_TU_DIEM,
} from "./patterns";
import type { CanhBao, ChunkParse, DocNodeParse, MetadataVanBan } from "./types";

export interface DongVanBan {
  text: string;
  trang: number;
  /** Chi so trong mang da chuan hoa, dung de bao vi tri trong canh bao. */
  so_dong: number;
}

export interface NutDiem {
  ky_hieu: string;
  trang: number;
  dong: DongVanBan[];
}

export interface NutKhoan {
  so: number;
  trang: number;
  /** Noi dung cua Khoan truoc Diem dau tien (cau dan). */
  dong: DongVanBan[];
  diem: NutDiem[];
}

export interface NutDieu {
  chuong: string | null;
  chuong_tieu_de: string | null;
  muc: string | null;
  muc_tieu_de: string | null;
  so: number;
  tieu_de: string | null;
  trang: number;
  /** Noi dung cua Dieu truoc Khoan dau tien. */
  mo_dau: DongVanBan[];
  khoan: NutKhoan[];
}

export interface KhoiPhuLuc {
  ten: string;
  trang: number;
  dong: DongVanBan[];
}

export interface CauTruc {
  dieu: NutDieu[];
  phu_luc: KhoiPhuLuc[];
  /** Phan dau van ban truoc Dieu dau tien (quoc hieu, can cu ban hanh...). */
  phan_dau: DongVanBan[];
  canh_bao: CanhBao[];
  so_trang: number;
}

/* ------------------------------------------------------------------ */
/* Chuan hoa                                                           */
/* ------------------------------------------------------------------ */

/**
 * NFC hoa toan bo van ban NGAY sau khi extract, gop khoang trang,
 * tach trang theo ky tu \f va cat bo so trang o dau/cuoi moi trang.
 * Nho buoc cuoi nay ma mot Dieu bi ngat qua hai trang van lien mach,
 * va dong "3" o chan trang khong bi hieu nham thanh Khoan 3.
 */
export function chuanHoaVanBan(raw: string): DongVanBan[] {
  const vanBan = raw
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ");

  const ketQua: DongVanBan[] = [];
  vanBan.split("\f").forEach((noiDungTrang, chiSo) => {
    const trang = chiSo + 1;
    const dong = noiDungTrang
      .split("\n")
      .map((d) => d.replace(/[ \t]+/g, " ").trim());

    let dau = 0;
    let cuoi = dong.length - 1;
    while (dau <= cuoi && laDongRac(dong[dau])) dau += 1;
    while (cuoi >= dau && laDongRac(dong[cuoi])) cuoi -= 1;

    for (let i = dau; i <= cuoi; i += 1) {
      ketQua.push({ text: dong[i], trang, so_dong: ketQua.length });
    }
  });
  return ketQua;
}

function laDongRac(d: string): boolean {
  return d === "" || P_CHAT.dongRac.test(d);
}

export function demSoTrang(raw: string): number {
  return raw.split("\f").length;
}

/* ------------------------------------------------------------------ */
/* Nhan dien tieu de                                                   */
/* ------------------------------------------------------------------ */

function laDongHoaToan(d: string): boolean {
  return /\p{L}/u.test(d) && d === d.toUpperCase();
}

/**
 * Mot dong chi duoc coi la tieu de Chuong/Muc/Dieu khi dong lien truoc no da ket thuc,
 * hoac chinh dong truoc do cung la mot tieu de.
 * Day la chot chan cho bay so 10: "... quy định tại\nĐiều 5 nêu trên".
 */
function dongTruocChoPhepTieuDe(
  dong: DongVanBan[],
  i: number,
  chiSoTieuDeCuoi: number,
): boolean {
  if (i === 0) return true;
  if (dong[i - 1].text === "") return true;
  let j = i - 1;
  while (j >= 0 && dong[j].text === "") j -= 1;
  if (j < 0) return true;
  if (j <= chiSoTieuDeCuoi) return true;
  const truoc = dong[j].text;
  // Dong bang bieu ("| ... |") hoac dong ket thuc bang chu so cung duoc coi la da het khoi.
  return (
    P_CHAT.ketCau.test(truoc) ||
    laDongHoaToan(truoc) ||
    truoc.includes("|") ||
    /\d$/.test(truoc)
  );
}

interface TieuDeDieu {
  so: number;
  tieu_de: string | null;
  /** true khi dong chi co "Điều 8" — tieu de nam o dong ke tiep. */
  cho_tieu_de: boolean;
}

function docTieuDeDieu(text: string): TieuDeDieu | null {
  if (!P.dieu.test(text)) return null;
  const m = P_CHAT.dieu.exec(text);
  if (!m) return null;
  const so = Number(m[1]);
  if (!Number.isInteger(so) || so <= 0) return null;
  const tieuDe = (m[3] ?? "").trim();
  return {
    so,
    tieu_de: tieuDe === "" ? null : tieuDe,
    cho_tieu_de: m[2] === undefined || tieuDe === "",
  };
}

/** Chuyen so La Ma sang so nguyen; tra null neu chuoi khong hop le. */
export function soLaMaSangSo(s: string): number | null {
  const gt: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let tong = 0;
  for (let i = 0; i < s.length; i += 1) {
    const hienTai = gt[s[i]];
    if (hienTai === undefined) return null;
    const keTiep = gt[s[i + 1]];
    tong += keTiep !== undefined && keTiep > hienTai ? -hienTai : hienTai;
  }
  return tong > 0 ? tong : null;
}

/* ------------------------------------------------------------------ */
/* Tach cau truc                                                       */
/* ------------------------------------------------------------------ */

export function tachCauTruc(dong: DongVanBan[], soTrang: number): CauTruc {
  const dieu: NutDieu[] = [];
  const phuLuc: KhoiPhuLuc[] = [];
  const phanDau: DongVanBan[] = [];
  const canhBao: CanhBao[] = [];

  let chuong: string | null = null;
  let chuongTieuDe: string | null = null;
  let muc: string | null = null;
  let mucTieuDe: string | null = null;
  let dieuHienTai: NutDieu | null = null;
  let khoanHienTai: NutKhoan | null = null;
  let diemHienTai: NutDiem | null = null;
  let khoiPhuLuc: KhoiPhuLuc | null = null;
  let dieuSoCuoi: number | null = null;
  /** Chi so dong cuoi cung da bi tieu thu lam tieu de (ke ca dong tieu de nam rieng). */
  let chiSoTieuDeCuoi = -1;

  const dongTiepTheoKhongRong = (i: number): DongVanBan | null => {
    for (let j = i + 1; j < dong.length; j += 1) {
      if (dong[j].text !== "") return dong[j];
    }
    return null;
  };

  const laTieuDeBatKy = (text: string): boolean =>
    P_CHAT.chuong.test(text) ||
    P_CHAT.muc.test(text) ||
    P_CHAT.dieu.test(text) ||
    P_CHAT.khoan.test(text) ||
    P_CHAT.diem.test(text) ||
    P_CHAT.phuLuc.test(text);

  for (let i = 0; i < dong.length; i += 1) {
    const d = dong[i];
    const text = d.text;
    if (text === "") continue;

    /* --- Phu luc: tu day tro di khong con thuoc Dieu nao --- */
    const mPhuLuc = P_CHAT.phuLuc.exec(text);
    if (mPhuLuc && dongTruocChoPhepTieuDe(dong, i, chiSoTieuDeCuoi)) {
      dieuHienTai = null;
      khoanHienTai = null;
      diemHienTai = null;
      let ten = `${mPhuLuc[1]} ${mPhuLuc[2] ?? ""}`.trim();
      if ((mPhuLuc[2] ?? "") === "") {
        const keTiep = dongTiepTheoKhongRong(i);
        if (keTiep && !laTieuDeBatKy(keTiep.text) && keTiep.text.length <= 200) {
          ten = `${mPhuLuc[1]} ${keTiep.text}`.trim();
          i = keTiep.so_dong;
        }
      }
      chiSoTieuDeCuoi = i;
      khoiPhuLuc = { ten, trang: d.trang, dong: [] };
      phuLuc.push(khoiPhuLuc);
      continue;
    }
    if (khoiPhuLuc) {
      khoiPhuLuc.dong.push(d);
      continue;
    }

    /* --- Chuong --- */
    const mChuong = P_CHAT.chuong.exec(text);
    if (
      mChuong &&
      soLaMaSangSo(mChuong[1]) !== null &&
      dongTruocChoPhepTieuDe(dong, i, chiSoTieuDeCuoi)
    ) {
      dieuHienTai = null;
      khoanHienTai = null;
      diemHienTai = null;
      muc = null;
      mucTieuDe = null;
      chuong = `Chương ${mChuong[1]}`;
      chuongTieuDe = mChuong[2].trim() || null;
      if (chuongTieuDe === null) {
        const keTiep = dongTiepTheoKhongRong(i);
        if (keTiep && !laTieuDeBatKy(keTiep.text) && keTiep.text.length <= 200) {
          chuongTieuDe = keTiep.text;
          i = keTiep.so_dong;
        }
      }
      chiSoTieuDeCuoi = i;
      continue;
    }

    /* --- Muc --- */
    const mMuc = P_CHAT.muc.exec(text);
    if (mMuc && dongTruocChoPhepTieuDe(dong, i, chiSoTieuDeCuoi)) {
      dieuHienTai = null;
      khoanHienTai = null;
      diemHienTai = null;
      muc = `Mục ${mMuc[1]}`;
      mucTieuDe = mMuc[2].trim() || null;
      if (mucTieuDe === null) {
        const keTiep = dongTiepTheoKhongRong(i);
        if (keTiep && !laTieuDeBatKy(keTiep.text) && keTiep.text.length <= 200) {
          mucTieuDe = keTiep.text;
          i = keTiep.so_dong;
        }
      }
      chiSoTieuDeCuoi = i;
      continue;
    }

    /* --- Dieu --- */
    const tieuDeDieu = docTieuDeDieu(text);
    if (
      tieuDeDieu &&
      dongTruocChoPhepTieuDe(dong, i, chiSoTieuDeCuoi) &&
      (dieuSoCuoi === null || tieuDeDieu.so > dieuSoCuoi)
    ) {
      let tenDieu = tieuDeDieu.tieu_de;
      if (tenDieu === null && tieuDeDieu.cho_tieu_de) {
        const keTiep = dongTiepTheoKhongRong(i);
        if (keTiep && !laTieuDeBatKy(keTiep.text) && keTiep.text.length <= 200) {
          tenDieu = keTiep.text;
          i = keTiep.so_dong;
        }
      }
      chiSoTieuDeCuoi = i;
      dieuHienTai = {
        chuong,
        chuong_tieu_de: chuongTieuDe,
        muc,
        muc_tieu_de: mucTieuDe,
        so: tieuDeDieu.so,
        tieu_de: tenDieu,
        trang: d.trang,
        mo_dau: [],
        khoan: [],
      };
      dieu.push(dieuHienTai);
      dieuSoCuoi = tieuDeDieu.so;
      khoanHienTai = null;
      diemHienTai = null;
      continue;
    }

    if (dieuHienTai === null) {
      phanDau.push(d);
      continue;
    }

    /* --- Khoan --- */
    // Khoan / Diem khong can chot chan "dong truoc da ket thuc" nhu Dieu:
    // tham chieu cheo trong cau khong bao gio bat dau dong bang "3." hay "a)".
    const mKhoan = P_CHAT.khoan.exec(text);
    if (mKhoan) {
      const so = Number(mKhoan[1]);
      const soCuoi = dieuHienTai.khoan.at(-1)?.so ?? 0;
      if (so > soCuoi) {
        if (so !== soCuoi + 1) {
          canhBao.push({
            loai: "khoan_khong_lien_tuc",
            thong_diep: `Điều ${dieuHienTai.so}: sau Khoản ${soCuoi} nhảy tới Khoản ${so}`,
            dong: d.so_dong,
          });
        }
        khoanHienTai = {
          so,
          trang: d.trang,
          dong: [{ ...d, text: mKhoan[2] }],
          diem: [],
        };
        dieuHienTai.khoan.push(khoanHienTai);
        diemHienTai = null;
        continue;
      }
    }

    /* --- Diem --- */
    const mDiem = P_CHAT.diem.exec(text);
    if (mDiem && khoanHienTai) {
      const kyHieu = mDiem[1].toLowerCase();
      const viTri = THU_TU_DIEM.indexOf(kyHieu as (typeof THU_TU_DIEM)[number]);
      const viTriCuoi = khoanHienTai.diem.length
        ? THU_TU_DIEM.indexOf(
            khoanHienTai.diem.at(-1)!.ky_hieu as (typeof THU_TU_DIEM)[number],
          )
        : -1;
      if (viTri > viTriCuoi) {
        if (viTri !== viTriCuoi + 1) {
          canhBao.push({
            loai: "diem_khong_lien_tuc",
            thong_diep: `Điều ${dieuHienTai.so} Khoản ${khoanHienTai.so}: nhảy tới Điểm ${kyHieu}`,
            dong: d.so_dong,
          });
        }
        diemHienTai = { ky_hieu: kyHieu, trang: d.trang, dong: [{ ...d, text: mDiem[2] }] };
        khoanHienTai.diem.push(diemHienTai);
        continue;
      }
    }

    /* --- Dong noi dung binh thuong --- */
    if (diemHienTai) diemHienTai.dong.push(d);
    else if (khoanHienTai) khoanHienTai.dong.push(d);
    else dieuHienTai.mo_dau.push(d);
  }

  if (dieu.length === 0) {
    canhBao.push({
      loai: "khong_co_dieu",
      thong_diep:
        "Không nhận dạng được Điều nào trong văn bản. Kiểm tra lại text layer của file gốc.",
    });
  }

  return { dieu, phu_luc: phuLuc, phan_dau: phanDau, canh_bao: canhBao, so_trang: soTrang };
}

/* ------------------------------------------------------------------ */
/* Sinh chunk                                                          */
/* ------------------------------------------------------------------ */

/** Uoc luong so token bang so tu — sat voi cach model tieng Viet tach tu hon la chia 4 ky tu. */
export function uocLuongSoToken(text: string): number {
  const s = text.trim();
  return s === "" ? 0 : s.split(/\s+/).length;
}

/**
 * Noi cac dong da bi PDF ngat lai thanh doan van.
 * Xuong dong khi dong truoc da het cau, hoac khi gap dong dang bang bieu.
 */
function noiCacDong(dong: DongVanBan[]): string {
  const parts: string[] = [];
  for (const d of dong) {
    if (d.text === "") continue;
    if (parts.length === 0) {
      parts.push(d.text);
      continue;
    }
    const truoc = parts[parts.length - 1];
    const laBang = truoc.includes("|") || d.text.includes("|");
    if (laBang || /[.;:]$/.test(truoc)) parts.push(d.text);
    else parts[parts.length - 1] = `${truoc} ${d.text}`;
  }
  return parts.join("\n").trim();
}

function catTheoCau(text: string, nguong: number): string[] {
  const cau = text.split(P_CHAT.ranhCau);
  const manh: string[] = [];
  let hienTai = "";
  for (const c of cau) {
    if (uocLuongSoToken(c) > nguong) {
      if (hienTai.trim() !== "") {
        manh.push(hienTai);
        hienTai = "";
      }
      const tu = c.trim().split(/\s+/);
      for (let offset = 0; offset < tu.length; offset += nguong) {
        manh.push(tu.slice(offset, offset + nguong).join(" "));
      }
      continue;
    }
    const thu = hienTai === "" ? c : `${hienTai} ${c}`;
    if (hienTai !== "" && uocLuongSoToken(thu) > nguong) {
      manh.push(hienTai);
      hienTai = c;
    } else {
      hienTai = thu;
    }
  }
  if (hienTai.trim() !== "") manh.push(hienTai);
  return manh.length > 0 ? manh : [text];
}

export function tenVanBan(metadata: MetadataVanBan, tenFile: string): string {
  if (metadata.loai_van_ban && metadata.so_hieu) {
    return `${metadata.loai_van_ban} ${metadata.so_hieu}`;
  }
  return metadata.so_hieu ?? tenFile;
}

interface ViTriChunk {
  node_key: string | null;
  chuong: string | null;
  chuong_tieu_de: string | null;
  muc: string | null;
  muc_tieu_de: string | null;
  dieu_so: number | null;
  dieu_tieu_de: string | null;
  khoan_so: number | null;
  diem: string | null;
  phu_luc: string | null;
}

function chuongKey(chuong: string): string {
  return `chuong:${chuong.replace(/^Chương\s+/i, "")}`;
}

function mucKey(chuong: string | null, muc: string): string {
  return `${chuong ? chuongKey(chuong) : "root"}/muc:${muc.replace(/^Mục\s+/i, "")}`;
}

function dieuKey(so: number): string {
  return `dieu:${so}`;
}

function khoanKey(dieuSo: number, khoanSo: number): string {
  return `${dieuKey(dieuSo)}/khoan:${khoanSo}`;
}

function diemKey(dieuSo: number, khoanSo: number, diem: string): string {
  return `${khoanKey(dieuSo, khoanSo)}/diem:${diem}`;
}

function phuLucKey(index: number): string {
  return `phu_luc:${index}`;
}

/** Tao cay doc_nodes doc lap voi chien luoc chunking. */
export function taoDocNodes(cauTruc: CauTruc): DocNodeParse[] {
  const nodes: DocNodeParse[] = [];
  const seen = new Set<string>();

  const add = (node: Omit<DocNodeParse, "order_index">): void => {
    if (seen.has(node.key)) return;
    seen.add(node.key);
    nodes.push({ ...node, order_index: nodes.length });
  };

  for (const dieu of cauTruc.dieu) {
    let parentKey: string | null = null;
    let parentDepth = -1;
    const breadcrumb: string[] = [];

    if (dieu.chuong) {
      const key = chuongKey(dieu.chuong);
      add({
        key,
        parent_key: null,
        node_type: "chuong",
        so_thu_tu: dieu.chuong.replace(/^Chương\s+/i, ""),
        tieu_de: dieu.chuong_tieu_de,
        noi_dung: "",
        breadcrumb: dieu.chuong,
        depth: 0,
      });
      parentKey = key;
      parentDepth = 0;
      breadcrumb.push(dieu.chuong);
    }

    if (dieu.muc) {
      const key = mucKey(dieu.chuong, dieu.muc);
      breadcrumb.push(dieu.muc);
      add({
        key,
        parent_key: parentKey,
        node_type: "muc",
        so_thu_tu: dieu.muc.replace(/^Mục\s+/i, ""),
        tieu_de: dieu.muc_tieu_de,
        noi_dung: "",
        breadcrumb: breadcrumb.join(" > "),
        depth: parentDepth + 1,
      });
      parentKey = key;
      parentDepth += 1;
    }

    const dieuNodeKey = dieuKey(dieu.so);
    const dieuLabel = `Điều ${dieu.so}`;
    breadcrumb.push(dieuLabel);
    add({
      key: dieuNodeKey,
      parent_key: parentKey,
      node_type: "dieu",
      so_thu_tu: String(dieu.so),
      tieu_de: dieu.tieu_de,
      noi_dung: noiCacDong(dieu.mo_dau),
      breadcrumb: breadcrumb.join(" > "),
      depth: parentDepth + 1,
    });

    for (const khoan of dieu.khoan) {
      const khoanNodeKey = khoanKey(dieu.so, khoan.so);
      const khoanBreadcrumb = [...breadcrumb, `Khoản ${khoan.so}`];
      add({
        key: khoanNodeKey,
        parent_key: dieuNodeKey,
        node_type: "khoan",
        so_thu_tu: String(khoan.so),
        tieu_de: null,
        noi_dung: noiCacDong(khoan.dong),
        breadcrumb: khoanBreadcrumb.join(" > "),
        depth: parentDepth + 2,
      });

      for (const diem of khoan.diem) {
        add({
          key: diemKey(dieu.so, khoan.so, diem.ky_hieu),
          parent_key: khoanNodeKey,
          node_type: "diem",
          so_thu_tu: diem.ky_hieu,
          tieu_de: null,
          noi_dung: noiCacDong(diem.dong),
          breadcrumb: [...khoanBreadcrumb, `Điểm ${diem.ky_hieu}`].join(" > "),
          depth: parentDepth + 3,
        });
      }
    }
  }

  cauTruc.phu_luc.forEach((phuLuc, index) => {
    add({
      key: phuLucKey(index),
      parent_key: null,
      node_type: "phu_luc",
      so_thu_tu: phuLuc.ten.replace(/^PHỤ\s*LỤC\s*/i, "") || String(index + 1),
      tieu_de: phuLuc.ten,
      noi_dung: noiCacDong(phuLuc.dong),
      breadcrumb: phuLuc.ten,
      depth: 0,
    });
  });

  return nodes;
}

function dungDuongDan(ten: string, v: ViTriChunk): string {
  const phan: string[] = [ten];
  if (v.phu_luc) phan.push(v.phu_luc);
  if (v.chuong) phan.push(v.chuong);
  if (v.muc) phan.push(v.muc);
  if (v.dieu_so !== null) phan.push(`Điều ${v.dieu_so}`);
  if (v.khoan_so !== null) phan.push(`Khoản ${v.khoan_so}`);
  if (v.diem) phan.push(`Điểm ${v.diem}`);
  return phan.join(" > ");
}

/** Tieu de nhoi vao dau chunk truoc khi embed (PLAN.md muc 7.3). */
function dungNguCanh(ten: string, v: ViTriChunk): string {
  const phan: string[] = [ten];
  if (v.phu_luc) phan.push(v.phu_luc);
  if (v.chuong) phan.push(v.chuong_tieu_de ? `${v.chuong}: ${v.chuong_tieu_de}` : v.chuong);
  if (v.muc) phan.push(v.muc_tieu_de ? `${v.muc}: ${v.muc_tieu_de}` : v.muc);
  if (v.dieu_so !== null) {
    phan.push(v.dieu_tieu_de ? `Điều ${v.dieu_so}: ${v.dieu_tieu_de}` : `Điều ${v.dieu_so}`);
  }
  if (v.khoan_so !== null) phan.push(`Khoản ${v.khoan_so}`);
  if (v.diem) phan.push(`Điểm ${v.diem}`);
  return `[${phan.join(" — ")}]`;
}

export function taoChunk(
  cauTruc: CauTruc,
  metadata: MetadataVanBan,
  tenFile: string,
): { chunks: ChunkParse[]; canh_bao: CanhBao[] } {
  const ten = tenVanBan(metadata, tenFile);
  const chunks: ChunkParse[] = [];
  const canhBao: CanhBao[] = [];

  const them = (noiDung: string, v: ViTriChunk, trang: number): void => {
    const sach = noiDung.trim();
    if (sach === "") return;
    const duongDan = dungDuongDan(ten, v);
    const nguCanh = dungNguCanh(ten, v);
    const manh =
      uocLuongSoToken(sach) <= NGUONG_TOKEN ? [sach] : catTheoCau(sach, NGUONG_TOKEN);
    const biCat = manh.length > 1;
    if (biCat) {
      canhBao.push({
        loai: "chunk_bi_cat_cung",
        thong_diep: `${duongDan}: dài quá ${NGUONG_TOKEN} token, phải cắt cứng theo câu thành ${manh.length} phần`,
      });
    }
    for (const m of manh) {
      chunks.push({
        ...v,
        duong_dan: duongDan,
        noi_dung: m,
        noi_dung_kem_ngu_canh: `${nguCanh}\n${m}`,
        vi_tri_trang: trang,
        so_token: uocLuongSoToken(m),
        bi_cat_cung: biCat,
      });
    }
  };

  for (const d of cauTruc.dieu) {
    const goc: ViTriChunk = {
      node_key: dieuKey(d.so),
      chuong: d.chuong,
      chuong_tieu_de: d.chuong_tieu_de,
      muc: d.muc,
      muc_tieu_de: d.muc_tieu_de,
      dieu_so: d.so,
      dieu_tieu_de: d.tieu_de,
      khoan_so: null,
      diem: null,
      phu_luc: null,
    };
    const moDau = noiCacDong(d.mo_dau);

    if (d.khoan.length === 0) {
      // Dieu khong co Khoan -> ca Dieu la mot chunk.
      them(moDau, goc, d.trang);
      continue;
    }

    // Cau dan cua Dieu neu ngan thi gan vao moi Khoan cho chunk du nghia,
    // neu dai thi tach thanh chunk rieng de khong lam phinh moi Khoan.
    const dieuNgan = uocLuongSoToken(moDau) <= 25;
    if (moDau !== "" && !dieuNgan) them(moDau, goc, d.trang);
    const dan = moDau !== "" && dieuNgan ? moDau : "";

    for (const k of d.khoan) {
      const viTriKhoan: ViTriChunk = {
        ...goc,
        node_key: khoanKey(d.so, k.so),
        khoan_so: k.so,
      };
      const dauKhoan = noiCacDong(k.dong);
      const cacDiem = k.diem.map((dm) => ({ ky_hieu: dm.ky_hieu, text: noiCacDong(dm.dong), trang: dm.trang }));
      const toanBo = [dan, dauKhoan, ...cacDiem.map((x) => `${x.ky_hieu}) ${x.text}`)]
        .filter((x) => x !== "")
        .join("\n");

      if (uocLuongSoToken(toanBo) <= NGUONG_TOKEN || cacDiem.length === 0) {
        them(toanBo, viTriKhoan, k.trang);
        continue;
      }

      // Khoan qua dai va co Diem -> cat tiep theo Diem.
      const danKhoan = uocLuongSoToken(dauKhoan) <= 60 ? dauKhoan : "";
      if (danKhoan === "" && dauKhoan !== "") them(dauKhoan, viTriKhoan, k.trang);
      for (const dm of cacDiem) {
        them(
          [dan, danKhoan, dm.text].filter((x) => x !== "").join("\n"),
          { ...viTriKhoan, node_key: diemKey(d.so, k.so, dm.ky_hieu), diem: dm.ky_hieu },
          dm.trang,
        );
      }
    }
  }

  cauTruc.phu_luc.forEach((pl, index) => {
    them(
      noiCacDong(pl.dong),
      {
        node_key: phuLucKey(index),
        chuong: null,
        chuong_tieu_de: null,
        muc: null,
        muc_tieu_de: null,
        dieu_so: null,
        dieu_tieu_de: null,
        khoan_so: null,
        diem: null,
        phu_luc: pl.ten,
      },
      pl.trang,
    );
  });

  return { chunks, canh_bao: canhBao };
}

/** Dung o metadata.ts — de o day vi lien quan toi nhan dang dong phan dau. */
export function laDongQuocHieu(text: string): boolean {
  const chuan = text.toUpperCase().replace(/\s+/g, " ").trim();
  return DONG_QUOC_HIEU.some((q) => chuan === q.toUpperCase());
}
