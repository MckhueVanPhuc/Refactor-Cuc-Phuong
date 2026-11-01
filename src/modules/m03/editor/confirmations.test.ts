// Hộp xác nhận chỉ có cho danh sách khép kín của BR-M03-L12 (spec-M03 3.7 clarification 7 thêm Hủy mục chưa từng
// xuất bản): mỗi loại một khóa §5.6 và đúng hai nút. Phần quét mã nguồn bảo đảm không màn nào tự dựng hộp xác nhận.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatMessage, MESSAGE_KEYS } from '../messages/catalog';
import { closeCheckpointConfirmation, CONFIRMATION_KINDS, CONFIRMATIONS, confirmation } from './confirmations';

const EXPECTED_KEYS = {
  CLOSE_ROUTE: 'MSG-CONFIRM-CLOSE-ROUTE',
  REOPEN_ROUTE: 'MSG-CONFIRM-REOPEN-ROUTE',
  ARCHIVE_ROUTE: 'MSG-CONFIRM-ARCHIVE-ROUTE',
  DISCARD_ROUTE: 'MSG-CONFIRM-DISCARD-ROUTE',
  CLOSE_CHECKPOINT: 'MSG-CLOSE-AFFECTS-ROUTES',
  REOPEN_CHECKPOINT: 'MSG-CONFIRM-REOPEN-CHECKPOINT',
  ARCHIVE_CHECKPOINT: 'MSG-CONFIRM-ARCHIVE-CHECKPOINT',
  DISCARD_CHECKPOINT: 'MSG-CONFIRM-DISCARD-CHECKPOINT',
  REVOKE_QR: 'MSG-CONFIRM-REVOKE-QR',
  DISCARD_QR: 'MSG-CONFIRM-DISCARD-QR',
  PUBLISH: 'MSG-CONFIRM-PUBLISH',
  UNSAVED_CHANGES: 'MSG-UNSAVED-CHANGES',
} as const;

describe('danh sách hộp xác nhận (BR-M03-L12)', () => {
  it('đúng 12 loại: đóng, mở lại, lưu trữ, hủy mục chưa xuất bản, thu hồi, xuất bản, rời trang chưa lưu', () => {
    expect([...CONFIRMATION_KINDS].sort()).toEqual(Object.keys(EXPECTED_KEYS).sort());
  });

  it.each(Object.entries(EXPECTED_KEYS))('%s dùng khóa %s', (kind, messageKey) => {
    expect(CONFIRMATIONS[kind as keyof typeof EXPECTED_KEYS].messageKey).toBe(messageKey);
  });

  it('đóng điểm dừng: câu các tuyến liệt kê (MSG-CLOSE-AFFECTS-ROUTES) và câu các tuyến sẽ tự đóng (MSG-CLOSE-ROUTE-AUTO)', () => {
    expect(CONFIRMATIONS.CLOSE_CHECKPOINT).toMatchObject({
      messageKey: 'MSG-CLOSE-AFFECTS-ROUTES',
      autoCloseMessageKey: 'MSG-CLOSE-ROUTE-AUTO',
      noRoutesMessageKey: 'MSG-CLOSE-NO-ROUTES',
    });
  });

  it('đóng điểm dừng không có tuyến nào liệt kê → MSG-CLOSE-NO-ROUTES (spec-M03 3.7 clarification 9)', () => {
    expect(closeCheckpointConfirmation([]).title).toBe(formatMessage('MSG-CLOSE-NO-ROUTES'));
    expect(closeCheckpointConfirmation(['Tuyến A', 'Tuyến B']).title).toBe(
      formatMessage('MSG-CLOSE-AFFECTS-ROUTES', { số: 2, 'danh sách': 'Tuyến A, Tuyến B' }),
    );
  });

  it('mỗi hộp có đúng hai nút: nút an toàn và nút xác nhận, chữ khác nhau và không rỗng', () => {
    for (const kind of CONFIRMATION_KINDS) {
      const { safeLabel, confirmLabel } = CONFIRMATIONS[kind];
      expect(safeLabel.trim()).not.toBe('');
      expect(confirmLabel.trim()).not.toBe('');
      expect(safeLabel).not.toBe(confirmLabel);
    }
  });

  it('mọi khóa MSG-CONFIRM-* của danh mục đều thuộc một loại; không loại nào dùng khóa ngoài danh mục', () => {
    const used = new Set<string>(CONFIRMATION_KINDS.map((kind) => CONFIRMATIONS[kind].messageKey));
    for (const key of MESSAGE_KEYS.filter((k) => k.startsWith('MSG-CONFIRM-'))) expect(used.has(key)).toBe(true);
    for (const key of used) expect(MESSAGE_KEYS).toContain(key);
  });

  it('confirmation() trả câu hậu quả đã điền tên và hai nhãn nút', () => {
    expect(confirmation('DISCARD_ROUTE', { tên: 'Đường lên Mả Tổ' })).toEqual({
      title: formatMessage('MSG-CONFIRM-DISCARD-ROUTE', { tên: 'Đường lên Mả Tổ' }),
      safeLabel: CONFIRMATIONS.DISCARD_ROUTE.safeLabel,
      confirmLabel: CONFIRMATIONS.DISCARD_ROUTE.confirmLabel,
    });
    expect(confirmation('UNSAVED_CHANGES').title).toBe(formatMessage('MSG-UNSAVED-CHANGES'));
  });
});

// ---- Quét mã nguồn: hộp xác nhận chỉ dựng qua confirmations.ts ----

const m03Dir = join(process.cwd(), 'src', 'modules', 'm03');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const rel = (file: string) => relative(m03Dir, file).split(sep).join('/');
const sources = walk(m03Dir).filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.includes(`${sep}testing${sep}`));

/** Khung hộp thoại dùng chung: nhận title/nhãn nút từ nơi gọi */
const DIALOG_WRAPPERS = new Set(['editor/ReasonDialog.tsx', 'operations/OperationDialog.tsx']);

/** Mỗi phần tử `<Dialog …>` / `<ReasonDialog …>` từ thẻ mở tới dòng đóng thẻ (`/>` hoặc `>`) */
function dialogElements(source: string): string[] {
  const lines = source.split('\n');
  const elements: string[] = [];
  lines.forEach((line, index) => {
    if (!/<(Dialog|ReasonDialog)\b/.test(line)) return;
    const end = lines.findIndex((candidate, i) => i >= index && /(^\s*\/?>\s*$)|\/>\s*$/.test(candidate));
    elements.push(lines.slice(index, end === -1 ? undefined : end + 1).join('\n'));
  });
  return elements;
}

describe('không có hộp xác nhận nào ngoài danh sách (BR-M03-L12)', () => {
  it('mọi <Dialog>/<ReasonDialog> của M03 lấy câu và nút từ confirmation()', () => {
    const elements = sources
      .filter((file) => !DIALOG_WRAPPERS.has(rel(file)))
      .flatMap((file) => dialogElements(readFileSync(file, 'utf8')).map((element) => [rel(file), element] as const));
    // Bảy hộp đã có: hủy tuyến (2 màn), hủy điểm dừng, xuất bản, thu hồi QR, hủy QR, rời trang chưa lưu
    expect(elements.length).toBeGreaterThanOrEqual(7);
    const offenders = elements.filter(([, element]) => !element.includes('{...confirmation(')).map(([file]) => file);
    expect(offenders).toEqual([]);
  });

  it('mọi nơi dùng <OperationDialog> (đóng, mở lại, lưu trữ) lấy câu hậu quả từ confirmation()', () => {
    const users = sources.filter((file) => /<OperationDialog\b/.test(readFileSync(file, 'utf8')));
    expect(users.length).toBeGreaterThanOrEqual(3);
    expect(users.filter((file) => !readFileSync(file, 'utf8').includes('confirmation(')).map(rel)).toEqual([]);
  });

  it('khóa MSG-CONFIRM-*, MSG-UNSAVED-CHANGES, MSG-CLOSE-AFFECTS-ROUTES, MSG-CLOSE-NO-ROUTES, MSG-CLOSE-ROUTE-AUTO chỉ được chọn trong confirmations.ts', () => {
    const pattern = /formatMessage(?:FromServer)?\(\s*'(MSG-CONFIRM-[A-Z-]+|MSG-UNSAVED-CHANGES|MSG-CLOSE-AFFECTS-ROUTES|MSG-CLOSE-NO-ROUTES|MSG-CLOSE-ROUTE-AUTO)'/;
    const offenders = sources.filter((file) => rel(file) !== 'editor/confirmations.ts' && pattern.test(readFileSync(file, 'utf8'))).map(rel);
    expect(offenders).toEqual([]);
  });
});
