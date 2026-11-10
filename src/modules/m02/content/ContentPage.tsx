// SCR-M02-002 — Nội dung điểm tham quan (tasks T056; screen spec §3–§6). Nhận kết quả quét qua router state; không có
// (tải lại trang, chạm điểm đã quét) thì gọi viewScannedPoint — không ghi lượt ghé. Phần hiển thị ở ScanContent, dùng
// chung với trang mở từ camera điện thoại (SCR-M02-004).
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { FieldLayout } from '../layout/FieldLayout';
import type { ScanResult } from '../scan/processScan';
import { viewScannedPoint } from '../scan/viewScannedPoint';
import type { ContentRouteState } from '../session/TripPage';
import { ScanContent } from './ScanContent';

export function ContentPage() {
  const { qrIdentifier = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as ContentRouteState;
  const [scan, setScan] = useState<ScanResult | undefined>(state.scan);

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

  // [Đi tiếp]: ghi đè router state để quay lại / tải lại trang không hỏi lần nữa
  const rewriteState = () => {
    if (scan) navigate(location.pathname, { replace: true, state: { scan: { ...scan, finalPromptNeeded: false } } satisfies ContentRouteState });
  };

  return (
    <FieldLayout surface="article">
      <ScanContent scan={scan} qrIdentifier={qrIdentifier} showBack onPromptContinue={rewriteState} />
    </FieldLayout>
  );
}
