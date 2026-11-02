// Fixture synthetic của Published Route projection và JourneySnapshot (quickstart M01 §4; tasks M01 T011).
// Dùng chung cho test M01, M02, M03. Tên giả, sourceRef giả; không có dữ liệu thật.
// Mỗi lần gọi trả bản sao mới để test sửa thoải mái.
import type { JourneySnapshot } from '../journeySnapshot';
import { ACTIVE_JOURNEY_SNAPSHOT_COLUMNS, PUBLISHED_ROUTE_COLUMNS } from '../publicationRowMapping';
import type { PublishedRoute } from '../publishedRoute';

export type FixtureRouteKey = 'A' | 'B' | 'C' | 'D';

export const FIXTURE_ROUTE_IDS: Record<FixtureRouteKey, string> = {
  A: 'route-a',
  B: 'route-b',
  C: 'route-c',
  D: 'route-d',
};

const bi = (vi: string, en: string) => ({ vi, en });

/**
 * Tuyến A: `HOAT_DONG`, 2 điểm dừng `OFFLINE_REQUIRED` (3 QR, 4 ảnh khai báo) + 1 điểm dừng `ONLINE_AVAILABLE`,
 * có `offlineRouteMap`; có `safetyWarning`, không có `bestTime`; snapshot không có `estimatedOfflineSizeBytes`.
 */
function routeA(): PublishedRoute {
  return {
    routeId: FIXTURE_ROUTE_IDS.A,
    status: 'HOAT_DONG',
    name: bi('Tuyến thử Bách Thảo', 'Test Botanic trail'),
    shortDescription: bi('Mô tả ngắn tuyến A', 'Short description A'),
    description: bi('Mô tả đầy đủ tuyến A', 'Full description A'),
    startingPoint: bi('Cổng thử A', 'Test gate A'),
    thumbnail: { sourceRef: 'fixture/a-thumb.png' },
    gallery: [{ sourceRef: 'fixture/a-thumb.png' }, { sourceRef: 'fixture/a-gallery-2.png', caption: bi('Ảnh 2', 'Photo 2') }],
    routeMap: { sourceRef: 'fixture/a-route-map.png' },
    participationRequirements: bi('Yêu cầu tuyến A', 'Requirements A'),
    safetyWarning: bi('Cảnh báo an toàn tuyến A', 'Safety warning A'),
    highlights: [bi('Điểm nhấn A', 'Highlight A')],
    distanceKm: 2.4,
    durationMin: 150,
    difficulty: 'NHE',
    timeTags: ['TIME_VUA'],
    groupTags: ['GROUP_GIA_DINH_CO_TRE', 'GROUP_CA_NHAN_NGUOI_LON'],
    experienceTags: ['INTEREST_KHAM_PHA'],
    checkpointCount: 3,
    hasOfflineRequiredCheckpoint: true,
    hasOfflineRouteMap: true,
    checkpointSummaries: [
      { checkpointId: 'cp-a1', sequence: 1, checkpointName: bi('Điểm thử A1', 'Test stop A1') },
      { checkpointId: 'cp-a2', sequence: 2, checkpointName: bi('Điểm thử A2', 'Test stop A2') },
      { checkpointId: 'cp-a3', sequence: 4, checkpointName: bi('Điểm thử A3', 'Test stop A3') },
    ],
    activeContentVersion: 1,
  };
}

function snapshotA(): JourneySnapshot {
  return {
    routeId: FIXTURE_ROUTE_IDS.A,
    contentVersion: 1,
    status: 'DA_CONG_BO',
    publishedAt: '2026-10-01T02:00:00Z',
    offlineRouteMap: { sourceRef: 'fixture/a-offline-map.png', caption: bi('Sơ đồ offline A', 'Offline map A') },
    checkpoints: [
      {
        checkpointId: 'cp-a1',
        sequence: 1,
        checkpointName: bi('Điểm thử A1', 'Test stop A1'),
        connectivityMode: 'OFFLINE_REQUIRED',
        qrIdentifiers: ['qr-a1-1', 'qr-a1-2'],
        offlineResources: [
          {
            qrIdentifier: 'qr-a1-1',
            objectName: bi('Đối tượng thử A1-1', 'Test object A1-1'),
            localizedContent: { vi: { introductionText: 'Giới thiệu A1-1' }, en: { introductionText: 'Intro A1-1' } },
            staticImages: ['fixture/a1-1-a.png', 'fixture/a1-1-b.png'],
          },
          {
            qrIdentifier: 'qr-a1-2',
            objectName: bi('Đối tượng thử A1-2', 'Test object A1-2'),
            localizedContent: { vi: { introductionText: 'Giới thiệu A1-2' }, en: { introductionText: 'Intro A1-2' } },
            staticImages: ['fixture/a1-2.png'],
          },
        ],
      },
      {
        checkpointId: 'cp-a2',
        sequence: 2,
        checkpointName: bi('Điểm thử A2', 'Test stop A2'),
        connectivityMode: 'OFFLINE_REQUIRED',
        qrIdentifiers: ['qr-a2-1'],
        offlineResources: [
          {
            qrIdentifier: 'qr-a2-1',
            objectName: bi('Đối tượng thử A2-1', 'Test object A2-1'),
            localizedContent: { vi: { introductionText: 'Giới thiệu A2-1' }, en: { introductionText: 'Intro A2-1' } },
            staticImages: ['fixture/a2-1.png'],
          },
        ],
      },
      {
        checkpointId: 'cp-a3',
        sequence: 4,
        checkpointName: bi('Điểm thử A3', 'Test stop A3'),
        connectivityMode: 'ONLINE_AVAILABLE',
        qrIdentifiers: ['qr-a3-1'],
      },
    ],
  };
}

/** Tuyến B: `HOAT_DONG`, chỉ `ONLINE_AVAILABLE`, không sơ đồ offline; có `estimatedOfflineSizeBytes`. */
function routeB(): PublishedRoute {
  return {
    routeId: FIXTURE_ROUTE_IDS.B,
    status: 'HOAT_DONG',
    name: bi('Tuyến thử Ao Hồ', 'Test Lakeside walk'),
    shortDescription: bi('Mô tả ngắn tuyến B', 'Short description B'),
    description: bi('Mô tả đầy đủ tuyến B', 'Full description B'),
    startingPoint: bi('Cổng thử B', 'Test gate B'),
    thumbnail: { sourceRef: 'fixture/b-thumb.png' },
    gallery: [],
    highlights: [],
    distanceKm: 1,
    durationMin: 60,
    difficulty: 'TRUNG_BINH',
    timeTags: ['TIME_NGAN'],
    groupTags: ['GROUP_CAN_DE_DANG'],
    experienceTags: ['INTEREST_TIM_HIEU', 'INTEREST_THIEN_NHIEN_CHUP_ANH'],
    checkpointCount: 2,
    hasOfflineRequiredCheckpoint: false,
    hasOfflineRouteMap: false,
    checkpointSummaries: [
      { checkpointId: 'cp-b1', sequence: 1, checkpointName: bi('Điểm thử B1', 'Test stop B1') },
      { checkpointId: 'cp-b2', sequence: 2, checkpointName: bi('Điểm thử B2', 'Test stop B2') },
    ],
    activeContentVersion: 3,
  };
}

function snapshotB(): JourneySnapshot {
  return {
    routeId: FIXTURE_ROUTE_IDS.B,
    contentVersion: 3,
    status: 'DA_CONG_BO',
    publishedAt: '2026-10-02T03:00:00Z',
    previousContentVersion: 2,
    estimatedOfflineSizeBytes: 1_572_864,
    checkpoints: [
      {
        checkpointId: 'cp-b1',
        sequence: 1,
        checkpointName: bi('Điểm thử B1', 'Test stop B1'),
        connectivityMode: 'ONLINE_AVAILABLE',
        qrIdentifiers: ['qr-b1-1'],
      },
      {
        checkpointId: 'cp-b2',
        sequence: 2,
        checkpointName: bi('Điểm thử B2', 'Test stop B2'),
        connectivityMode: 'ONLINE_AVAILABLE',
        qrIdentifiers: ['qr-b2-1', 'qr-b2-2'],
      },
    ],
  };
}

/** Tuyến một điểm dừng `ONLINE_AVAILABLE` dùng làm nền cho C (`TAM_DONG`) và D (`LUU_TRU`). */
function closedRoute(key: 'C' | 'D', status: 'TAM_DONG' | 'LUU_TRU'): PublishedRoute {
  const id = FIXTURE_ROUTE_IDS[key];
  return {
    ...routeB(),
    routeId: id,
    status,
    name: bi(`Tuyến thử ${key}`, `Test route ${key}`),
    thumbnail: { sourceRef: `fixture/${key.toLowerCase()}-thumb.png` },
    checkpointCount: 1,
    checkpointSummaries: [{ checkpointId: `cp-${key.toLowerCase()}1`, sequence: 1, checkpointName: bi(`Điểm ${key}1`, `Stop ${key}1`) }],
    activeContentVersion: 1,
  };
}

function closedSnapshot(key: 'C' | 'D'): JourneySnapshot {
  return {
    routeId: FIXTURE_ROUTE_IDS[key],
    contentVersion: 1,
    status: 'DA_CONG_BO',
    publishedAt: '2026-09-01T00:00:00Z',
    checkpoints: [
      {
        checkpointId: `cp-${key.toLowerCase()}1`,
        sequence: 1,
        checkpointName: bi(`Điểm ${key}1`, `Stop ${key}1`),
        connectivityMode: 'ONLINE_AVAILABLE',
        qrIdentifiers: [`qr-${key.toLowerCase()}1-1`],
      },
    ],
  };
}

export type PublicationFixture = {
  routes: Record<FixtureRouteKey, PublishedRoute>;
  snapshots: Record<FixtureRouteKey, JourneySnapshot>;
  /** Dòng `HOAT_DONG` không qua schema (thiếu `name.en`, `timeTags` lệch `durationMin`): phải bị loại, không sửa */
  brokenRoute: unknown;
};

export function publicationFixture(): PublicationFixture {
  return {
    routes: { A: routeA(), B: routeB(), C: closedRoute('C', 'TAM_DONG'), D: closedRoute('D', 'LUU_TRU') },
    snapshots: { A: snapshotA(), B: snapshotB(), C: closedSnapshot('C'), D: closedSnapshot('D') },
    brokenRoute: {
      ...routeB(),
      routeId: 'route-broken',
      name: { vi: 'Tuyến hỏng' },
      timeTags: ['TIME_DAI'],
    },
  };
}

const camelOf = (column: string) => column.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());

/** Giá trị contract → dòng như PostgREST trả từ view (cột snake_case, Optional vắng là null; Physical §3). */
function toRow(value: object, columns: readonly string[]): Record<string, unknown> {
  const record = value as Record<string, unknown>;
  return Object.fromEntries(columns.map((column) => [column, record[camelOf(column)] ?? null]));
}

export const publishedRouteRow = (route: PublishedRoute) => toRow(route, PUBLISHED_ROUTE_COLUMNS);
export const journeySnapshotRow = (snapshot: JourneySnapshot) => toRow(snapshot, ACTIVE_JOURNEY_SNAPSHOT_COLUMNS);

/**
 * Bản xuất bản kế tiếp của một tuyến (A v1 → v2): `activeContentVersion` + 1, snapshot mới có
 * `previousContentVersion`. Nội dung giữ nguyên trừ tên đối tượng QR để phân biệt hai version.
 */
export function nextVersion(route: PublishedRoute, snapshot: JourneySnapshot): { route: PublishedRoute; snapshot: JourneySnapshot } {
  const contentVersion = snapshot.contentVersion + 1;
  return {
    route: { ...structuredClone(route), activeContentVersion: contentVersion },
    snapshot: {
      ...structuredClone(snapshot),
      contentVersion,
      previousContentVersion: snapshot.contentVersion,
      publishedAt: '2026-10-15T02:00:00Z',
      checkpoints: snapshot.checkpoints.map((checkpoint) => ({
        ...structuredClone(checkpoint),
        ...(checkpoint.offlineResources && {
          offlineResources: checkpoint.offlineResources.map((resource) => ({
            ...structuredClone(resource),
            objectName: { vi: `${resource.objectName.vi} v${contentVersion}`, en: `${resource.objectName.en} v${contentVersion}` },
          })),
        }),
      })),
    },
  };
}
