// PublicationReview — spec-M03 §5.1 "Administrative contracts"; admin-command-contract §4 (BR-M03-F02).
// Spec chỉ nêu "name and reason" / "name and what is missing" cho hai danh sách left-out; tên trường
// `name`, `reason`, `missing` là quyết định của plan cho contract nội bộ này.
import { z } from 'zod';
import { validationIssueSchema } from './validationIssue';

export const publicationUnitType = z.enum([
  'ROUTE_FIRST_PUBLICATION',
  'ROUTE_INFORMATION',
  'CHECKPOINT_FIRST_PUBLICATION',
  'CHECKPOINT_REVISION',
  'QR_OBJECT',
]);

/** Trước/sau là văn bản thường hoặc tóm tắt, đã dùng tên hiển thị §5.4 */
export const fieldChange = z.strictObject({
  fieldLabel: z.string().min(1),
  before: z.string(),
  after: z.string(),
});

export const affectedRoute = z.strictObject({
  /** chỉ để liên kết tới tuyến */
  routeId: z.string().min(1),
  routeName: z.string().min(1),
  routeStatus: z.enum(['HOAT_DONG', 'TAM_DONG']),
  createsNewJourneyVersion: z.boolean(),
  estimatedOfflineSizeBytes: z.number().int().min(0),
  closesAutomatically: z.boolean(),
});

export const publicationReviewSchema = z
  .strictObject({
    unitType: publicationUnitType,
    blockingIssues: z.array(validationIssueSchema),
    changes: z.array(fieldChange),
    /** phần của `changes` trên cảnh báo an toàn, yêu cầu tham gia, tick sơ đồ offline (BR-M03-C10) */
    sensitiveChanges: z.array(fieldChange),
    affectedRoutes: z.array(affectedRoute),
    leftOutCheckpoints: z.array(z.strictObject({ name: z.string().min(1), reason: z.string().min(1) })),
    leftOutQrObjects: z.array(z.strictObject({ name: z.string().min(1), missing: z.array(z.string().min(1)) })),
    impactNotes: z.array(z.string().min(1)),
    noSafetyWarningConfirmationRequired: z.boolean(),
    reviewedConcurrencyRevision: z.number().int(),
  })
  .refine((review) => review.unitType !== 'CHECKPOINT_FIRST_PUBLICATION' || review.affectedRoutes.length === 0, {
    path: ['affectedRoutes'],
    message: 'rỗng khi xuất bản điểm dừng lần đầu',
  });

export type PublicationUnitType = z.infer<typeof publicationUnitType>;
export type PublicationReview = z.infer<typeof publicationReviewSchema>;
export type AffectedRoute = z.infer<typeof affectedRoute>;
export type FieldChange = z.infer<typeof fieldChange>;
