// Phiên hết hạn (auth-account §2.7; tasks T070): khi adapter trả MSG-SESSION-EXPIRED, cất state form vào
// sessionStorage, đưa về đăng nhập; đăng nhập xong quay lại trang cũ và editor lấy lại state đã cất.
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { allowNextNavigation } from '../editor/useUnsavedChangesGuard';
import { ADMIN_PATHS } from '../paths';
import type { LoginLocationState } from './useSignOut';

const PREFIX = 'cpq:m03:draft:';

export function stashDraft(key: string, state: unknown): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(state));
  } catch {
    // Không có sessionStorage (chế độ riêng tư): vẫn đưa về đăng nhập; chữ chưa lưu có thể mất
  }
}

/** Lấy state đã cất (chỉ một lần) */
export function takeStashedDraft<T = unknown>(key: string): T | undefined {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    sessionStorage.removeItem(PREFIX + key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

/** Trả hàm gọi khi gặp MSG-SESSION-EXPIRED; `preserve` là state form cần giữ */
export function useSessionExpiry(): (preserve?: { key: string; state: unknown }) => void {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (preserve) => {
      if (preserve) stashDraft(preserve.key, preserve.state);
      // State đã được cất, nên không hỏi "rời trang" nữa
      allowNextNavigation();
      const state: LoginLocationState = { expired: true, from: location.pathname + location.search };
      void navigate(ADMIN_PATHS.login, { state });
    },
    [navigate, location.pathname, location.search],
  );
}
