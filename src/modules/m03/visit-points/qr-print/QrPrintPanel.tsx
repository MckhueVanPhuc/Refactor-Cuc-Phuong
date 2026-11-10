// Màn tải ảnh in (admin-ui-flow §4; BR-M03-B02, B05, E07): tải SVG/PNG khi đã lưu tên tiếng Việt; tem in tên đó.
// QR chưa hoạt động thì cảnh báo MSG-QR-PRINT-UNPUBLISHED. In lại tem hỏng = tải lại ảnh (không có nút riêng).
import { useId, useState } from 'react';
import { Banner } from '../../../../shared/ui/Banner';
import { Button } from '../../../../shared/ui/Button';
import type { ConnectivityMode, QrStatus } from '../../contracts/adminDtos';
import { formatMessage } from '../../messages/catalog';
import { FIELD_LABELS } from '../../messages/fieldLabels';
import { downloadFile, qrFileName, renderQrPng, renderQrSvg } from './renderQr';
import styles from './QrPrintPanel.module.css';

/** Ô phải lưu trước khi tải ảnh: tem in tên tiếng Việt (BR-M03-B05) */
const NAME_FIELD = `${FIELD_LABELS.QRCODE.objectName} (tiếng Việt)`;

export type QrPrintPanelProps = {
  qrIdentifier: string;
  /** Tên tiếng Việt đã lưu (bản nháp nếu có, không thì bản đã xuất bản); rỗng thì chưa tải được ảnh */
  name: string;
  status: QrStatus;
  connectivityMode?: ConnectivityMode | undefined;
};

export function QrPrintPanel({ qrIdentifier, name, status, connectivityMode }: QrPrintPanelProps) {
  const [failed, setFailed] = useState(false);
  const titleId = useId();
  const noteId = useId();
  const printName = name.trim();
  const input = { qrIdentifier, name: printName, connectivityMode };
  const fileName = qrFileName(printName);

  async function download(kind: 'svg' | 'png') {
    setFailed(false);
    try {
      if (kind === 'svg') downloadFile(await renderQrSvg(input), `${fileName}.svg`);
      else downloadFile(await renderQrPng(input), `${fileName}.png`);
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Mã QR để in
      </h2>
      {status !== 'HOAT_DONG' ? <Banner tone="warning">{formatMessage('MSG-QR-PRINT-UNPUBLISHED')}</Banner> : null}
      {printName ? null : (
        <p id={noteId} className={styles.note}>
          {formatMessage('MSG-MISSING-FIELD', { 'tên ô': NAME_FIELD })}
        </p>
      )}
      <div className={styles.actions}>
        <Button onClick={() => void download('svg')} disabled={!printName} aria-describedby={printName ? undefined : noteId}>
          Tải ảnh SVG
        </Button>
        <Button onClick={() => void download('png')} disabled={!printName} aria-describedby={printName ? undefined : noteId}>
          Tải ảnh PNG
        </Button>
      </div>
      {failed ? <Banner tone="error">{formatMessage('MSG-GENERIC')}</Banner> : null}
    </section>
  );
}
