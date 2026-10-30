// Phần dùng chung của "đặt mật khẩu" ở nhận lời mời và hoàn tất khôi phục (SCR-M03-007).
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { useAuthService } from '../api/AdminApiProvider';
import type { MessageKey } from '../messages/catalog';
import { toAuthError, type LinkKind } from './authService';

/** Tạo phiên từ link trong URL đúng một lần (link của provider dùng một lần) */
export function useLinkSession(kind: LinkKind, enabled = true): 'checking' | 'valid' | 'invalid' {
  const auth = useAuthService();
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    void auth.consumeLink(kind, location.search + location.hash).then((result) => {
      setStatus(result === 'OK' ? 'valid' : 'invalid');
    });
  }, [auth, kind, enabled, location.search, location.hash]);

  return status;
}

/** Khóa thông báo cho lỗi đặt mật khẩu của provider */
export function passwordFailureKey(error: unknown): MessageKey {
  switch (toAuthError(error).kind) {
    case 'PASSWORD_REJECTED':
      return 'MSG-PASSWORD-REJECTED';
    case 'LINK_INVALID':
      return 'MSG-LINK-INVALID';
    case 'NETWORK':
      return 'MSG-NETWORK-FAILED';
    default:
      return 'MSG-GENERIC';
  }
}
