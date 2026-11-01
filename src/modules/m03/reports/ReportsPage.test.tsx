// SCR-M03-005 Báo cáo vận hành (tasks T153; BR-M03-J05–J08; SC-M03-035): ghi chú một dòng MSG-REPORT-UPDATED hoặc
// MSG-REPORT-NO-DATA-YET, ngay dưới là MSG-REPORT-SCOPE, dưới bảng RPT-02 là MSG-REPORT-VISIT-MEANING; không có
// chuyến đi → MSG-REPORT-EMPTY; chỉ lỗi tải dùng kiểu cảnh báo với MSG-GENERIC; "Chuyến đi", "Hoàn thành"/"Bỏ dở".
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import { formatMessage } from '../messages/catalog';
import { formatDate, formatTime } from '../messages/format';
import { renderAdmin } from '../testing/renderAdmin';
import { seedSessionRecords, syntheticSession } from '../testing/seedSessions';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { publishSeededRoute, seedRoute } from '../testing/seedRoutes';

const PAGE_TEST_TIMEOUT = 15_000;

beforeAll(() => import('./ReportsPage'));

async function storeWithSessions() {
  const store = new FakeStore();
  const { checkpointId } = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED', visitPoints: [{ name: 'Cây chò', ready: true }], publish: true });
  const { routeId } = await seedRoute(store, { complete: true, checkpointIds: [checkpointId] });
  await publishSeededRoute(store, routeId);
  const visit = [{ checkpointId, checkpointName: 'Hang Con Moong', sequence: 1 }];
  const sessions = [syntheticSession(routeId, 3, 'HOAN_TAT', visit), syntheticSession(routeId, 2, 'HOAN_TAT', visit), syntheticSession(routeId, 1, 'BO_DO')];
  seedSessionRecords(store, sessions);
  return { store, latest: sessions[2]!.ingestedAt };
}

async function openReports(store = new FakeStore()) {
  const view = renderAdmin('/admin/reports', { store, signedInAs: 'CONTENT_STAFF' });
  await screen.findByRole('heading', { level: 1, name: 'Báo cáo vận hành' }, { timeout: 5_000 });
  return view;
}

describe('SCR-M03-005 Báo cáo vận hành (BR-M03-J05–J08)', { timeout: PAGE_TEST_TIMEOUT }, () => {
  it('chưa có chuyến đi nào: MSG-REPORT-NO-DATA-YET rồi MSG-REPORT-SCOPE, số 0, MSG-REPORT-EMPTY; không có banner', async () => {
    await openReports();
    const noData = await screen.findByText(formatMessage('MSG-REPORT-NO-DATA-YET'));
    const scope = screen.getByText(formatMessage('MSG-REPORT-SCOPE'));
    expect(noData.compareDocumentPosition(scope) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(formatMessage('MSG-REPORT-EMPTY'))).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('có chuyến đi: MSG-REPORT-UPDATED theo giờ Việt Nam; RPT-01 dùng "Chuyến đi", "Hoàn thành", "Bỏ dở" và phần trăm', async () => {
    const { store, latest } = await storeWithSessions();
    await openReports(store);
    expect(await screen.findByText(formatMessage('MSG-REPORT-UPDATED', { giờ: formatTime(latest), ngày: formatDate(latest) }))).toBeTruthy();
    const summary = within(screen.getByRole('tabpanel'));
    expect(summary.getByText('Tổng số chuyến đi').parentElement?.textContent).toMatch(/3/);
    expect(summary.getByText('Hoàn thành').parentElement?.textContent).toMatch(/2.*66,7\s?%/);
    expect(summary.getByText('Bỏ dở').parentElement?.textContent).toMatch(/1.*33,3\s?%/);
  });

  it('RPT-02: bảng có tên tuyến, tên điểm dừng, thứ tự, số chuyến đi; dưới bảng là MSG-REPORT-VISIT-MEANING', async () => {
    const { store } = await storeWithSessions();
    await openReports(store);
    await userEvent.click(screen.getByRole('tab', { name: 'Lượt ghé theo điểm dừng' }));
    const table = await screen.findByRole('table', { name: 'Lượt ghé theo điểm dừng' });
    const row = within(table).getByRole('row', { name: /Đường lên Mả Tổ/ });
    expect(row.textContent).toMatch(/Hang Con Moong.*1.*2/);
    const meaning = screen.getByText(formatMessage('MSG-REPORT-VISIT-MEANING'));
    expect(table.compareDocumentPosition(meaning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('ngày không hợp lệ: chỉ một ngày → MSG-REPORT-DATES-INVALID; 367 ngày → MSG-REPORT-SPAN; không gửi truy vấn', async () => {
    const { services } = await openReports();
    const query = vi.spyOn(services.api, 'reportRpt01');
    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '01/10/2026' } });
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '' } });
    expect(await screen.findByText(formatMessage('MSG-REPORT-DATES-INVALID'))).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Áp dụng' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '01/01/2026' } });
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '02/01/2027' } });
    expect(await screen.findByText(formatMessage('MSG-REPORT-SPAN', { 'tối đa': 366 }))).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Áp dụng' }) as HTMLButtonElement).disabled).toBe(true);
    expect(query).not.toHaveBeenCalled();
  });

  it('lỗi tải → cảnh báo MSG-GENERIC; các dòng ghi chú khác không dùng kiểu cảnh báo', async () => {
    const store = new FakeStore();
    const view = renderAdmin('/admin/reports', { store, signedInAs: 'CONTENT_STAFF' });
    vi.spyOn(view.services.api, 'reportRpt01').mockRejectedValue(new Error('hỏng'));
    await screen.findByRole('heading', { level: 1, name: 'Báo cáo vận hành' }, { timeout: 5_000 });
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(formatMessage('MSG-GENERIC')));
    expect(within(screen.getByRole('alert')).queryByText(formatMessage('MSG-REPORT-SCOPE'))).toBeNull();
  });
});
