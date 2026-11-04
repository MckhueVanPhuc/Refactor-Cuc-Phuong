// SCR-M02-004 — Trang mở từ mã QR (tasks T082; screen spec §1–§6; FR-M02-025; BR-M02-024, 025). Camera điện thoại mở
// `/q/{qrIdentifier}`: không có bước chọn ngôn ngữ hay tuyến trước nội dung; ngôn ngữ = preference đã lưu, chưa có thì
// theo thiết bị (FieldLayout). processScan(…, 'link') tự đóng phiên quá 24 giờ trước, rồi: có phiên trong cùng trình
// duyệt → xử lý y như quét trong app; không có → khách tự do, lookup không gửi `routeId`, không ghi gì. Trang không bao
// giờ tạo phiên (SR-SCR-M02-004-001).
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { ScanContent } from '../content/ScanContent';
import { useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout } from '../layout/FieldLayout';
import { useBusyWhile } from '../pwa/registerBusy';
import { processScan, type ScanResult } from '../scan/processScan';
import { resolveScan } from '../scan/resolveScan';

/** Đoạn mã rỗng → mã không hợp lệ, không tra cứu (E-SCR-M02-004-08; BR-M02-023). */
function emptyCodeResult(): ScanResult {
  const { display, freeVisitor } = resolveScan({ journey: null, qrIdentifier: '', lookup: { kind: 'INVALID_LINK' } });
  return { qrIdentifier: '', display, freeVisitor, session: null, visit: null, visitCreated: false, finalPromptNeeded: false };
}

export function QrLinkPage() {
  const messages = useM02Messages();
  const { qrIdentifier = '' } = useParams();
  const [scan, setScan] = useState<ScanResult | undefined>(undefined);
  // Mỗi mã chỉ xử lý một lần (StrictMode chạy effect hai lần ở dev): các lần chạy effect dùng chung một promise
  const pending = useRef<{ qrIdentifier: string; result: Promise<ScanResult> } | null>(null);
  // Không áp bản build mới giữa lúc xử lý mã (research R-15)
  useBusyWhile(scan === undefined, 'm02:scan-link');

  useEffect(() => {
    if (pending.current?.qrIdentifier !== qrIdentifier) {
      pending.current = {
        qrIdentifier,
        result: qrIdentifier.trim() ? processScan(qrIdentifier, 'link') : Promise.resolve(emptyCodeResult()),
      };
    }
    // Rời trang trước khi tra cứu xong: bỏ kết quả, không cập nhật state sau khi unmount
    let cancelled = false;
    setScan(undefined);
    void pending.current.result.then((result) => {
      if (!cancelled) setScan(result);
    });
    return () => {
      cancelled = true;
    };
  }, [qrIdentifier]);

  return (
    <FieldLayout surface="reader" title={messages.screenTitle.qrLink}>
      <ScanContent scan={scan} qrIdentifier={qrIdentifier} showBack={Boolean(scan?.session)} />
    </FieldLayout>
  );
}
