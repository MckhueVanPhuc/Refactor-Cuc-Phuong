// RPT-01, RPT-02 — spec-M03 §5.1 "Report outputs" (BR-M03-J05…J08).
import { z } from 'zod';
import { utcDateTime } from '../../../shared/contracts/common';

const count = z.number().int().min(0);
const rate = z.number().min(0).max(1);
const RATE_TOLERANCE = 1e-6;

export const rpt01OutputSchema = z
  .strictObject({
    totalSessionCount: count,
    completedCount: count,
    completedRate: rate,
    abandonedCount: count,
    abandonedRate: rate,
    lastSuccessfulIngestionAt: utcDateTime.optional(),
  })
  .superRefine((report, ctx) => {
    // Chỉ có hai trạng thái kết thúc, nên hai số đếm cộng lại bằng tổng
    if (report.completedCount + report.abandonedCount !== report.totalSessionCount) {
      ctx.addIssue({ code: 'custom', path: ['totalSessionCount'], message: 'phải bằng hoàn thành + bỏ dở' });
    }
    const expectedRate = (part: number) => (report.totalSessionCount === 0 ? 0 : part / report.totalSessionCount);
    if (Math.abs(report.completedRate - expectedRate(report.completedCount)) > RATE_TOLERANCE) {
      ctx.addIssue({ code: 'custom', path: ['completedRate'], message: 'không khớp số đếm' });
    }
    if (Math.abs(report.abandonedRate - expectedRate(report.abandonedCount)) > RATE_TOLERANCE) {
      ctx.addIssue({ code: 'custom', path: ['abandonedRate'], message: 'không khớp số đếm' });
    }
  });

export const rpt02ItemSchema = z.strictObject({
  routeId: z.string().min(1),
  /** tên tiếng Việt của bản đã xuất bản lúc truy vấn */
  routeName: z.string().min(1),
  checkpointId: z.string().min(1),
  /** từ bản ghi có `endedAt` muộn nhất trong kỳ */
  checkpointName: z.string().min(1),
  sequence: z.number().int().min(1),
  uniqueSessionCount: count,
});

export const rpt02OutputSchema = z
  .strictObject({
    items: z.array(rpt02ItemSchema),
    lastSuccessfulIngestionAt: utcDateTime.optional(),
  })
  .refine(
    (report) => new Set(report.items.map((i) => `${i.routeId}\u0000${i.checkpointId}`)).size === report.items.length,
    { path: ['items'], message: 'một phần tử cho mỗi (routeId, checkpointId)' },
  );

export type Rpt01Output = z.infer<typeof rpt01OutputSchema>;
export type Rpt02Output = z.infer<typeof rpt02OutputSchema>;
export type Rpt02Item = z.infer<typeof rpt02ItemSchema>;

/** Input chung của hai báo cáo: hai ngày đi cùng nhau, `YYYY-MM-DD` (spec-M03 §5.1) */
export type ReportInput = { routeId?: string; fromDate?: string; toDate?: string };
