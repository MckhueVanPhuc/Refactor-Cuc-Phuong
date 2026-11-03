// Dialog quyết định offline (E-SCR-M01-003-17…22; FR-M01-006; BR-M01-007, 016; SR-SCR-M01-003-005, 006): tên các
// điểm dừng OFFLINE_REQUIRED, dung lượng ước tính (hoặc "chưa có thông tin"), một dòng hướng dẫn quét, đúng ba nút.
// Nút Tải luôn bật; không chọn ngầm: focus ban đầu ở "Quay lại", Esc = Quay lại.
import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import { formatEstimatedSize } from '../format';
import { messagesFor } from '../i18n';
import { offlineRequiredCheckpointNames } from '../offline-package/needsPackage';
import styles from './OfflineDecisionDialog.module.css';

export function OfflineDecisionDialog({
  open,
  snapshot,
  language,
  onDownload,
  onContinue,
  onBack,
}: {
  open: boolean;
  snapshot: JourneySnapshot;
  language: LanguageCode;
  onDownload: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const messages = messagesFor(language).routeDetail;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    backRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [open]);

  if (!open) return null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const buttons = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button'));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  const names = offlineRequiredCheckpointNames(snapshot, language);

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <h2 className={styles.title} id={titleId}>
          {messages.offlineDecisionTitle}
        </h2>
        {names.length > 0 && <p>{messages.stopsMayLackContent({ list: names.join(', ') })}</p>}
        <p>{formatEstimatedSize(snapshot.estimatedOfflineSizeBytes, language)}</p>
        <p className={styles.hint}>{messages.scanHint}</p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={onDownload}>
            {messages.download}
          </button>
          <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={onContinue}>
            {messages.continueWithoutDownload}
          </button>
          <button type="button" className={`${styles.button} ${styles.secondary}`} ref={backRef} onClick={onBack}>
            {messages.goBack}
          </button>
        </div>
      </div>
    </div>
  );
}
