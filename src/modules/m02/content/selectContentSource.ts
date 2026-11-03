// Chọn nội dung hiển thị cho một kết quả quét (tasks T052; scan-resolution-contract §2 cột "Hiển thị"; research R-12;
// BR-M02-009, 018; FR-M02-010). Online `VALID` → nội dung live của mã. Lỗi nguồn với mã trong journey → resource của gói
// `SAN_SANG` active (đọc qua m01Port), hoặc thông báo không có nội dung offline. Gói chỉ được đọc, không bao giờ bị đổi;
// bỏ qua `offlineRouteMap` và `routeEssentials`.
import type { MediaResource } from '../../../shared/contracts/liveQrLookup';
import { readActiveOfflinePackage } from '../m01Port';
import type { ScanResult } from '../scan/processScan';

type BilingualText = { vi: string; en: string };
type Introduction = { vi: { introductionText: string }; en: { introductionText: string } };

export type ContentView =
  | {
      kind: 'LIVE';
      checkpointName: BilingualText;
      objectName: BilingualText;
      introduction: Introduction;
      /** `sourceRef` trong bucket media, ký URL khi hiển thị */
      images: string[];
      media: MediaResource[];
    }
  | {
      kind: 'PACKAGE';
      checkpointName: BilingualText;
      objectName: BilingualText;
      introduction: Introduction;
      /** Ảnh đọc bằng readPackageImage với version của GÓI (có thể khác version của phiên) */
      images: { routeId: string; contentVersion: number; sourceRefs: string[] };
      outdated: boolean;
    }
  /** Lỗi nguồn với mã trong journey nhưng không có nội dung offline (BR-M02-018) — không phải mã không hợp lệ */
  | { kind: 'NO_OFFLINE'; checkpointName: BilingualText; reason: 'MISSING_RESOURCE' | 'ONLINE_ONLY' }
  | { kind: 'CLOSED' }
  | { kind: 'INVALID' }
  | { kind: 'CONNECTION_NEEDED' };

export async function selectContentSource(scan: ScanResult): Promise<ContentView> {
  const { display } = scan;
  switch (display.kind) {
    case 'LIVE': {
      const content = display.content;
      return {
        kind: 'LIVE',
        checkpointName: content.checkpointName,
        objectName: content.objectName,
        introduction: content.localizedContent,
        images: content.staticImages,
        media: content.mediaResources,
      };
    }
    case 'PACKAGE': {
      const checkpoint = display.checkpoint;
      // Điểm dừng có mạng không bao giờ có nội dung trong gói (US-M02-03 mục 3)
      if (checkpoint.connectivityMode === 'ONLINE_AVAILABLE' || !scan.session) {
        return { kind: 'NO_OFFLINE', checkpointName: checkpoint.checkpointName, reason: 'ONLINE_ONLY' };
      }
      const pkg = await readActiveOfflinePackage(scan.session.routeId);
      const resource = pkg?.resources.find((r) => r.qrIdentifier === scan.qrIdentifier);
      if (!pkg || !resource) return { kind: 'NO_OFFLINE', checkpointName: checkpoint.checkpointName, reason: 'MISSING_RESOURCE' };
      return {
        kind: 'PACKAGE',
        checkpointName: checkpoint.checkpointName,
        objectName: resource.objectName,
        introduction: resource.localizedContent,
        images: { routeId: pkg.routeId, contentVersion: pkg.contentVersion, sourceRefs: resource.staticImages },
        // Cảnh báo gói cũ "khi biết" (spec-M02 §5.1)
        outdated: pkg.versionStatus === 'OUTDATED' || pkg.contentVersion < scan.session.contentVersion,
      };
    }
    case 'CLOSED':
    case 'INVALID':
    case 'CONNECTION_NEEDED':
      return { kind: display.kind };
  }
}
