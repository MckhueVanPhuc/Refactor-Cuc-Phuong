// Màn tải ảnh in (admin-ui-flow §4; BR-M03-B02, B05, E07): tải SVG/PNG bất cứ lúc nào sau lần lưu đầu;
// QR chưa hoạt động thì cảnh báo MSG-QR-PRINT-UNPUBLISHED. "In lại" chỉ ghi nhận C-17.
import { useId, useState } from 'react';
import { Banner } from '../../../../shared/ui/Banner';
import { Button } from '../../../../shared/ui/Button';
import { QR_PRINT_MIN_SIZE_CM } from '../../config/limits';
import type { ConnectivityMode, QrStatus } from '../../contracts/adminDtos';
import { formatMessage } from '../../messages/catalog';
import { qrSuffix } from '../../messages/format';
import { downloadFile, renderQrPng, renderQrSvg } from './renderQr';
import styles from './QrPrintPanel.module.css';

export type QrPrintPanelProps = {
  qrIdentifier: string;
  status: QrStatus;
  connectivityMode?: ConnectivityMode | undefined;
  onReprint: () => void;
  reprintDisabled?: boolean;
};

export function QrPrintPanel({ qrIdentifier, status, connectivityMode, onReprint, reprintDisabled }: QrPrintPanelProps) {
  const [failed, setFailed] = useState(false);
  const titleId = useId();
  const input = { qrIdentifier, connectivityMode };
  // Tên tệp chỉ dùng 6 ký tự cuối như trên tem
  const fileName = `ma-qr-${qrSuffix(qrIdentifier)}`;

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
      <p className={styles.code}>Mã …{qrSuffix(qrIdentifier)}</p>
      {status !== 'HOAT_DONG' ? <Banner tone="warning">{formatMessage('MSG-QR-PRINT-UNPUBLISHED')}</Banner> : null}
      <p className={styles.note}>Khi in, mã phải rộng ít nhất {QR_PRINT_MIN_SIZE_CM} cm.</p>
      <div className={styles.actions}>
        <Button onClick={() => void download('svg')}>Tải ảnh SVG</Button>
        <Button onClick={() => void download('png')}>Tải ảnh PNG</Button>
        {status === 'HOAT_DONG' ? (
          <Button onClick={onReprint} disabled={reprintDisabled}>
            In lại
          </Button>
        ) : null}
      </div>
      {failed ? <Banner tone="error">{formatMessage('MSG-GENERIC')}</Banner> : null}
    </section>
  );
}
