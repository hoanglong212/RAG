/**
 * Số liệu dashboard: một bản đầy đủ và một bản mọi số bằng 0.
 *
 * CẢNH BÁO: số trong file này là số GIẢ, chỉ để dựng giao diện. Từ ngày gộp
 * trở đi dashboard đọc /api/stats, không đọc file này.
 *
 * Các tổng đã được làm cho khớp nhau: theoLoai, theoCoQuan và theoNam đều
 * cộng lại bằng tongVanBan. Mock không khớp tổng sẽ làm người xem nghi ngờ
 * đúng vào lúc demo.
 */
import type { StatsResponse } from '@/types/contract';
import { vanBanNgan, vanBanCoCanhBao } from './documents';

export const mockStats: StatsResponse = {
  tongVanBan: 52,
  tongChunk: 3847,

  // 12 + 21 + 9 + 3 + 2 + 4 + 1 = 52
  theoLoai: [
    { loai: 'thong_tu', soLuong: 21 },
    { loai: 'nghi_dinh', soLuong: 12 },
    { loai: 'quyet_dinh', soLuong: 9 },
    { loai: 'cong_van', soLuong: 4 },
    { loai: 'luat', soLuong: 3 },
    { loai: 'nghi_quyet', soLuong: 2 },
    { loai: 'khac', soLuong: 1 },
  ],

  // 14 + 12 + 9 + 7 + 5 + 3 + 2 = 52
  theoCoQuan: [
    { coQuan: 'Bộ Y tế', soLuong: 14 },
    { coQuan: 'Chính phủ', soLuong: 12 },
    { coQuan: 'Bộ Nông nghiệp và Phát triển nông thôn', soLuong: 9 },
    { coQuan: 'Bộ Công Thương', soLuong: 7 },
    { coQuan: 'Ủy ban nhân dân tỉnh Thừa Thiên Huế', soLuong: 5 },
    { coQuan: 'Quốc hội', soLuong: 3 },
    { coQuan: 'Bộ Tài chính', soLuong: 2 },
  ],

  // 3 + 5 + 8 + 7 + 9 + 12 + 8 = 52
  theoNam: [
    { nam: 2018, soLuong: 3 },
    { nam: 2019, soLuong: 5 },
    { nam: 2020, soLuong: 8 },
    { nam: 2021, soLuong: 7 },
    { nam: 2022, soLuong: 9 },
    { nam: 2023, soLuong: 12 },
    { nam: 2024, soLuong: 8 },
  ],

  sapHetHieuLuc: [vanBanNgan, vanBanCoCanhBao],

  // 49 / 52
  tyLeParseSach: 0.942,

  // Tổng 342, khớp với số lượt hỏi đã ghi log.
  phanBoScore: [
    { khoang: '0,0 – 0,2', soLuong: 18 },
    { khoang: '0,2 – 0,4', soLuong: 43 },
    { khoang: '0,4 – 0,6', soLuong: 96 },
    { khoang: '0,6 – 0,8', soLuong: 121 },
    { khoang: '0,8 – 1,0', soLuong: 64 },
  ],

  /** Bản đồ lỗ hổng của kho dữ liệu — phần đáng nói nhất trên dashboard. */
  cauHoiDiemThap: [
    {
      question: 'Mức xử phạt khi cơ sở không có giấy xác nhận đủ sức khoẻ là bao nhiêu?',
      topScore: 0.14,
      at: '2026-08-11T09:24:00+07:00',
    },
    {
      question: 'Thủ tục cấp lại Giấy chứng nhận khi bị mất thực hiện thế nào?',
      topScore: 0.19,
      at: '2026-08-11T14:02:00+07:00',
    },
    {
      question: 'Cơ sở kinh doanh dịch vụ ăn uống trong trường học có phải xin giấy không?',
      topScore: 0.22,
      at: '2026-08-12T08:41:00+07:00',
    },
    {
      question: 'Ai có thẩm quyền thu hồi Giấy chứng nhận đã cấp?',
      topScore: 0.27,
      at: '2026-08-12T10:15:00+07:00',
    },
    {
      question: 'Thời gian giải quyết hồ sơ tối đa là bao nhiêu ngày làm việc?',
      topScore: 0.31,
      at: '2026-08-12T11:03:00+07:00',
    },
  ],

  latencyP50: 1180,
  latencyP95: 2640,
  tyLeCoTrichDan: 0.81,
};

/**
 * Kho rỗng — chưa nạp văn bản nào, chưa ai hỏi câu nào.
 * Dashboard phải hiện trạng thái mời nạp dữ liệu chứ không phải một loạt số 0
 * và bốn biểu đồ trống.
 */
export const mockStatsRong: StatsResponse = {
  tongVanBan: 0,
  tongChunk: 0,
  theoLoai: [],
  theoCoQuan: [],
  theoNam: [],
  sapHetHieuLuc: [],
  tyLeParseSach: 0,
  phanBoScore: [],
  cauHoiDiemThap: [],
  latencyP50: 0,
  latencyP95: 0,
  tyLeCoTrichDan: 0,
};
