// Phần hiển thị cho màn kết quả (spec-M02 v3.6 §5.1 "Content inputs"; CHG-MASCOT-2026-11-28-10): tên tuyến
// (`routeEssentials.name` từ gói `SAN_SANG` đang dùng của tuyến) và, cho từng điểm của journey, ảnh đầu tiên lấy từ bất
// kỳ mã QR nào thuộc điểm dừng đó — ưu tiên lấy từ `resources` của gói offline sẵn sàng; với điểm không có ảnh trong gói
// (ví dụ điểm `ONLINE_AVAILABLE` hoặc du khách chưa tải gói), khi có mạng tra cứu các mã QR của điểm qua `lookupClient`
// và ký URL qua `mediaUrlClient`. Không có ảnh hoặc đọc lỗi → màn hiện ô biểu tượng. Chỉ để hiển thị: không chép vào
// PlaySession, CheckpointVisit hay SessionSyncRecord.
import { useEffect, useRef, useState } from 'react';
import type { ManifestCheckpoint } from '../../../shared/contracts/journeyManifest';
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import { lookupClient, type LookupClient } from '../api/lookupClient';
import { mediaUrlClient, type MediaUrlClient } from '../api/mediaUrl';
import { readActiveOfflinePackage } from '../m01Port';
import type { CheckpointVisitRow } from '../storage/rows';

/** Một ảnh trong gói; đọc byte bằng `readPackageImage` với version của GÓI (có thể khác version của phiên). */
export type PackageImageRef = { routeId: string; contentVersion: number; sourceRef: string };

export type EndPackageView = {
  routeName: OfflinePackage['routeEssentials']['name'];
  /** checkpointId → ảnh đầu tiên của điểm trong gói; điểm không có ảnh trong gói thì không có khóa */
  thumbnails: ReadonlyMap<string, PackageImageRef>;
};

export function endPackageView(pkg: OfflinePackage): EndPackageView {
  const thumbnails = new Map<string, PackageImageRef>();
  for (const resource of pkg.resources) {
    const sourceRef = resource.staticImages[0];
    if (sourceRef && !thumbnails.has(resource.checkpointId)) {
      thumbnails.set(resource.checkpointId, { routeId: pkg.routeId, contentVersion: pkg.contentVersion, sourceRef });
    }
  }
  return { routeName: pkg.routeEssentials.name, thumbnails };
}

/**
 * Tìm `sourceRef` ảnh đầu tiên của từng checkpoint chưa có trong `skipCheckpoints` bằng cách tra cứu lần lượt các mã QR
 * thuộc checkpoint đó (`visitQrOf` trước, rồi `checkpoint.qrIdentifiers`) cho tới khi gặp mã `VALID` có `staticImages[0]`.
 */
export async function lookupCheckpointImageRefs(
  checkpoints: readonly ManifestCheckpoint[],
  visitQrOf: ReadonlyMap<string, string>,
  skipCheckpoints: ReadonlySet<string>,
  lookup: LookupClient = lookupClient,
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    checkpoints
      .filter((c) => !skipCheckpoints.has(c.checkpointId))
      .map(async (checkpoint): Promise<[string, string] | null> => {
        const visitedQr = visitQrOf.get(checkpoint.checkpointId);
        const candidates = [...new Set([...(visitedQr ? [visitedQr] : []), ...checkpoint.qrIdentifiers])];
        for (const qrId of candidates) {
          const outcome = await lookup.lookup(qrId);
          const sourceRef = outcome.kind === 'VALID' ? outcome.content.staticImages[0] : undefined;
          if (sourceRef) return [checkpoint.checkpointId, sourceRef];
        }
        return null;
      }),
  );
  return new Map(entries.filter((entry): entry is [string, string] => entry !== null));
}

/** `undefined` = đang đọc gói từ IndexedDB; `null` = không có gói sẵn sàng cho tuyến này. */
export function useEndPackageView(routeId: string | undefined): EndPackageView | null | undefined {
  const [view, setView] = useState<{ routeId: string; value: EndPackageView | null } | null>(null);
  useEffect(() => {
    if (!routeId) return undefined;
    let cancelled = false;
    readActiveOfflinePackage(routeId)
      .then((pkg) => (pkg && pkg.routeId === routeId ? endPackageView(pkg) : null))
      .catch(() => null)
      .then((value) => {
        if (!cancelled) setView({ routeId, value });
      });
    return () => {
      cancelled = true;
    };
  }, [routeId]);
  if (!routeId) return null;
  return view && view.routeId === routeId ? view.value : undefined;
}

const EMPTY_URLS: ReadonlyMap<string, string> = new Map();

/**
 * Ảnh nhỏ đã ký từ live QR lookup cho các checkpoint chưa có ảnh trong gói offline (ví dụ điểm `ONLINE_AVAILABLE` hoặc
 * chuyến đi không tải gói). Chờ `packageView !== undefined` để không gọi mạng cho điểm đã có ảnh trong gói.
 */
export function useLiveCheckpointThumbnails(
  checkpoints: readonly ManifestCheckpoint[],
  visits: readonly CheckpointVisitRow[],
  packageView: EndPackageView | null | undefined,
  deps: { lookup?: LookupClient; mediaUrl?: MediaUrlClient } = {},
): ReadonlyMap<string, string> {
  const [urls, setUrls] = useState<ReadonlyMap<string, string>>(EMPTY_URLS);
  const latest = useRef({ checkpoints, visits, deps });
  latest.current = { checkpoints, visits, deps };

  const packageReady = packageView !== undefined;
  const packageKeys = packageView ? [...packageView.thumbnails.keys()].sort().join('\n') : '';
  const checkpointKey = checkpoints.map((c) => `${c.checkpointId}:${c.qrIdentifiers.join(',')}`).join('\n');
  const visitKey = visits.map((v) => `${v.checkpointId}:${v.qrIdentifier}`).sort().join('\n');

  useEffect(() => {
    const { checkpoints: currentCheckpoints, visits: currentVisits, deps: currentDeps } = latest.current;
    if (!packageReady || currentCheckpoints.length === 0) {
      setUrls((prev) => (prev.size === 0 ? prev : EMPTY_URLS));
      return undefined;
    }
    const skip = new Set(packageKeys ? packageKeys.split('\n') : []);
    if (currentCheckpoints.every((c) => skip.has(c.checkpointId))) {
      setUrls((prev) => (prev.size === 0 ? prev : EMPTY_URLS));
      return undefined;
    }
    let cancelled = false;
    const visitQrOf = new Map(currentVisits.map((v) => [v.checkpointId, v.qrIdentifier]));
    const lookup = currentDeps.lookup ?? lookupClient;
    const mediaUrl = currentDeps.mediaUrl ?? mediaUrlClient;

    void lookupCheckpointImageRefs(currentCheckpoints, visitQrOf, skip, lookup)
      .then(async (refByCheckpoint) => {
        if (cancelled || refByCheckpoint.size === 0) return EMPTY_URLS;
        const signedByRef = await mediaUrl.signedUrls([...refByCheckpoint.values()]);
        const result = new Map<string, string>();
        for (const [checkpointId, sourceRef] of refByCheckpoint) {
          const signed = signedByRef.get(sourceRef);
          if (signed) result.set(checkpointId, signed);
        }
        return result.size > 0 ? result : EMPTY_URLS;
      })
      .catch(() => EMPTY_URLS)
      .then((next) => {
        if (!cancelled) setUrls((prev) => (prev.size === 0 && next.size === 0 ? prev : next));
      });

    return () => {
      cancelled = true;
    };
  }, [packageReady, packageKeys, checkpointKey, visitKey]);

  return urls;
}
