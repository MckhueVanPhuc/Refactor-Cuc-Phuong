// ScanNotice (tasks T058; BR-M02-015; FR-M02-013; US-M02-04 mục 2–4) với cổng M01 giả.
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECKPOINTS } from '../api/fake/fixtures';
import { en } from '../i18n/en';
import { vi as viMessages } from '../i18n/vi';
import { resolveScan } from '../scan/resolveScan';
import { fakeM01 } from '../testing/fakeM01Port';
import { ScanNotice, type ScanNoticeKind } from './ScanNotice';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));

/** Đi qua resolveScan để chắc hai scope cho cùng một thông báo, không chỉ cùng một prop. */
function closedNotice(closedScope: 'ROUTE' | 'CHECKPOINT') {
  const { display } = resolveScan({ journey: CHECKPOINTS, qrIdentifier: 'Q1a', lookup: { kind: 'TEMPORARILY_CLOSED', closedScope } });
  return <ScanNotice kind={display.kind as ScanNoticeKind} />;
}

beforeEach(() => {
  fakeM01.reset();
  fakeM01.setLanguage({ languageCode: 'vi' });
});

describe('ScanNotice', () => {
  it('tạm đóng: cùng một câu cho ROUTE và CHECKPOINT, đúng nguyên văn vi/en (US-M02-04 mục 3)', () => {
    for (const scope of ['ROUTE', 'CHECKPOINT'] as const) {
      const { unmount } = render(closedNotice(scope));
      expect(screen.getByRole('alert').textContent).toBe(viMessages.notice.temporarilyClosed);
      act(() => fakeM01.setLanguage({ languageCode: 'en' }));
      expect(screen.getByRole('alert').textContent).toBe(en.notice.temporarilyClosed);
      act(() => fakeM01.setLanguage({ languageCode: 'vi' }));
      unmount();
    }
    expect(viMessages.notice.temporarilyClosed).toBe(
      'Khu vực này đang tạm đóng. Vui lòng dừng lại hoặc quay về theo hướng dẫn của Ban Quản lý.',
    );
  });

  it('INVALID → "Mã không còn hiệu lực hoặc không tồn tại."', () => {
    render(<ScanNotice kind="INVALID" />);
    expect(screen.getByRole('alert').textContent).toBe(viMessages.notice.invalid);
  });

  it('lỗi kết nối không bao giờ hiện là mã không hợp lệ, cũng không là thông báo đóng (FR-M02-013)', () => {
    const { display } = resolveScan({ journey: CHECKPOINTS, qrIdentifier: 'QX', lookup: { kind: 'SOURCE_ERROR' } });
    render(<ScanNotice kind={display.kind as ScanNoticeKind} />);
    const text = screen.getByRole('alert').textContent!;
    expect(text).toBe(viMessages.notice.connectionNeeded);
    expect(text).not.toContain(viMessages.notice.invalid);
    expect(text).not.toContain(viMessages.notice.temporarilyClosed);
  });

  it('khách tự do: kèm gợi ý khách tự do', () => {
    render(<ScanNotice kind="CONNECTION_NEEDED" freeVisitor />);
    expect(screen.getByRole('alert').textContent).toContain(viMessages.notice.freeVisitor);
  });
});
