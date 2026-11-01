import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { commandResultSchema } from './commandResult';
import { publicationReviewSchema, type PublicationReview } from './publicationReview';
import { rpt01OutputSchema, rpt02OutputSchema } from './reportOutputs';
import { validationIssueSchema, type ValidationIssue } from './validationIssue';

const issue: ValidationIssue = {
  severity: 'BLOCKS_PUBLISH',
  fieldLabel: 'Cảnh báo an toàn',
  message: 'Cảnh báo an toàn: còn thiếu bản tiếng Anh.',
  messageKey: 'MSG-MISSING-LANGUAGE',
  targetItemType: 'ROUTE',
  targetItemId: 'r1',
  targetFieldKey: 'safetyWarning.en',
};

describe('ValidationIssue (admin-command §3)', () => {
  it('nhận issue hợp lệ', () => {
    expect(validationIssueSchema.safeParse(issue).success).toBe(true);
  });

  it.each(Object.keys(issue))('thiếu %s → không hợp lệ', (field) => {
    const broken: Record<string, unknown> = { ...issue };
    delete broken[field];
    expect(validationIssueSchema.safeParse(broken).success).toBe(false);
  });

  it('severity và targetItemType đúng enum', () => {
    expect(validationIssueSchema.safeParse({ ...issue, severity: 'WARNING' }).success).toBe(false);
    expect(validationIssueSchema.safeParse({ ...issue, targetItemType: 'MEDIA' }).success).toBe(false);
  });
});

describe('CommandResult (admin-command §2)', () => {
  const schema = commandResultSchema(z.strictObject({ routeId: z.string() }));
  const parse = (value: unknown) => schema.safeParse(value);

  it('ok: true kèm messageKey và data', () => {
    expect(parse({ ok: true, messageKey: 'MSG-SAVED', data: { routeId: 'r1' } }).success).toBe(true);
    expect(parse({ ok: true, messageKey: 'MSG-SAVED' }).success).toBe(false);
    expect(parse({ ok: true, messageKey: 'MSG-SAVED', data: {} }).success).toBe(false);
  });

  it('VALIDATION kèm issues; issue phải đúng hình dạng ValidationIssue, không có hình dạng nào khác (BR-M03-L08)', () => {
    expect(parse({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-LIMIT-TEXT', issues: [issue] }).success).toBe(true);
    expect(parse({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-LIMIT-TEXT' }).success).toBe(false);
    expect(parse({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-LIMIT-TEXT', issues: [{ field: 'name', error: 'quá dài' }] }).success).toBe(false);
    expect(parse({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-LIMIT-TEXT', issues: [{ ...issue, debug: 'x' }] }).success).toBe(false);
  });

  it('STALE: chỉ MSG-STALE, có email người sửa và thời điểm UTC', () => {
    const stale = { editorEmail: 'staff@example.test', editedAt: '2026-10-30T03:00:00Z' };
    expect(parse({ ok: false, reason: 'STALE', messageKey: 'MSG-STALE', stale }).success).toBe(true);
    expect(parse({ ok: false, reason: 'STALE', messageKey: 'MSG-GENERIC', stale }).success).toBe(false);
    expect(parse({ ok: false, reason: 'STALE', messageKey: 'MSG-STALE' }).success).toBe(false);
  });

  it('BUSY: chỉ MSG-ROUTE-BUSY kèm tên mục', () => {
    expect(
      parse({ ok: false, reason: 'BUSY', messageKey: 'MSG-ROUTE-BUSY', busy: { itemName: 'Tuyến thử' } }).success,
    ).toBe(true);
    expect(parse({ ok: false, reason: 'BUSY', messageKey: 'MSG-ROUTE-BUSY' }).success).toBe(false);
  });

  it('FORBIDDEN: chỉ MSG-NO-PERMISSION', () => {
    expect(parse({ ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-NO-PERMISSION' }).success).toBe(true);
    expect(parse({ ok: false, reason: 'FORBIDDEN', messageKey: 'MSG-GENERIC' }).success).toBe(false);
  });

  it('BLOCKED: values thường, issues tùy chọn', () => {
    expect(
      parse({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-QR', values: {} }).success,
    ).toBe(true);
    expect(
      parse({
        ok: false,
        reason: 'BLOCKED',
        messageKey: 'MSG-CHECKPOINT-IN-USE',
        values: { 'danh sách': 'Tuyến A, Tuyến B', số: 2 },
        issues: [issue],
      }).success,
    ).toBe(true);
    expect(parse({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-QR' }).success).toBe(false);
    expect(
      parse({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-QR', values: { x: { nested: true } } }).success,
    ).toBe(false);
  });

  it('FAILED: chỉ ba khóa cho phép', () => {
    for (const key of ['MSG-PUBLISH-FAILED', 'MSG-CLOSE-FAILED', 'MSG-GENERIC']) {
      expect(parse({ ok: false, reason: 'FAILED', messageKey: key }).success).toBe(true);
    }
    expect(parse({ ok: false, reason: 'FAILED', messageKey: 'MSG-SAVED' }).success).toBe(false);
  });

  it('messageKey ngoài danh mục hoặc reason lạ → không hợp lệ', () => {
    expect(parse({ ok: true, messageKey: 'MSG-KHONG-CO', data: { routeId: 'r1' } }).success).toBe(false);
    expect(parse({ ok: false, reason: 'TIMEOUT', messageKey: 'MSG-GENERIC' }).success).toBe(false);
  });
});

describe('PublicationReview (spec-M03 §5.1)', () => {
  const review: PublicationReview = {
    unitType: 'CHECKPOINT_REVISION',
    blockingIssues: [],
    changes: [{ fieldLabel: 'Tên điểm dừng', before: 'Cũ', after: 'Mới' }],
    sensitiveChanges: [],
    affectedRoutes: [
      {
        routeId: 'r1',
        routeName: 'Tuyến thử',
        routeStatus: 'HOAT_DONG',
        createsNewJourneyVersion: true,
        estimatedOfflineSizeBytes: 1024,
        closesAutomatically: false,
      },
    ],
    leftOutCheckpoints: [],
    leftOutQrObjects: [{ name: 'Cây', missing: ['Giới thiệu'] }],
    impactNotes: ['Gói tải trước của du khách cần cập nhật.'],
    noSafetyWarningConfirmationRequired: false,
    reviewedConcurrencyRevision: 4,
  };
  const parse = (value: unknown) => publicationReviewSchema.safeParse(value);

  it('nhận review hợp lệ', () => {
    expect(parse(review).success).toBe(true);
  });

  it.each(Object.keys(review))('thiếu %s → không hợp lệ', (field) => {
    const broken: Record<string, unknown> = { ...review };
    delete broken[field];
    expect(parse(broken).success).toBe(false);
  });

  it('affectedRoutes: routeStatus chỉ HOAT_DONG / TAM_DONG; mọi trường Required', () => {
    const route = review.affectedRoutes[0]!;
    expect(parse({ ...review, affectedRoutes: [{ ...route, routeStatus: 'LUU_TRU' }] }).success).toBe(false);
    const { estimatedOfflineSizeBytes: _omit, ...missing } = route;
    expect(parse({ ...review, affectedRoutes: [missing] }).success).toBe(false);
  });

  it('CHECKPOINT_FIRST_PUBLICATION: affectedRoutes rỗng', () => {
    expect(parse({ ...review, unitType: 'CHECKPOINT_FIRST_PUBLICATION' }).success).toBe(false);
    expect(parse({ ...review, unitType: 'CHECKPOINT_FIRST_PUBLICATION', affectedRoutes: [] }).success).toBe(true);
  });

  it('unitType ngoài enum → không hợp lệ', () => {
    expect(parse({ ...review, unitType: 'MEDIA' }).success).toBe(false);
  });
});

describe('RPT-01 (spec-M03 §5.1 Report outputs)', () => {
  const rpt01 = {
    totalSessionCount: 4,
    completedCount: 3,
    completedRate: 0.75,
    abandonedCount: 1,
    abandonedRate: 0.25,
    lastSuccessfulIngestionAt: '2026-10-30T03:00:00Z',
  };
  const parse = (value: unknown) => rpt01OutputSchema.safeParse(value);

  it('nhận output hợp lệ; lastSuccessfulIngestionAt tùy chọn', () => {
    expect(parse(rpt01).success).toBe(true);
    const { lastSuccessfulIngestionAt: _omit, ...withoutIngestion } = rpt01;
    expect(parse(withoutIngestion).success).toBe(true);
  });

  it('tỷ lệ là 0 khi chưa có chuyến nào', () => {
    const empty = { totalSessionCount: 0, completedCount: 0, completedRate: 0, abandonedCount: 0, abandonedRate: 0 };
    expect(parse(empty).success).toBe(true);
  });

  it('số đếm ≥ 0, tỷ lệ trong 0..1 và khớp số đếm', () => {
    expect(parse({ ...rpt01, completedCount: -1 }).success).toBe(false);
    expect(parse({ ...rpt01, completedRate: 1.2 }).success).toBe(false);
    expect(parse({ ...rpt01, completedRate: 0.5 }).success).toBe(false);
    expect(parse({ ...rpt01, abandonedCount: 2 }).success).toBe(false);
  });
});

describe('RPT-02 (spec-M03 §5.1 Report outputs)', () => {
  const item = {
    routeId: 'r1',
    routeName: 'Tuyến thử',
    checkpointId: 'c1',
    checkpointName: 'Điểm 1',
    sequence: 1,
    uniqueSessionCount: 7,
  };
  const parse = (value: unknown) => rpt02OutputSchema.safeParse(value);

  it('nhận output hợp lệ; items có thể rỗng', () => {
    expect(parse({ items: [item] }).success).toBe(true);
    expect(parse({ items: [] }).success).toBe(true);
  });

  it.each(Object.keys(item))('phần tử thiếu %s → không hợp lệ', (field) => {
    const broken: Record<string, unknown> = { ...item };
    delete broken[field];
    expect(parse({ items: [broken] }).success).toBe(false);
  });

  it('một phần tử cho mỗi (routeId, checkpointId)', () => {
    expect(parse({ items: [item, { ...item, uniqueSessionCount: 1 }] }).success).toBe(false);
    expect(parse({ items: [item, { ...item, routeId: 'r2' }] }).success).toBe(true);
  });

  it('uniqueSessionCount ≥ 0', () => {
    expect(parse({ items: [{ ...item, uniqueSessionCount: -1 }] }).success).toBe(false);
  });
});
