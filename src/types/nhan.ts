/**
 * Nhãn hiển thị tiếng Việt cho các enum trong contract.
 *
 * Cố ý tách khỏi src/types/contract.ts: contract là bản chép đóng băng,
 * còn chữ nghĩa trong giao diện là việc của Track B và sẽ còn sửa.
 * Không lưu bảng này xuống DB — xem docs/DECISIONS-D1.md mục 3.
 */
import type { LoaiVanBan, NodeType, ParseWarning, TrangThaiHieuLuc } from './contract';

export const NHAN_LOAI: Record<LoaiVanBan, string> = {
  nghi_dinh: 'Nghị định',
  thong_tu: 'Thông tư',
  quyet_dinh: 'Quyết định',
  luat: 'Luật',
  nghi_quyet: 'Nghị quyết',
  cong_van: 'Công văn',
  khac: 'Khác',
};

export const NHAN_TRANG_THAI: Record<TrangThaiHieuLuc, string> = {
  con_hieu_luc: 'Còn hiệu lực',
  het_hieu_luc: 'Hết hiệu lực',
  chua_xac_dinh: 'Chưa xác định',
};

export const NHAN_NODE: Record<NodeType, string> = {
  chuong: 'Chương',
  muc: 'Mục',
  dieu: 'Điều',
  khoan: 'Khoản',
  diem: 'Điểm',
  phu_luc: 'Phụ lục',
};

/**
 * Cảnh báo nói cho người dùng biết chuyện gì đã xảy ra, không xin lỗi và
 * không dùng từ của hệ thống.
 */
export const NHAN_CANH_BAO: Record<ParseWarning['code'], string> = {
  DIEU_NHAY_COC: 'Số Điều không liên tục',
  THIEU_SO_HIEU: 'Không đọc được số hiệu',
  KHONG_XAC_DINH_LOAI: 'Không xác định được loại văn bản',
  KHOAN_KHONG_TRONG_DIEU: 'Có Khoản nằm ngoài Điều',
  PHU_LUC_KHONG_PARSE: 'Phụ lục chưa bóc tách được',
};
