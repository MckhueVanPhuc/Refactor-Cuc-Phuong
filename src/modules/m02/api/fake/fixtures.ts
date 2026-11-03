// Dữ liệu synthetic của quickstart M02 §4 (tasks T023): tuyến A version 3; `C1` seq 1 `OFFLINE_REQUIRED` mã `Q1a`,
// `Q1b`; `C2` seq 3 `ONLINE_AVAILABLE` mã `Q2` (audio `vi`/`en`/`NONE`); `C3` seq 5 (cuối) `OFFLINE_REQUIRED` mã `Q3`;
// `QX` thuộc checkpoint ngoài tuyến; `QN` được M03 thêm vào `C2` sau khi chuyến bắt đầu (không có trong journey).
// Không phải dữ liệu thật; dùng cho Vitest, bản giả cổng M01 và lookup giả.
import type { ManifestCheckpoint, JourneyManifest } from '../../../../shared/contracts/journeyManifest';
import type { LiveStationContent } from '../../../../shared/contracts/liveQrLookup';
import type { OfflinePackage, OfflineResource } from '../../../../shared/contracts/offlinePackage';
import type { SelectedRouteContextV3 } from '../../../../shared/contracts/selectedRouteContext';

export const ROUTE_A = 'A';
export const CONTENT_VERSION = 3;

const bilingual = (vi: string, en: string) => ({ vi, en });

export const CHECKPOINTS: readonly ManifestCheckpoint[] = [
  {
    checkpointId: 'C1',
    sequence: 1,
    checkpointName: bilingual('Cổng rừng', 'Forest gate'),
    connectivityMode: 'OFFLINE_REQUIRED',
    qrIdentifiers: ['Q1a', 'Q1b'],
  },
  {
    checkpointId: 'C2',
    sequence: 3,
    checkpointName: bilingual('Cây chò ngàn năm', 'Thousand-year-old tree'),
    connectivityMode: 'ONLINE_AVAILABLE',
    qrIdentifiers: ['Q2'],
  },
  {
    checkpointId: 'C3',
    sequence: 5,
    checkpointName: bilingual('Động Người Xưa', 'Prehistoric Man Cave'),
    connectivityMode: 'OFFLINE_REQUIRED',
    qrIdentifiers: ['Q3'],
  },
];

export function journeyManifest(contentVersion = CONTENT_VERSION): JourneyManifest {
  return { routeId: ROUTE_A, contentVersion, checkpoints: structuredClone([...CHECKPOINTS]) };
}

/** Context v3 hợp lệ; `authorizedAt` mặc định là 2026-11-04T01:00Z, hết hạn sau đúng 24 giờ. */
export function contextV3(overrides: Partial<SelectedRouteContextV3> = {}): SelectedRouteContextV3 {
  const authorizedAt = overrides.authorizedAt ?? '2026-11-04T01:00:00.000Z';
  return {
    contractVersion: 3,
    handoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    authorizedAt,
    expiresAt: new Date(Date.parse(authorizedAt) + 86_400_000).toISOString(),
    authorizationStatus: 'AUTHORIZED',
    routeJourneyManifest: journeyManifest(),
    ...overrides,
  };
}

const introduction = (vi: string, en: string) => ({
  vi: { introductionText: vi },
  en: { introductionText: en },
});

function offlineResource(qrIdentifier: string, checkpointId: string, name: string): OfflineResource {
  return {
    qrIdentifier,
    checkpointId,
    objectName: bilingual(`${name} (gói)`, `${name} (download)`),
    localizedContent: introduction(`Giới thiệu ${qrIdentifier} từ gói.`, `Introduction of ${qrIdentifier} from the download.`),
    staticImages: [`img/${qrIdentifier}.png`],
  };
}

/** Gói `SAN_SANG` của tuyến A; v2 kèm `OUTDATED` cho V11. Ảnh trong `staticImages` cần byte ở cổng M01 giả. */
export function readyPackage(contentVersion = CONTENT_VERSION, versionStatus: 'CURRENT' | 'OUTDATED' = 'CURRENT'): OfflinePackage {
  return {
    routeId: ROUTE_A,
    contentVersion,
    status: 'SAN_SANG',
    versionStatus,
    manifest: journeyManifest(contentVersion),
    resources: [offlineResource('Q1a', 'C1', 'Q1a'), offlineResource('Q1b', 'C1', 'Q1b'), offlineResource('Q3', 'C3', 'Q3')],
    routeEssentials: {
      capturedAt: '2026-11-04T00:30:00.000Z',
      name: bilingual('Tuyến A', 'Route A'),
      startingPoint: bilingual('Trung tâm du khách', 'Visitor centre'),
    },
    downloadedAt: '2026-11-04T00:30:00.000Z',
  };
}

function liveContent(
  qrIdentifier: string,
  checkpoint: Pick<ManifestCheckpoint, 'checkpointId' | 'checkpointName' | 'connectivityMode'>,
  mediaResources: LiveStationContent['mediaResources'] = [],
): LiveStationContent {
  return {
    qrIdentifier,
    checkpointId: checkpoint.checkpointId,
    checkpointName: checkpoint.checkpointName,
    connectivityMode: checkpoint.connectivityMode,
    objectName: bilingual(`Đối tượng ${qrIdentifier}`, `Object ${qrIdentifier}`),
    localizedContent: introduction(`Giới thiệu trực tuyến ${qrIdentifier}.`, `Live introduction of ${qrIdentifier}.`),
    staticImages: [`img/${qrIdentifier}-live.png`],
    mediaResources,
  };
}

const [c1, c2, c3] = CHECKPOINTS as [ManifestCheckpoint, ManifestCheckpoint, ManifestCheckpoint];
const outsideCheckpoint = {
  checkpointId: 'CX',
  checkpointName: bilingual('Điểm ngoài tuyến', 'Point outside the route'),
  connectivityMode: 'ONLINE_AVAILABLE' as const,
};

/** Nội dung live (`VALID`) theo mã; mã không có ở đây → lookup giả trả `INVALID`. */
export const LIVE_CONTENT: Readonly<Record<string, LiveStationContent>> = {
  Q1a: liveContent('Q1a', c1),
  Q1b: liveContent('Q1b', c1),
  Q2: liveContent('Q2', c2, [
    { type: 'AUDIO', sourceRef: 'media/q2-vi.mp3', spokenLanguage: 'vi' },
    { type: 'AUDIO', sourceRef: 'media/q2-en.mp3', spokenLanguage: 'en' },
    { type: 'VIDEO', sourceRef: 'media/q2-none.mp4', spokenLanguage: 'NONE' },
  ]),
  Q3: liveContent('Q3', c3),
  QX: liveContent('QX', outsideCheckpoint),
  QN: liveContent('QN', c2),
};
