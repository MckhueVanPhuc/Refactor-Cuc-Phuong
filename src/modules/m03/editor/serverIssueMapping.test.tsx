// Issue VALIDATION do server trả về rơi đúng trường ở cả ba editor; lưu lỗi không mất chữ đang gõ
// (BR-M03-L02, L04, L06; SC-M03-016). Server được giả lập bằng cách thay kết quả của command lưu một lần.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FakeStore } from '../api/fake/store';
import type { CommandFailure } from '../contracts/commandResult';
import type { MessageKey } from '../messages/catalog';
import { formatMessage } from '../messages/catalog';
import { renderAdmin } from '../testing/renderAdmin';
import { seedCheckpoint } from '../testing/seedCheckpoints';
import { seedRoute } from '../testing/seedRoutes';
import { makeIssue } from '../validation/common';

// Dựng cả editor và gõ phím: khi cả bộ test chạy song song, một ca có thể vượt mặc định 5 s
const EDITOR_TEST_TIMEOUT = 15_000;

beforeAll(() =>
  Promise.all([
    import('../route-admin/RouteEditorPage'),
    import('../checkpoint-library/CheckpointEditorPage'),
    import('../visit-points/VisitPointEditorPage'),
  ]),
);

/** Kết quả VALIDATION như server trả: một issue BLOCKS_SAVE MSG-LIMIT-TEXT trên `fieldKey` */
function serverRejects(itemType: 'ROUTE' | 'CHECKPOINT' | 'QRCODE', itemId: string, fieldKey: string, fieldName: string): CommandFailure {
  const issue = makeIssue({
    itemType,
    itemId,
    severity: 'BLOCKS_SAVE',
    fieldKey,
    messageKey: 'MSG-LIMIT-TEXT',
    values: { 'Tên ô': fieldName, 'tối đa': 100, số: 120 },
  });
  return { ok: false, reason: 'VALIDATION', messageKey: issue.messageKey as MessageKey, issues: [issue] };
}

/** Dòng "Lỗi: …" mà ô có nhãn `label` trỏ tới qua aria-describedby (lỗi nằm ngay dưới ô) */
function errorUnder(label: string): string | undefined {
  const control = screen.getByLabelText(label);
  const ids = (control.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  return ids.map((id) => document.getElementById(id)?.textContent ?? '').find((text) => text.startsWith('Lỗi: '));
}

const valueOf = (label: string) => (screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement).value;
const save = () => userEvent.click(screen.getByRole('button', { name: 'Lưu bản nháp' }));

describe('issue từ server rơi đúng trường (BR-M03-L02, L04)', { timeout: EDITOR_TEST_TIMEOUT }, () => {
  it('editor tuyến: issue ở bước khác → chuyển tới bước đó, lỗi dưới đúng ô; chữ ở bước 1 vẫn còn', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { content: { name: { vi: 'Đường lên Mả Tổ', en: 'Ma To trail' } } });
    const { services } = renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' });
    const label = 'Điểm xuất phát và cách đến (tiếng Việt)';
    const rejected = serverRejects('ROUTE', routeId, 'startingPoint.vi', label);
    const spy = vi.spyOn(services.api, 'saveRouteDraft').mockResolvedValueOnce(rejected);

    await userEvent.type(screen.getByLabelText('Mô tả ngắn (tiếng Việt)'), 'Rừng già');
    await save();

    expect(spy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(errorUnder(label)).toMatch(/^Lỗi: Điểm xuất phát và cách đến \(tiếng Việt\) dài quá 100 ký tự/));
    expect(screen.queryByText(formatMessage('MSG-SAVED'))).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Thẻ tuyến/ }));
    expect(valueOf('Mô tả ngắn (tiếng Việt)')).toBe('Rừng già');
  });

  it('editor điểm dừng: issue trên tên tiếng Anh → lỗi dưới ô đó; ghi chú vị trí đang gõ vẫn còn', async () => {
    const store = new FakeStore();
    const { checkpointId } = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED' });
    const { services } = renderAdmin(`/admin/checkpoints/${checkpointId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Hang Con Moong' });
    const label = 'Tên điểm dừng (tiếng Anh)';
    const rejected = serverRejects('CHECKPOINT', checkpointId, 'checkpointName.en', label);
    vi.spyOn(services.api, 'saveCheckpointDraft').mockResolvedValueOnce(rejected);

    await userEvent.type(screen.getByLabelText('Ghi chú vị trí'), 'Cạnh nhà chờ');
    await save();

    await waitFor(() => expect(errorUnder(label)).toMatch(/^Lỗi: Tên điểm dừng \(tiếng Anh\) dài quá 100 ký tự/));
    expect(errorUnder('Tên điểm dừng (tiếng Việt)')).toBeUndefined();
    expect(valueOf('Ghi chú vị trí')).toBe('Cạnh nhà chờ');
  });

  it('editor điểm tham quan: issue trên giới thiệu tiếng Anh → lỗi dưới ô đó; tên đang gõ vẫn còn', async () => {
    const store = new FakeStore();
    const { checkpointId } = await seedCheckpoint(store, { name: 'Hang Con Moong', mode: 'OFFLINE_REQUIRED' });
    const { services } = renderAdmin(`/admin/checkpoints/${checkpointId}/visit-points/new`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Điểm tham quan mới' });
    const label = 'Giới thiệu (tiếng Anh)';
    const rejected = serverRejects('QRCODE', 'qr-moi', 'introductionText.en', label);
    vi.spyOn(services.api, 'saveVisitPointDraft').mockResolvedValueOnce(rejected);

    await userEvent.type(screen.getByLabelText('Tên đối tượng (tiếng Việt)'), 'Cây chò');
    await save();

    await waitFor(() => expect(errorUnder(label)).toMatch(/^Lỗi: Giới thiệu \(tiếng Anh\) dài quá 100 ký tự/));
    expect(valueOf('Tên đối tượng (tiếng Việt)')).toBe('Cây chò');
    expect(store.state.qrCodes.size).toBe(0);
  });
});

describe('lưu lỗi không mất chữ (BR-M03-L06)', { timeout: EDITOR_TEST_TIMEOUT }, () => {
  it('mất mạng khi lưu tuyến → thông báo lỗi chung, chữ đang gõ vẫn còn, không có MSG-SAVED', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { content: { name: { vi: 'Đường lên Mả Tổ', en: 'Ma To trail' } } });
    const { services } = renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' });
    vi.spyOn(services.api, 'saveRouteDraft').mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await userEvent.type(screen.getByLabelText('Mô tả ngắn (tiếng Việt)'), 'Rừng già');
    await save();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).not.toMatch(/fetch|TypeError/i);
    expect(screen.queryByText(formatMessage('MSG-SAVED'))).toBeNull();
    expect(valueOf('Mô tả ngắn (tiếng Việt)')).toBe('Rừng già');
  });
});

describe('vấn đề chặn xuất bản phát hiện được khi lưu được báo ngay trong editor (BR-M03-L02)', { timeout: EDITOR_TEST_TIMEOUT }, () => {
  it('tuyến chưa có điểm dừng hoạt động: panel báo MSG-NO-ACTIVE-CHECKPOINT ngay sau khi lưu, không đợi tới màn xuất bản', async () => {
    const store = new FakeStore();
    const { routeId } = await seedRoute(store, { complete: true });
    renderAdmin(`/admin/routes/${routeId}`, { store, signedInAs: 'CONTENT_STAFF' });
    await screen.findByRole('heading', { level: 1, name: 'Đường lên Mả Tổ' });
    await userEvent.type(screen.getByLabelText('Mô tả ngắn (tiếng Việt)'), ' mới');
    await save();
    expect(await screen.findByText(formatMessage('MSG-SAVED'))).toBeTruthy();
    const panel = within(screen.getByRole('region', { name: 'Còn thiếu để xuất bản' }));
    expect(panel.getByRole('button', { name: formatMessage('MSG-NO-ACTIVE-CHECKPOINT') })).toBeTruthy();
  });
});
