import { formatMessage, type MessageKey, type MessagePlaceholder, type MessageValues } from './catalog';

export type MessageProps<K extends MessageKey> = { messageKey: K } & (MessagePlaceholder<K> extends never
  ? { values?: MessageValues<K> }
  : { values: MessageValues<K> });

/**
 * Component duy nhất render thông báo của M03: chỉ nhận khóa danh mục và giá trị thường,
 * không nhận chuỗi tự do (BR-M03-L10, L13).
 */
export function Message<K extends MessageKey>({ messageKey, values }: MessageProps<K>) {
  const render = formatMessage as (key: MessageKey, values?: Record<string, string | number>) => string;
  return <>{render(messageKey, values as Record<string, string | number> | undefined)}</>;
}
