import { MESSAGE_CATALOG } from './catalogText';

export { MESSAGE_CATALOG };

/** Union khép kín của mọi khóa MSG-* (spec-M03 §5.6). Khóa nội bộ, không bao giờ hiện trên màn hình. */
export type MessageKey = keyof typeof MESSAGE_CATALOG;

export const MESSAGE_KEYS = Object.keys(MESSAGE_CATALOG) as MessageKey[];

type PlaceholdersOf<S extends string> = S extends `${string}{${infer Name}}${infer Rest}`
  ? Name | PlaceholdersOf<Rest>
  : never;

/** Tên placeholder của một khóa, suy ra từ chính câu chữ, ví dụ MSG-LIMIT-TEXT → 'Tên ô' | 'tối đa' | 'số'. */
export type MessagePlaceholder<K extends MessageKey> = PlaceholdersOf<(typeof MESSAGE_CATALOG)[K]>;

/** Giá trị hiển thị thường: tên như trên UI, số, hh:mm, dd/mm/yyyy — không bao giờ là id hay mã (BR-M03-L10). */
export type MessageValue = string | number;

export type MessageValues<K extends MessageKey> = [MessagePlaceholder<K>] extends [never]
  ? Record<string, never>
  : Record<MessagePlaceholder<K>, MessageValue>;

export function isMessageKey(key: string): key is MessageKey {
  return Object.hasOwn(MESSAGE_CATALOG, key);
}

// MSG-UPLOAD-SUMMARY: câu thứ hai chỉ hiện khi có tệp không tải được (§5.6)
const UPLOAD_FAILED_SENTENCE = ' Chưa tải được: {danh sách}.';

/**
 * Câu thông báo đã điền placeholder. Khóa lạ (ví dụ từ server) → MSG-GENERIC (BR-M03-L13).
 * Placeholder không có giá trị được giữ nguyên để lỗi lộ ra khi kiểm thử.
 */
export function formatMessage<K extends MessageKey>(
  key: K,
  ...[values]: MessagePlaceholder<K> extends never ? [values?: MessageValues<K>] : [values: MessageValues<K>]
): string {
  if (!isMessageKey(key)) return MESSAGE_CATALOG['MSG-GENERIC'];
  const filled = (values ?? {}) as Record<string, MessageValue>;
  let template: string = MESSAGE_CATALOG[key];
  if (key === 'MSG-UPLOAD-SUMMARY' && String(filled['danh sách'] ?? '') === '') {
    template = template.replace(UPLOAD_FAILED_SENTENCE, '');
  }
  return template.replace(/\{([^{}]+)\}/g, (placeholder, name: string) =>
    Object.hasOwn(filled, name) ? String(filled[name]) : placeholder,
  );
}

/** Dùng khi khóa và giá trị đến từ server (`CommandResult.values`), kiểu không biết trước. */
export function formatMessageFromServer(key: string, values: Record<string, MessageValue> = {}): string {
  if (!isMessageKey(key)) return MESSAGE_CATALOG['MSG-GENERIC'];
  return (formatMessage as (k: MessageKey, v: Record<string, MessageValue>) => string)(key, values);
}
