// View chi tiết tuyến (FR-M01-003, 014; BR-M01-013, 014; visitor-ui-flow §2). Hàm thuần: chọn chữ theo ngôn ngữ,
// ẩn trường tùy chọn vắng (không chữ thay thế, SR-SCR-M01-003-001), đánh số điểm dừng liên tục 1, 2, 3…
// (OQ-SCR-M01-003-003). M01 không tự bổ sung ngôn ngữ thiếu.
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import type { PublishedRoute } from '../../../shared/contracts/publishedRoute';
import { needsOfflinePackageMark } from '../catalog/selectableRoutes';

type Bilingual = { vi: string; en: string };

export type DetailImage = { sourceRef: string; caption?: string };

export type DetailRouteMap =
  | { kind: 'online'; sourceRef: string; caption?: string }
  /** Sơ đồ offline của gói: byte đọc bằng readPackageImage (BR-M01-013) */
  | { kind: 'package'; routeId: string; contentVersion: number; sourceRef: string; caption?: string };

export type DetailView = {
  /** `online`: dòng nguồn vừa đọc hoặc local view; `saved`: chữ cốt lõi đã lưu trong gói */
  source: 'online' | 'saved';
  name: string;
  startingPoint: string;
  participationRequirements?: string;
  safetyWarning?: string;
  description?: string;
  facts?: { distanceKm: number; durationMin: number; difficulty: PublishedRoute['difficulty'] };
  highlights: string[];
  preparation?: string;
  bestTime?: string;
  gallery: DetailImage[];
  routeMap?: DetailRouteMap;
  checkpoints: { number: number; name: string }[];
  /** Thời điểm lưu chữ cốt lõi (chỉ view `saved`) */
  capturedAt?: string;
  needsPackage: boolean;
};

function optional<K extends string>(key: K, value: Bilingual | undefined, language: LanguageCode) {
  return value ? ({ [key]: value[language] } as Record<K, string>) : {};
}

function numbered(checkpoints: readonly { sequence: number; checkpointName: Bilingual }[], language: LanguageCode) {
  return [...checkpoints]
    .sort((a, b) => a.sequence - b.sequence)
    .map((checkpoint, index) => ({ number: index + 1, name: checkpoint.checkpointName[language] }));
}

export function onlineDetailView(route: PublishedRoute, language: LanguageCode): DetailView {
  return {
    source: 'online',
    name: route.name[language],
    startingPoint: route.startingPoint[language],
    ...optional('participationRequirements', route.participationRequirements, language),
    ...optional('safetyWarning', route.safetyWarning, language),
    description: route.description[language],
    facts: { distanceKm: route.distanceKm, durationMin: route.durationMin, difficulty: route.difficulty },
    highlights: route.highlights.map((highlight) => highlight[language]),
    ...optional('preparation', route.preparation, language),
    ...optional('bestTime', route.bestTime, language),
    gallery: route.gallery.map((image) => ({
      sourceRef: image.sourceRef,
      ...(image.caption && { caption: image.caption[language] }),
    })),
    ...(route.routeMap && {
      routeMap: {
        kind: 'online' as const,
        sourceRef: route.routeMap.sourceRef,
        ...(route.routeMap.caption && { caption: route.routeMap.caption[language] }),
      },
    }),
    checkpoints: numbered(route.checkpointSummaries, language),
    needsPackage: needsOfflinePackageMark(route),
  };
}

/** Offline có gói: chỉ chữ cốt lõi đã lưu, tên điểm dừng từ `manifest`, sơ đồ offline nếu gói có (SC-M01-008). */
export function savedDetailView(pkg: Omit<OfflinePackage, 'resources'>, language: LanguageCode): DetailView {
  const essentials = pkg.routeEssentials;
  const map = pkg.offlineRouteMap;
  return {
    source: 'saved',
    name: essentials.name[language],
    startingPoint: essentials.startingPoint[language],
    ...optional('participationRequirements', essentials.participationRequirements, language),
    ...optional('safetyWarning', essentials.safetyWarning, language),
    highlights: [],
    gallery: [],
    ...(map && {
      routeMap: {
        kind: 'package' as const,
        routeId: pkg.routeId,
        contentVersion: pkg.contentVersion,
        sourceRef: map.sourceRef,
        ...(map.caption && { caption: map.caption[language] }),
      },
    }),
    checkpoints: numbered(pkg.manifest.checkpoints, language),
    capturedAt: essentials.capturedAt,
    needsPackage: false,
  };
}
