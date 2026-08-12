/**
 * Bốn phản hồi chat, phủ đủ bốn trạng thái giao diện phải dựng.
 *
 * CẢNH BÁO: nội dung là văn bản BỊA. Xem đầu file documents.ts.
 *
 * Trích dẫn trỏ vào node có thật trong detail.ts, nên trục văn bản chạy được
 * trên mock mà không cần API.
 */
import type { ChatResponse, Citation } from '@/types/contract';
import { ID_VAN_BAN_1 } from './documents';
import {
  NODE_DIEU_7,
  NODE_DIEU_8_KHOAN_3,
  NODE_DIEU_8_KHOAN_3_DIEM_D,
  NODE_DIEU_8_KHOAN_4,
} from './detail';

const SO_HIEU_1 = '15/2020/NĐ-CP';

const trichDanKhoan3: Citation = {
  chunkId: 'c0000000-0000-4000-8000-000000000001',
  documentId: ID_VAN_BAN_1,
  nodeId: NODE_DIEU_8_KHOAN_3,
  soHieu: SO_HIEU_1,
  breadcrumb: 'Chương II > Điều 8 > Khoản 3',
  trichDoan:
    'Trường hợp quy định tại điểm b khoản 2 Điều này, chủ cơ sở và người trực tiếp ' +
    'sản xuất, kinh doanh thực phẩm phải đáp ứng các yêu cầu sau đây:',
  score: 0.87,
};

const trichDanDiemD: Citation = {
  chunkId: 'c0000000-0000-4000-8000-000000000002',
  documentId: ID_VAN_BAN_1,
  nodeId: NODE_DIEU_8_KHOAN_3_DIEM_D,
  soHieu: SO_HIEU_1,
  breadcrumb: 'Chương II > Điều 8 > Khoản 3 > Điểm đ',
  trichDoan:
    'Không mắc các bệnh thuộc danh mục bệnh truyền nhiễm mà người lao động không ' +
    'được tiếp xúc trực tiếp với thực phẩm.',
  score: 0.79,
};

const trichDanKhoan4: Citation = {
  chunkId: 'c0000000-0000-4000-8000-000000000003',
  documentId: ID_VAN_BAN_1,
  nodeId: NODE_DIEU_8_KHOAN_4,
  soHieu: SO_HIEU_1,
  breadcrumb: 'Chương II > Điều 8 > Khoản 4',
  trichDoan:
    'Bộ Y tế hướng dẫn cụ thể nội dung tập huấn và mẫu giấy xác nhận quy định tại ' +
    'khoản 3 Điều này.',
  score: 0.71,
};

/** Trường hợp tốt: điểm cao, ba trích dẫn, câu trả lời neo được từng ý. */
export const chatOk: ChatResponse = {
  status: 'ok',
  answer:
    'Chủ cơ sở và người trực tiếp sản xuất, kinh doanh thực phẩm phải đáp ứng ba yêu ' +
    'cầu [1]: được tập huấn kiến thức an toàn thực phẩm phù hợp với loại hình của cơ ' +
    'sở, có giấy xác nhận đủ sức khoẻ do cơ sở y tế cấp huyện trở lên cấp, và không ' +
    'mắc bệnh thuộc danh mục bệnh truyền nhiễm không được tiếp xúc trực tiếp với thực ' +
    'phẩm [2]. Nội dung tập huấn và mẫu giấy xác nhận do Bộ Y tế hướng dẫn [3].',
  citations: [trichDanKhoan3, trichDanDiemD, trichDanKhoan4],
  topScore: 0.87,
  latencyMs: 1430,
};

/**
 * Trên ngưỡng nhưng sát đáy: một trích dẫn, điểm thấp.
 * Giao diện phải cho thấy độ tin cậy yếu mà không biến nó thành lỗi.
 */
export const chatDiemThap: ChatResponse = {
  status: 'ok',
  answer:
    'Hồ sơ đề nghị cấp Giấy chứng nhận gồm đơn đề nghị theo mẫu, bản thuyết minh về ' +
    'cơ sở vật chất và danh sách người trực tiếp sản xuất, kinh doanh thực phẩm [1]. ' +
    'Các trích đoạn tìm được chưa nói rõ số lượng bản và nơi nộp hồ sơ.',
  citations: [
    {
      chunkId: 'c0000000-0000-4000-8000-000000000004',
      documentId: ID_VAN_BAN_1,
      nodeId: NODE_DIEU_7,
      soHieu: SO_HIEU_1,
      breadcrumb: 'Chương II > Điều 7',
      trichDoan:
        'Hồ sơ gồm đơn đề nghị theo Mẫu số 01 tại Phụ lục I, bản thuyết minh về cơ sở ' +
        'vật chất và danh sách người trực tiếp sản xuất, kinh doanh thực phẩm.',
      score: 0.41,
    },
  ],
  topScore: 0.41,
  latencyMs: 1210,
};

/**
 * Dưới ngưỡng tin cậy. KHÔNG phải lỗi — đây là một câu trả lời hợp lệ và là
 * trạng thái quan trọng nhất của cả hệ thống. Không có trích dẫn nghĩa là
 * không có dấu đỏ: hệ thống không khẳng định gì.
 */
export const chatKhongTimThay: ChatResponse = {
  status: 'khong_tim_thay',
  answer: null,
  citations: [],
  topScore: 0.31,
  latencyMs: 890,
};

/** Hạ tầng hỏng. Nói rõ chuyện gì đã xảy ra, không xin lỗi, không mơ hồ. */
export const chatLoi: ChatResponse = {
  status: 'loi',
  answer: null,
  citations: [],
  topScore: 0,
  latencyMs: 120,
};

export const mockChatResponses: ChatResponse[] = [
  chatOk,
  chatDiemThap,
  chatKhongTimThay,
  chatLoi,
];

/**
 * Ba câu gợi ý cho màn hình trống, lấy từ chính bộ tài liệu trong mock.
 * Trạng thái rỗng là lời mời hành động, không phải thông báo buồn.
 */
export const cauHoiGoiY: string[] = [
  'Người trực tiếp sản xuất thực phẩm phải đáp ứng những yêu cầu gì?',
  'Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm có thời hạn bao lâu?',
  'Nghị định 15/2020/NĐ-CP có hiệu lực từ khi nào?',
];
