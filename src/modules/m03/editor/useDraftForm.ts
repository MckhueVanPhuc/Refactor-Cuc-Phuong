import { useCallback, useMemo, useRef, useState } from 'react';
import { AdminApiError } from '../api/errors';
import { takeStashedDraft } from '../auth/useSessionExpiry';
import type { CommandResult } from '../contracts/commandResult';

export type DraftFormOptions<S, D> = {
  initial: S;
  /** Gửi TOÀN BỘ state trong một command (C-01/C-02/C-03), kèm expectedConcurrencyRevision do caller giữ */
  save: (state: S) => Promise<CommandResult<D>>;
  /** Khóa để lấy lại state đã cất khi phiên hết hạn (useSessionExpiry); state lấy lại được coi là chưa lưu */
  restoreKey?: string;
};

const sameState = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Một state form duy nhất cho editor (research R-20; BR-M03-F11, L06):
 * không autosave; lỗi, stale hay mất mạng không bao giờ reset state; MSG-SAVED chỉ khi `ok`.
 */
export function useDraftForm<S, D>({ initial, save, restoreKey }: DraftFormOptions<S, D>) {
  const [state, setState] = useState<S>(() => (restoreKey ? takeStashedDraft<S>(restoreKey) : undefined) ?? initial);
  const [saved, setSaved] = useState<S>(initial);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState<CommandResult<D> | null>(null);
  const [transportError, setTransportError] = useState<AdminApiError | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback((change: (current: S) => S) => {
    setState((current) => change(current));
  }, []);

  const saveDraft = useCallback(async () => {
    const submitted = stateRef.current;
    setSaving(true);
    setOutcome(null);
    setTransportError(null);
    try {
      const result = await save(submitted);
      setOutcome(result);
      // Mốc "đã lưu" là đúng state đã gửi; chữ gõ thêm trong lúc lưu vẫn là thay đổi chưa lưu
      if (result.ok) setSaved(submitted);
    } catch (error) {
      setTransportError(AdminApiError.from(error));
    } finally {
      setSaving(false);
    }
  }, [save]);

  /** Nạp state mới từ server (mở editor, "Tải lại" sau STALE) */
  const reset = useCallback((next: S) => {
    setState(next);
    setSaved(next);
    setOutcome(null);
    setTransportError(null);
  }, []);

  /** Đổi mốc "đã lưu" mà giữ nguyên chữ đang có (lấy lại state sau khi phiên hết hạn rồi mới nạp server) */
  const rebase = useCallback((next: S) => {
    setSaved(next);
  }, []);

  const isDirty = useMemo(() => !sameState(state, saved), [state, saved]);

  return { state, update, isDirty, saving, outcome, transportError, saveDraft, reset, rebase };
}
