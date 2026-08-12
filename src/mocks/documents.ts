/**
 * Ba văn bản giả cho danh sách kho.
 *
 * CẢNH BÁO: toàn bộ nội dung điều khoản trong src/mocks/ là văn bản BỊA,
 * viết cho vừa khuôn giao diện. Không phải trích dẫn văn bản pháp luật thật
 * và không được dùng để tra cứu. Số hiệu lấy theo ví dụ chạy trong PLAN.md.
 *
 * Ba văn bản cố ý phủ ba tình huống khác nhau:
 *   1. đầy đủ Chương → Điều → Khoản → Điểm, parse sạch
 *   2. thông tư ngắn, tên cơ quan rất dài — dùng để lộ lỗi tràn khung
 *   3. parse có cảnh báo, thiếu số hiệu, không xác định được loại
 */
import type { DocumentSummary } from '@/types/contract';

export const ID_VAN_BAN_1 = 'd1a7c3e0-0000-4000-8000-000000000001';
export const ID_VAN_BAN_2 = 'd1a7c3e0-0000-4000-8000-000000000002';
export const ID_VAN_BAN_3 = 'd1a7c3e0-0000-4000-8000-000000000003';

export const vanBanDayDu: DocumentSummary = {
  id: ID_VAN_BAN_1,
  soHieu: '15/2020/NĐ-CP',
  loaiVanBan: 'nghi_dinh',
  coQuan: 'Chính phủ',
  trichYeu:
    'Quy định chi tiết thi hành một số điều của Luật An toàn thực phẩm về điều kiện ' +
    'cấp Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm',
  ngayBanHanh: '2020-02-03',
  ngayHieuLuc: '2020-03-20',
  trangThai: 'con_hieu_luc',
  soDieu: 42,
  coCanhBao: false,
};

export const vanBanNgan: DocumentSummary = {
  id: ID_VAN_BAN_2,
  soHieu: '08/2023/TT-BNNPTNT',
  loaiVanBan: 'thong_tu',
  // Tên cơ quan dài nhất trong bộ mock — mọi component hiện tên cơ quan
  // phải kiểm tra với chuỗi này.
  coQuan: 'Bộ Nông nghiệp và Phát triển nông thôn',
  trichYeu:
    'Hướng dẫn trình tự kiểm tra, giám sát cơ sở sản xuất ban đầu nhỏ lẻ theo ' +
    'Nghị định 15/2020/NĐ-CP',
  ngayBanHanh: '2023-06-15',
  ngayHieuLuc: '2023-08-01',
  trangThai: 'con_hieu_luc',
  soDieu: 9,
  coCanhBao: false,
};

export const vanBanCoCanhBao: DocumentSummary = {
  id: ID_VAN_BAN_3,
  // Parser không đọc được số hiệu — giao diện phải chịu được soHieu null
  // ở mọi chỗ hiện mã văn bản.
  soHieu: null,
  loaiVanBan: 'khac',
  coQuan: 'Ủy ban nhân dân tỉnh Thừa Thiên Huế',
  trichYeu:
    'Kế hoạch triển khai công tác bảo đảm an toàn thực phẩm trên địa bàn tỉnh ' +
    'giai đoạn 2024 – 2026, kèm phân công nhiệm vụ cho các sở, ban, ngành và ' +
    'Ủy ban nhân dân các huyện, thị xã, thành phố trực thuộc',
  ngayBanHanh: '2024-01-11',
  ngayHieuLuc: null,
  trangThai: 'chua_xac_dinh',
  soDieu: 5,
  coCanhBao: true,
};

export const mockDocuments: DocumentSummary[] = [
  vanBanDayDu,
  vanBanNgan,
  vanBanCoCanhBao,
];

/** Kho rỗng — trạng thái trước khi nạp văn bản đầu tiên. */
export const mockDocumentsRong: DocumentSummary[] = [];
