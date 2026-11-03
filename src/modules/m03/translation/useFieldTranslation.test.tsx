import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AdminServicesProvider } from '../api/AdminApiProvider';
import { createFakeServices } from '../api/fake/fakeAdminApi';
import type { TranslationOutcome, TranslationRequest, Translator } from './translationContract';
import { useFieldTranslation } from './useFieldTranslation';

/** Bộ dịch điều khiển tay: mỗi lượt dịch chờ test gọi resolve (spec-AI BR-AI-04, BR-AI-09) */
function controlledTranslator() {
  const pending: { request: TranslationRequest; resolve: (outcome: TranslationOutcome) => void }[] = [];
  const translator: Translator = {
    translate: (request) => new Promise((resolve) => pending.push({ request, resolve })),
  };
  return { translator, pending };
}

function setup(initial: { source: string; lineBreaks?: 'ALLOWED' | 'NOT_ALLOWED'; enabled?: boolean }) {
  const { translator, pending } = controlledTranslator();
  const services = { ...createFakeServices(), translator };
  const setEnglish = vi.fn();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AdminServicesProvider services={services}>{children}</AdminServicesProvider>
  );
  const view = renderHook(
    (props: { source: string; enabled?: boolean }) =>
      useFieldTranslation({
        source: props.source,
        setEnglish,
        lineBreaks: initial.lineBreaks ?? 'NOT_ALLOWED',
        enabled: props.enabled ?? true,
      }),
    { wrapper, initialProps: { source: initial.source, enabled: initial.enabled ?? true } as { source: string; enabled?: boolean } },
  );
  return { ...view, pending, setEnglish };
}

async function settle(resolve: (outcome: TranslationOutcome) => void, outcome: TranslationOutcome) {
  await act(async () => {
    resolve(outcome);
    await Promise.resolve();
  });
}

describe('useFieldTranslation — US-AI-01 (BR-AI-01, 02, 06, 11)', () => {
  it('bấm → translating, gửi text đã trim với lineBreaks; thành công → setEnglish, về idle', async () => {
    const { result, pending, setEnglish } = setup({ source: '  Rừng nguyên sinh  ' });
    expect(result.current.status).toBe('idle');
    expect(result.current.canTranslate).toBe(true);
    act(() => result.current.translate());
    expect(result.current.status).toBe('translating');
    expect(result.current.canTranslate).toBe(false);
    expect(pending[0]!.request).toEqual({
      sourceLanguage: 'vi',
      targetLanguage: 'en',
      text: 'Rừng nguyên sinh',
      lineBreaks: 'NOT_ALLOWED',
    });
    await settle(pending[0]!.resolve, { ok: true, text: 'Primary forest' });
    expect(setEnglish).toHaveBeenCalledWith('Primary forest');
    expect(result.current.status).toBe('idle');
  });

  it('trường một dòng: bỏ xuống dòng trong kết quả (phòng thủ hai lớp, BR-AI-11)', async () => {
    const { result, pending, setEnglish } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    await settle(pending[0]!.resolve, { ok: true, text: 'Line one\nline two' });
    expect(setEnglish).toHaveBeenCalledWith('Line one line two');
  });

  it('trường dài giữ xuống dòng', async () => {
    const { result, pending, setEnglish } = setup({ source: 'Mô tả', lineBreaks: 'ALLOWED' });
    act(() => result.current.translate());
    expect(pending[0]!.request.lineBreaks).toBe('ALLOWED');
    await settle(pending[0]!.resolve, { ok: true, text: 'Line one\nline two' });
    expect(setEnglish).toHaveBeenCalledWith('Line one\nline two');
  });

  it('không bấm được khi nguồn trống/khoảng trắng hoặc form không sửa được (BR-AI-01, BR-AI-07)', () => {
    expect(setup({ source: '   ' }).result.current.canTranslate).toBe(false);
    expect(setup({ source: 'Có chữ', enabled: false }).result.current.canTranslate).toBe(false);
    const { result, pending } = setup({ source: '' });
    act(() => result.current.translate());
    expect(pending).toHaveLength(0);
  });

  it('đang dịch thì bấm lại không gửi thêm', () => {
    const { result, pending } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    act(() => result.current.translate());
    expect(pending).toHaveLength(1);
  });

  it('unmount trước khi có kết quả thì không ghi', async () => {
    const { result, pending, setEnglish, unmount } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    unmount();
    await settle(pending[0]!.resolve, { ok: true, text: 'Name' });
    expect(setEnglish).not.toHaveBeenCalled();
  });
});

describe('useFieldTranslation — US-AI-02 (BR-AI-01, 03, 04, 05)', () => {
  it('không tự dịch khi mount hay khi nguồn đổi', () => {
    const { rerender, pending } = setup({ source: 'Có chữ sẵn' });
    rerender({ source: 'Đã sửa' });
    rerender({ source: '' });
    expect(pending).toHaveLength(0);
  });

  it('nguồn đổi trước khi kết quả về → bỏ kết quả, về idle (BR-AI-04)', async () => {
    const { result, pending, setEnglish, rerender } = setup({ source: 'Cũ' });
    act(() => result.current.translate());
    rerender({ source: 'Mới' });
    await settle(pending[0]!.resolve, { ok: true, text: 'Old' });
    expect(setEnglish).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('chỉ thêm khoảng trắng hai đầu nguồn thì vẫn ghi (so sánh sau trim)', async () => {
    const { result, pending, setEnglish, rerender } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    rerender({ source: 'Tên ' });
    await settle(pending[0]!.resolve, { ok: true, text: 'Name' });
    expect(setEnglish).toHaveBeenCalledWith('Name');
  });

  it('admin gõ ô tiếng Anh trước khi kết quả về → bỏ kết quả (BR-AI-04)', async () => {
    const { result, pending, setEnglish } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    act(() => result.current.onEnglishTyped());
    await settle(pending[0]!.resolve, { ok: true, text: 'Name' });
    expect(setEnglish).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });
});

describe('useFieldTranslation — US-AI-03 (BR-AI-09)', () => {
  it('lỗi → failed; ô tiếng Anh không bị ghi', async () => {
    const { result, pending, setEnglish } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    await settle(pending[0]!.resolve, { ok: false });
    expect(result.current.status).toBe('failed');
    expect(result.current.canTranslate).toBe(true);
    expect(setEnglish).not.toHaveBeenCalled();
  });

  it('retry gửi lại đúng request; thành công thì ghi', async () => {
    const { result, pending, setEnglish } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    await settle(pending[0]!.resolve, { ok: false });
    act(() => result.current.retry());
    expect(result.current.status).toBe('translating');
    expect(pending[1]!.request).toEqual(pending[0]!.request);
    await settle(pending[1]!.resolve, { ok: true, text: 'Name' });
    expect(setEnglish).toHaveBeenCalledWith('Name');
  });

  it('gõ ô tiếng Anh xóa trạng thái lỗi', async () => {
    const { result, pending } = setup({ source: 'Tên' });
    act(() => result.current.translate());
    await settle(pending[0]!.resolve, { ok: false });
    act(() => result.current.onEnglishTyped());
    expect(result.current.status).toBe('idle');
  });

  it('lỗi về sau khi nguồn đổi → idle, không báo lỗi', async () => {
    const { result, pending, rerender } = setup({ source: 'Cũ' });
    act(() => result.current.translate());
    rerender({ source: 'Mới' });
    await settle(pending[0]!.resolve, { ok: false });
    expect(result.current.status).toBe('idle');
  });

  it('bộ dịch throw (không đúng contract) vẫn thành failed, không vỡ form', async () => {
    const services = {
      ...createFakeServices(),
      translator: { translate: () => Promise.reject(new Error('mạng')) } satisfies Translator,
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AdminServicesProvider services={services}>{children}</AdminServicesProvider>
    );
    const { result } = renderHook(
      () => useFieldTranslation({ source: 'Tên', setEnglish: () => {}, lineBreaks: 'NOT_ALLOWED', enabled: true }),
      { wrapper },
    );
    await act(async () => {
      result.current.translate();
      await Promise.resolve();
    });
    expect(result.current.status).toBe('failed');
  });
});
