// Lỗi transport của adapter → khóa danh mục (research R-06; admin-command §8).
// Chi tiết kỹ thuật chỉ vào console; UI chỉ nhận messageKey (BR-M03-L10).

export type TransportMessageKey = 'MSG-NETWORK-FAILED' | 'MSG-SESSION-EXPIRED' | 'MSG-NO-PERMISSION' | 'MSG-GENERIC';

type ErrorLike = { name?: unknown; code?: unknown; status?: unknown; message?: unknown };

const NETWORK_ERROR_NAMES = new Set(['AbortError', 'TimeoutError', 'FunctionsFetchError', 'FunctionsRelayError']);
const SESSION_ERROR_NAMES = new Set(['AuthSessionMissingError', 'AuthInvalidJwtError']);
// PGRST301: JWT hết hạn hoặc không hợp lệ; PGRST302: thiếu JWT khi cần
const SESSION_ERROR_CODES = new Set(['PGRST301', 'PGRST302', 'invalid_jwt', 'session_not_found']);
const PERMISSION_ERROR_CODES = new Set(['42501']);

function classify(error: unknown): TransportMessageKey {
  if (typeof error !== 'object' || error === null) return 'MSG-GENERIC';
  const { name, code, status, message } = error as ErrorLike;
  if (error instanceof TypeError && /fetch|network/i.test(String(message))) return 'MSG-NETWORK-FAILED';
  if (typeof name === 'string' && NETWORK_ERROR_NAMES.has(name)) return 'MSG-NETWORK-FAILED';
  if (typeof name === 'string' && SESSION_ERROR_NAMES.has(name)) return 'MSG-SESSION-EXPIRED';
  if (typeof code === 'string' && SESSION_ERROR_CODES.has(code)) return 'MSG-SESSION-EXPIRED';
  if (status === 401) return 'MSG-SESSION-EXPIRED';
  if (typeof code === 'string' && PERMISSION_ERROR_CODES.has(code)) return 'MSG-NO-PERMISSION';
  if (status === 403) return 'MSG-NO-PERMISSION';
  return 'MSG-GENERIC';
}

export function toTransportMessageKey(error: unknown): TransportMessageKey {
  const key = classify(error);
  console.error('[m03/api]', key, error);
  return key;
}

/** Lỗi adapter ném ra cho query và lỗi transport của command; UI chỉ dùng `messageKey`. */
export class AdminApiError extends Error {
  readonly messageKey: TransportMessageKey;

  constructor(messageKey: TransportMessageKey) {
    super(messageKey);
    this.name = 'AdminApiError';
    this.messageKey = messageKey;
  }

  static from(error: unknown): AdminApiError {
    return error instanceof AdminApiError ? error : new AdminApiError(toTransportMessageKey(error));
  }
}
