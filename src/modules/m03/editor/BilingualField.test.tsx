import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AdminServicesProvider } from '../api/AdminApiProvider';
import { createFakeServices } from '../api/fake/fakeAdminApi';
import { createFakeTranslator, type FakeTranslator } from '../translation/fakeTranslator';
import { BilingualField, type BilingualValue } from './BilingualField';

function Harness({
  translator,
  initial = { vi: '', en: '' },
  multiline = false,
  readOnly = false,
}: {
  translator: FakeTranslator;
  initial?: BilingualValue;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  const [value, setValue] = useState(initial);
  return (
    <AdminServicesProvider services={createFakeServices(undefined, translator)}>
      <BilingualField
        fieldKey="name"
        label="Tên tuyến"
        value={value}
        onChange={setValue}
        maxChars={100}
        multiline={multiline}
        errorFor={() => undefined}
        readOnly={readOnly}
      />
    </AdminServicesProvider>
  );
}

const english = () => screen.getByLabelText('Tên tuyến (tiếng Anh)') as HTMLInputElement | HTMLTextAreaElement;
const button = () => screen.getByRole('button', { name: 'Dịch sang tiếng Anh' });

/**
 * Bộ dịch giả chỉ trả kết quả khi test gọi `release()`: trạng thái "đang dịch" không phụ thuộc đồng hồ, nên test không
 * chập chờn khi máy tải nặng (trước đây dùng độ trễ 20 ms / 150 ms và đôi khi bản dịch về trước khi test kịp kiểm).
 */
function gatedTranslator(): FakeTranslator & { release(): void; translated(): Promise<void> } {
  const inner = createFakeTranslator({ delayMs: 0 });
  let open: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    open = resolve;
  });
  let done: () => void = () => {};
  const finished = new Promise<void>((resolve) => {
    done = resolve;
  });
  return {
    setMode: (mode) => inner.setMode(mode),
    get requestCount() {
      return inner.requestCount;
    },
    async translate(request) {
      await gate;
      const result = await inner.translate(request);
      done();
      return result;
    },
    release: () => open(),
    /** Bản dịch đã trả về cho component (kể cả khi component bỏ nó) */
    translated: () => finished,
  };
}

describe('BilingualField — nút dịch (spec-AI_integration)', () => {
  it('nhãn, fieldKey và lang của hai ô giữ nguyên; nút chữ "→" có tên truy cập', () => {
    render(<Harness translator={createFakeTranslator({ delayMs: 0 })} />);
    const vi = screen.getByLabelText('Tên tuyến (tiếng Việt)');
    expect(vi.getAttribute('data-field-key')).toBe('name.vi');
    expect(vi.getAttribute('lang')).toBe('vi');
    expect(english().getAttribute('data-field-key')).toBe('name.en');
    expect(button().textContent).toBe('→');
  });

  it('ô tiếng Việt trống thì nút không bấm được (BR-AI-01)', () => {
    render(<Harness translator={createFakeTranslator({ delayMs: 0 })} />);
    expect((button() as HTMLButtonElement).disabled).toBe(true);
  });

  it('form chỉ đọc thì không có nút (BR-AI-07)', () => {
    render(<Harness translator={createFakeTranslator({ delayMs: 0 })} initial={{ vi: 'Rừng', en: '' }} readOnly />);
    expect(screen.queryByRole('button', { name: 'Dịch sang tiếng Anh' })).toBeNull();
  });

  it('bấm → "Đang dịch…" gắn với ô tiếng Anh, rồi ô tiếng Anh có bản dịch (BR-AI-01, BR-AI-02)', async () => {
    const translator = gatedTranslator();
    render(<Harness translator={translator} />);
    await userEvent.type(screen.getByLabelText('Tên tuyến (tiếng Việt)'), 'Rừng nguyên sinh');
    expect(translator.requestCount).toBe(0);
    await userEvent.click(button());
    const status = await screen.findByRole('status');
    expect(status.textContent).toBe('Đang dịch…');
    expect((english().getAttribute('aria-describedby') ?? '').split(' ')).toContain(status.id);
    translator.release();
    await waitFor(() => expect(english().value).toBe('Rừng nguyên sinh (en)'));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('thay chữ tiếng Anh đã có, không hỏi xác nhận (BR-AI-02)', async () => {
    render(<Harness translator={createFakeTranslator({ delayMs: 0 })} initial={{ vi: 'Rừng', en: 'Old text' }} />);
    await userEvent.click(button());
    await waitFor(() => expect(english().value).toBe('Rừng (en)'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ô một dòng gửi NOT_ALLOWED, ô nhiều dòng gửi ALLOWED và giữ xuống dòng (BR-AI-11)', async () => {
    render(<Harness translator={createFakeTranslator({ delayMs: 0 })} initial={{ vi: 'Dòng một\nDòng hai', en: '' }} multiline />);
    await userEvent.click(button());
    await waitFor(() => expect(english().value).toBe('Dòng một\nDòng hai (en)'));
  });

  it('lỗi → thông báo kèm "Thử lại", ô tiếng Anh giữ nguyên; thử lại thành công (BR-AI-09)', async () => {
    const translator = createFakeTranslator({ delayMs: 0 });
    translator.setMode('fail');
    render(<Harness translator={translator} initial={{ vi: 'Rừng', en: 'Giữ' }} />);
    await userEvent.click(button());
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Chưa dịch được. Hãy bấm "Thử lại" hoặc tự nhập tiếng Anh.');
    expect(english().value).toBe('Giữ');
    translator.setMode('ok');
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(english().value).toBe('Rừng (en)'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('gõ ô tiếng Anh xóa thông báo lỗi (BR-AI-09)', async () => {
    const translator = createFakeTranslator({ delayMs: 0 });
    translator.setMode('fail');
    render(<Harness translator={translator} initial={{ vi: 'Rừng', en: '' }} />);
    await userEvent.click(button());
    await screen.findByRole('alert');
    await userEvent.type(english(), 'F');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('gõ ô tiếng Anh trong lúc dịch → kết quả bị bỏ, giữ chữ đã gõ (BR-AI-04)', async () => {
    const translator = gatedTranslator();
    render(<Harness translator={translator} initial={{ vi: 'Rừng', en: '' }} />);
    await userEvent.click(button());
    await screen.findByRole('status');
    await userEvent.type(english(), 'Forest');
    // Bản dịch về sau khi du khách đã gõ: phải bị bỏ
    translator.release();
    await act(() => translator.translated());
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
    expect(english().value).toBe('Forest');
  });
});
