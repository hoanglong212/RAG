/**
 * Năm lần chạy eval, recall tăng dần — dữ liệu cho biểu đồ so sánh ở trang /eval.
 *
 * CẢNH BÁO: số GIẢ. Bảng thật do scripts/eval.ts sinh ra và đọc từ /api/eval/runs.
 *
 * Contract chỉ có configName và notes, trong khi mỗi lần chạy thật đổi ba biến
 * (chiến lược chunk, chế độ tìm, model embedding). Quy ước đặt tên ở đây:
 *   <chien-luoc>-<che-do>[-<embedder>]
 * Giao diện chỉ hiển thị, không tự tách chuỗi này ra để suy luận.
 */
import type { EvalRun } from '@/types/contract';

export const mockEvalRuns: EvalRun[] = [
  {
    id: 'e0000000-0000-4000-8000-000000000001',
    configName: 'fixed-vector',
    recallAt5: 0.42,
    recallAt10: 0.55,
    mrr: 0.29,
    nQuestions: 40,
    notes: 'Nền so sánh: cắt cứng 512 token, chỉ tìm bằng vector.',
    runAt: '2026-08-06T20:10:00+07:00',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000002',
    configName: 'structural-vector',
    recallAt5: 0.52,
    recallAt10: 0.64,
    mrr: 0.38,
    nQuestions: 40,
    notes: 'Đổi sang chunk theo Điều/Khoản, giữ nguyên mọi thứ khác.',
    runAt: '2026-08-07T09:35:00+07:00',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000003',
    configName: 'structural-hybrid',
    recallAt5: 0.68,
    recallAt10: 0.79,
    mrr: 0.51,
    nQuestions: 40,
    notes: 'Thêm full-text và trộn bằng RRF k=60. Nhóm câu hỏi có số hiệu tăng mạnh nhất.',
    runAt: '2026-08-08T16:20:00+07:00',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000004',
    configName: 'structural-hybrid-vi',
    recallAt5: 0.74,
    recallAt10: 0.83,
    mrr: 0.58,
    nQuestions: 40,
    notes: null,
    runAt: '2026-08-10T11:48:00+07:00',
  },
  {
    id: 'e0000000-0000-4000-8000-000000000005',
    configName: 'structural-hybrid-rerank-vi',
    recallAt5: 0.86,
    recallAt10: 0.92,
    mrr: 0.71,
    nQuestions: 40,
    notes: 'Thêm rerank. Đổi lại độ trễ tăng khoảng 600ms mỗi câu.',
    runAt: '2026-08-11T15:05:00+07:00',
  },
];

/** Chưa chạy eval lần nào. */
export const mockEvalRunsRong: EvalRun[] = [];
