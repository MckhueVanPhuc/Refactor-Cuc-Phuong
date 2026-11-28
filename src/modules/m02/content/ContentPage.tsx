// SCR-M02-002 — Nội dung điểm tham quan (tasks T056; screen spec §3–§6). Nhận kết quả quét qua router state; không có
// (tải lại trang, chạm điểm đã quét) thì gọi viewScannedPoint — không ghi lượt ghé. Phần hiển thị ở ScanContent, dùng
// chung với trang mở từ camera điện thoại (SCR-M02-004).
import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router';
import { useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout } from '../layout/FieldLayout';
import { processScan, type ScanResult } from '../scan/processScan';
import { viewScannedPoint } from '../scan/viewScannedPoint';
import type { ContentRouteState } from '../session/TripPage';
import { ScanContent } from './ScanContent';

export function ContentPage() {
  const messages = useM02Messages();
  const { qrIdentifier = '' } = useParams();
  const location = useLocation();
  const state = (location.state ?? {}) as ContentRouteState;
  const [scan, setScan] = useState<ScanResult | undefined>(state.scan);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // "Thử lại" (CHG-MASCOT-2026-11-27-09): chạy lại đúng luồng của mã — vừa quét thì như quét lại (lượt ghé đã có không
  // ghi thêm), xem lại thì chỉ xem, không ghi lượt ghé
  const retry = () => {
    setScan(undefined);
    const again = state.scan && !state.review ? processScan(qrIdentifier, 'scanner') : viewScannedPoint(qrIdentifier);
    void again.then((result) => {
      if (mounted.current) setScan(result);
    });
  };

  // Không có kết quả quét trong router state: xem lại, không ghi lượt ghé (scan-resolution §4)
  useEffect(() => {
    if (state.scan) return undefined;
    let cancelled = false;
    void viewScannedPoint(qrIdentifier).then((result) => {
      if (!cancelled) setScan(result);
    });
    return () => {
      cancelled = true;
    };
  }, [qrIdentifier, state.scan]);

  return (
    <FieldLayout surface="article" {...(scan?.freeVisitor ? { title: messages.screenTitle.qrLink } : {})}>
      <ScanContent
        scan={scan}
        qrIdentifier={qrIdentifier}
        // Chỉ hiện nút "Quay lại" về hành trình khi đang có phiên chuyến đi; khách tự do chỉ có nút "Chọn tuyến"
        showBack={Boolean(scan?.session)}
        onRetry={retry}
      />
    </FieldLayout>
  );
}
