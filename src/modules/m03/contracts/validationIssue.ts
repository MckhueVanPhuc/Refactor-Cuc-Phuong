// ValidationIssue — spec-M03 §5.1 "Administrative contracts"; admin-command-contract §3 (BR-M03-L08).
// Cùng một hàm tạo issue chạy ở client và server; server thắng (research R-19, R-26).
import { z } from 'zod';

export const validationIssueSchema = z.strictObject({
  severity: z.enum(['BLOCKS_SAVE', 'BLOCKS_PUBLISH']),
  /** nhãn tiếng Việt trên editor, không phải tên trường nội bộ */
  fieldLabel: z.string().min(1),
  /** câu từ danh mục §5.6 đã điền placeholder */
  message: z.string().min(1),
  /** khóa danh mục; không hiển thị */
  messageKey: z.string().min(1),
  targetItemType: z.enum(['ROUTE', 'CHECKPOINT', 'QRCODE']),
  /** không hiển thị */
  targetItemId: z.string().min(1),
  /** chỉ để focus trường; không hiển thị */
  targetFieldKey: z.string().min(1),
});

export type ValidationIssue = z.infer<typeof validationIssueSchema>;
export type IssueSeverity = ValidationIssue['severity'];
