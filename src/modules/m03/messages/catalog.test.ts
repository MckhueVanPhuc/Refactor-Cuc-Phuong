import { describe, expect, it } from 'vitest';
import { formatMessage, isMessageKey, MESSAGE_KEYS } from './catalog';

// Danh sách khóa chép từ spec-M03 §5.6 (T031). Đổi danh mục ở spec thì đổi cả danh sách này.
const SPEC_KEYS = [
  'MSG-SAVED',
  'MSG-PUBLISHED',
  'MSG-LIMIT-TEXT',
  'MSG-NUMBER-POSITIVE',
  'MSG-NUMBER-TOO-BIG',
  'MSG-NUMBER-DECIMALS',
  'MSG-LIMIT-CHECKPOINTS',
  'MSG-LIMIT-QR',
  'MSG-REPORT-SPAN',
  'MSG-FILE-TOO-BIG',
  'MSG-FILE-TYPE',
  'MSG-COUNT-IMAGES',
  'MSG-COUNT-AV',
  'MSG-AV-OFFLINE',
  'MSG-AV-LANGUAGE-MISSING',
  'MSG-AV-ONE-LANGUAGE',
  'MSG-MODE-HAS-AV',
  'MSG-MODE-REQUIRED-FIRST',
  'MSG-TAG-CONFLICT',
  'MSG-CHECKPOINT-NAME-TAKEN',
  'MSG-CHECKPOINT-DUPLICATE',
  'MSG-MAP-TICK-CLEARED',
  'MSG-UPLOAD-SUMMARY',
  'MSG-UPLOADED-NOT-SAVED',
  'MSG-QR-CREATED',
  'MSG-VERSION-DRAFT',
  'MSG-VERSION-PUBLISHED',
  'MSG-PREVIEW-DRAFT',
  'MSG-UNSAVED-CHANGES',
  'MSG-MISSING-FIELD',
  'MSG-MISSING-LANGUAGE',
  'MSG-NO-ACTIVE-CHECKPOINT',
  'MSG-ROUTE-LAST-CHECKPOINT',
  'MSG-CHECKPOINT-LEFT-OUT',
  'MSG-QR-LEFT-OUT',
  'MSG-RIGHTS-NOT-CONFIRMED',
  'MSG-ONLINE-NOT-VERIFIED',
  'MSG-SAFETY-CONFIRM',
  'MSG-OFFLINE-TOO-BIG',
  'MSG-IMAGE-NOT-READABLE',
  'MSG-STALE',
  'MSG-ROUTE-BUSY',
  'MSG-AFFECTED-ROUTES',
  'MSG-PUBLISH-FAILED',
  'MSG-DRAFT-EXISTS',
  'MSG-RESTORE-BLOCKED',
  'MSG-LAST-QR',
  'MSG-CHECKPOINT-IN-USE',
  'MSG-CLOSE-AFFECTS-ROUTES',
  'MSG-CLOSE-NO-ROUTES',
  'MSG-CLOSE-ROUTE-AUTO',
  'MSG-CLOSE-FAILED',
  'MSG-REOPEN-BLOCKED',
  'MSG-REPRINT-MODE-CHANGED',
  'MSG-QR-PRINT-UNPUBLISHED',
  'MSG-LAST-REVIEWER',
  'MSG-NO-PERMISSION',
  'MSG-REPORT-UPDATED',
  'MSG-REPORT-NO-DATA-YET',
  'MSG-REPORT-SCOPE',
  'MSG-REPORT-VISIT-MEANING',
  'MSG-REPORT-EMPTY',
  'MSG-GENERIC',
  'MSG-LOGIN-FAILED',
  'MSG-LOGIN-DENIED',
  'MSG-SESSION-EXPIRED',
  'MSG-NETWORK-FAILED',
  'MSG-RECOVERY-SENT',
  'MSG-LINK-INVALID',
  'MSG-EMAIL-INVALID',
  'MSG-EMAIL-TAKEN',
  'MSG-INVITE-SENT',
  'MSG-INVITE-RESENT',
  'MSG-INVITE-FAILED',
  'MSG-REPORT-DATES-INVALID',
  'MSG-CONFIRM-CLOSE-ROUTE',
  'MSG-CONFIRM-REOPEN-ROUTE',
  'MSG-CONFIRM-ARCHIVE-ROUTE',
  'MSG-CONFIRM-DISCARD-ROUTE',
  'MSG-CONFIRM-REOPEN-CHECKPOINT',
  'MSG-CONFIRM-ARCHIVE-CHECKPOINT',
  'MSG-CONFIRM-DISCARD-CHECKPOINT',
  'MSG-CONFIRM-REVOKE-QR',
  'MSG-CONFIRM-DISCARD-QR',
  'MSG-CONFIRM-PUBLISH',
  'MSG-PASSWORD-REJECTED',
  'MSG-PASSWORD-MISMATCH',
];

describe('danh mục thông báo (spec-M03 §5.6)', () => {
  it('khóa bằng đúng danh sách MSG-* của spec', () => {
    expect([...MESSAGE_KEYS].sort()).toEqual([...SPEC_KEYS].sort());
  });

  it('formatMessage điền placeholder bằng giá trị thường', () => {
    expect(formatMessage('MSG-LIMIT-TEXT', { 'Tên ô': 'Tên tuyến', 'tối đa': 100, số: 120 })).toBe(
      'Tên tuyến dài quá 100 ký tự (hiện có 120). Hãy rút gọn.',
    );
    expect(formatMessage('MSG-SAVED')).toBe('Đã lưu bản nháp.');
  });

  it('khóa lạ → MSG-GENERIC (BR-M03-L13)', () => {
    expect(formatMessage('MSG-KHONG-CO' as never)).toBe(formatMessage('MSG-GENERIC'));
    expect(isMessageKey('MSG-KHONG-CO')).toBe(false);
    expect(isMessageKey('MSG-SAVED')).toBe(true);
  });

  it('MSG-UPLOAD-SUMMARY: câu thứ hai chỉ khi có tệp lỗi', () => {
    expect(formatMessage('MSG-UPLOAD-SUMMARY', { số: 3, tổng: 3, 'danh sách': '' })).toBe('Đã tải 3/3 tệp.');
    expect(formatMessage('MSG-UPLOAD-SUMMARY', { số: 2, tổng: 3, 'danh sách': 'a.jpg' })).toBe(
      'Đã tải 2/3 tệp. Chưa tải được: a.jpg.',
    );
  });

  it('không câu nào chứa từ cấm hiện cho nhân viên', () => {
    const banned = /snapshot|journey version|contentVersion|revision|concurrency|payload|JSON|null|undefined|token|endpoint|status code|ingest|đồng bộ|xung đột trạng thái/i;
    for (const key of MESSAGE_KEYS) expect(formatMessage(key as never), key).not.toMatch(banned);
  });
});
