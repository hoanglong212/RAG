/**
 * Cây cấu trúc đầy đủ cho văn bản 1, và một bản có cảnh báo parse.
 *
 * CẢNH BÁO: nội dung điều khoản là văn bản BỊA. Xem đầu file documents.ts.
 *
 * Cây này là dữ liệu nuôi trục văn bản, nên nó cố ý không đều: Điều 8 rất dài
 * còn Điều 9 chỉ một câu. Vạch mật độ trên trục phải nhìn ra được chênh lệch đó.
 * Khoản 3 có Điểm a, b, đ — chữ `đ` là bẫy sắp xếp của bảng chữ cái tiếng Việt,
 * mọi component sắp xếp Điểm phải chạy đúng với nó.
 */
import type { DocNode, DocumentDetail, ParseWarning } from '@/types/contract';
import { vanBanCoCanhBao, vanBanDayDu } from './documents';

/* Id node ổn định — trích dẫn ở chat.ts trỏ vào đây. */
export const NODE_CHUONG_1 = 'n0000000-0000-4000-8000-000000000101';
export const NODE_DIEU_1 = 'n0000000-0000-4000-8000-000000000102';
export const NODE_DIEU_2 = 'n0000000-0000-4000-8000-000000000103';
export const NODE_CHUONG_2 = 'n0000000-0000-4000-8000-000000000201';
export const NODE_DIEU_7 = 'n0000000-0000-4000-8000-000000000202';
export const NODE_DIEU_8 = 'n0000000-0000-4000-8000-000000000203';
export const NODE_DIEU_8_KHOAN_1 = 'n0000000-0000-4000-8000-000000000204';
export const NODE_DIEU_8_KHOAN_2 = 'n0000000-0000-4000-8000-000000000205';
export const NODE_DIEU_8_KHOAN_3 = 'n0000000-0000-4000-8000-000000000206';
export const NODE_DIEU_8_KHOAN_3_DIEM_A = 'n0000000-0000-4000-8000-000000000207';
export const NODE_DIEU_8_KHOAN_3_DIEM_B = 'n0000000-0000-4000-8000-000000000208';
export const NODE_DIEU_8_KHOAN_3_DIEM_D = 'n0000000-0000-4000-8000-000000000209';
export const NODE_DIEU_8_KHOAN_4 = 'n0000000-0000-4000-8000-000000000210';
export const NODE_DIEU_9 = 'n0000000-0000-4000-8000-000000000211';
export const NODE_PHU_LUC_1 = 'n0000000-0000-4000-8000-000000000301';

const chuong1: DocNode = {
  id: NODE_CHUONG_1,
  type: 'chuong',
  soThuTu: 'I',
  tieuDe: 'Quy định chung',
  noiDung: '',
  breadcrumb: 'Chương I',
  children: [
    {
      id: NODE_DIEU_1,
      type: 'dieu',
      soThuTu: '1',
      tieuDe: 'Phạm vi điều chỉnh',
      noiDung:
        'Nghị định này quy định chi tiết điều kiện, hồ sơ, trình tự, thủ tục cấp, ' +
        'cấp lại và thu hồi Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm ' +
        'đối với cơ sở sản xuất, kinh doanh thực phẩm thuộc phạm vi quản lý.',
      breadcrumb: 'Chương I > Điều 1',
      children: [],
    },
    {
      id: NODE_DIEU_2,
      type: 'dieu',
      soThuTu: '2',
      tieuDe: 'Đối tượng áp dụng',
      noiDung:
        'Nghị định này áp dụng đối với tổ chức, cá nhân sản xuất, kinh doanh thực ' +
        'phẩm và cơ quan, tổ chức, cá nhân khác có liên quan trên lãnh thổ Việt Nam.',
      breadcrumb: 'Chương I > Điều 2',
      children: [],
    },
  ],
};

const dieu8: DocNode = {
  id: NODE_DIEU_8,
  type: 'dieu',
  soThuTu: '8',
  tieuDe: 'Điều kiện cấp Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm',
  noiDung: '',
  breadcrumb: 'Chương II > Điều 8',
  children: [
    {
      id: NODE_DIEU_8_KHOAN_1,
      type: 'khoan',
      soThuTu: '1',
      tieuDe: null,
      noiDung:
        'Cơ sở phải có địa điểm, diện tích thích hợp, có khoảng cách an toàn đối với ' +
        'nguồn gây độc hại, nguồn gây ô nhiễm và các yếu tố gây hại khác.',
      breadcrumb: 'Chương II > Điều 8 > Khoản 1',
      children: [],
    },
    {
      id: NODE_DIEU_8_KHOAN_2,
      type: 'khoan',
      soThuTu: '2',
      tieuDe: null,
      noiDung:
        'Cơ sở phải có đủ nước đạt quy chuẩn kỹ thuật phục vụ sản xuất, kinh doanh ' +
        'thực phẩm và có hệ thống xử lý chất thải được vận hành thường xuyên.',
      breadcrumb: 'Chương II > Điều 8 > Khoản 2',
      children: [],
    },
    {
      id: NODE_DIEU_8_KHOAN_3,
      type: 'khoan',
      soThuTu: '3',
      tieuDe: null,
      noiDung:
        'Trường hợp quy định tại điểm b khoản 2 Điều này, chủ cơ sở và người trực ' +
        'tiếp sản xuất, kinh doanh thực phẩm phải đáp ứng các yêu cầu sau đây:',
      breadcrumb: 'Chương II > Điều 8 > Khoản 3',
      children: [
        {
          id: NODE_DIEU_8_KHOAN_3_DIEM_A,
          type: 'diem',
          soThuTu: 'a',
          tieuDe: null,
          noiDung:
            'Được tập huấn kiến thức an toàn thực phẩm phù hợp với loại hình sản xuất, ' +
            'kinh doanh của cơ sở;',
          breadcrumb: 'Chương II > Điều 8 > Khoản 3 > Điểm a',
          children: [],
        },
        {
          id: NODE_DIEU_8_KHOAN_3_DIEM_B,
          type: 'diem',
          soThuTu: 'b',
          tieuDe: null,
          noiDung:
            'Có giấy xác nhận đủ sức khoẻ do cơ sở y tế cấp huyện trở lên cấp, còn ' +
            'thời hạn tại thời điểm nộp hồ sơ;',
          breadcrumb: 'Chương II > Điều 8 > Khoản 3 > Điểm b',
          children: [],
        },
        {
          id: NODE_DIEU_8_KHOAN_3_DIEM_D,
          type: 'diem',
          soThuTu: 'đ',
          tieuDe: null,
          noiDung:
            'Không mắc các bệnh thuộc danh mục bệnh truyền nhiễm mà người lao động ' +
            'không được tiếp xúc trực tiếp với thực phẩm.',
          breadcrumb: 'Chương II > Điều 8 > Khoản 3 > Điểm đ',
          children: [],
        },
      ],
    },
    {
      id: NODE_DIEU_8_KHOAN_4,
      type: 'khoan',
      soThuTu: '4',
      tieuDe: null,
      noiDung:
        'Bộ Y tế hướng dẫn cụ thể nội dung tập huấn và mẫu giấy xác nhận quy định ' +
        'tại khoản 3 Điều này.',
      breadcrumb: 'Chương II > Điều 8 > Khoản 4',
      children: [],
    },
  ],
};

const chuong2: DocNode = {
  id: NODE_CHUONG_2,
  type: 'chuong',
  soThuTu: 'II',
  tieuDe: 'Điều kiện và thủ tục cấp Giấy chứng nhận',
  noiDung: '',
  breadcrumb: 'Chương II',
  children: [
    {
      id: NODE_DIEU_7,
      type: 'dieu',
      soThuTu: '7',
      tieuDe: 'Hồ sơ đề nghị cấp Giấy chứng nhận',
      noiDung:
        'Hồ sơ gồm đơn đề nghị theo Mẫu số 01 tại Phụ lục I, bản thuyết minh về cơ sở ' +
        'vật chất và danh sách người trực tiếp sản xuất, kinh doanh thực phẩm.',
      breadcrumb: 'Chương II > Điều 7',
      children: [],
    },
    dieu8,
    {
      id: NODE_DIEU_9,
      type: 'dieu',
      soThuTu: '9',
      tieuDe: 'Thời hạn của Giấy chứng nhận',
      noiDung: 'Giấy chứng nhận có hiệu lực trong thời hạn 03 năm kể từ ngày cấp.',
      breadcrumb: 'Chương II > Điều 9',
      children: [],
    },
  ],
};

const phuLuc1: DocNode = {
  id: NODE_PHU_LUC_1,
  type: 'phu_luc',
  soThuTu: 'I',
  tieuDe: 'Mẫu đơn đề nghị cấp Giấy chứng nhận',
  noiDung:
    'Mẫu số 01. Đơn đề nghị cấp Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm.',
  breadcrumb: 'Phụ lục I',
  children: [],
};

/** Văn bản 1 — cây đầy đủ, parse sạch. */
export const chiTietVanBanDayDu: DocumentDetail = {
  ...vanBanDayDu,
  tree: [chuong1, chuong2, phuLuc1],
  warnings: [],
};

const canhBaoVanBan3: ParseWarning[] = [
  {
    code: 'THIEU_SO_HIEU',
    message: 'Không tìm thấy số hiệu ở phần đầu văn bản.',
    line: 3,
  },
  {
    code: 'KHONG_XAC_DINH_LOAI',
    message: 'Không khớp loại văn bản nào trong danh mục; đã xếp vào "Khác".',
    line: 3,
  },
  {
    code: 'DIEU_NHAY_COC',
    message: 'Sau Điều 3 là Điều 5, thiếu Điều 4.',
    line: 128,
  },
  {
    code: 'PHU_LUC_KHONG_PARSE',
    message: 'Phụ lục cuối văn bản là bảng biểu, chưa bóc tách được thành node.',
    line: 204,
  },
];

/** Văn bản 3 — cây nông và có cảnh báo. Trạng thái hay bị quên nhất. */
export const chiTietVanBanCoCanhBao: DocumentDetail = {
  ...vanBanCoCanhBao,
  tree: [
    {
      id: 'n0000000-0000-4000-8000-000000000401',
      type: 'dieu',
      soThuTu: '1',
      tieuDe: 'Mục tiêu',
      noiDung:
        'Bảo đảm 100% cơ sở sản xuất, kinh doanh thực phẩm trên địa bàn được kiểm tra ' +
        'định kỳ ít nhất một lần trong năm.',
      breadcrumb: 'Điều 1',
      children: [],
    },
    {
      id: 'n0000000-0000-4000-8000-000000000402',
      type: 'dieu',
      soThuTu: '2',
      tieuDe: 'Phân công nhiệm vụ',
      noiDung:
        'Sở Y tế chủ trì, phối hợp với Sở Nông nghiệp và Phát triển nông thôn, Sở Công ' +
        'Thương và Ủy ban nhân dân các huyện, thị xã, thành phố tổ chức thực hiện.',
      breadcrumb: 'Điều 2',
      children: [],
    },
    {
      id: 'n0000000-0000-4000-8000-000000000403',
      type: 'dieu',
      soThuTu: '3',
      tieuDe: 'Kinh phí thực hiện',
      noiDung: 'Kinh phí bố trí từ nguồn ngân sách địa phương theo phân cấp hiện hành.',
      breadcrumb: 'Điều 3',
      children: [],
    },
    {
      // Nhảy cóc: sau Điều 3 là Điều 5. Trục văn bản phải hiện được chỗ đứt này.
      id: 'n0000000-0000-4000-8000-000000000404',
      type: 'dieu',
      soThuTu: '5',
      tieuDe: 'Tổ chức thực hiện',
      noiDung:
        'Các sở, ban, ngành báo cáo kết quả về Ủy ban nhân dân tỉnh trước ngày 15 ' +
        'tháng 12 hằng năm.',
      breadcrumb: 'Điều 5',
      children: [],
    },
  ],
  warnings: canhBaoVanBan3,
};
