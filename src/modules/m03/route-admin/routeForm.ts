// State form của editor tuyến (SCR-M03-002) và chuyển đổi với nội dung Revision (S4 Route content).
// Một state duy nhất cho cả bốn bước; một lần "Lưu bản nháp" gửi toàn bộ (BR-M03-F11).
import type {
  CheckpointStatus,
  ConnectivityMode,
  Difficulty,
  DraftBilingual,
  ExperienceTag,
  GroupTag,
  RouteContent,
  RouteEditor,
} from '../contracts/adminDtos';
import type { RoutePublishContext } from '../validation/publishGaps';

export type Pair = { vi: string; en: string };
export type RouteImage = {
  mediaId: string;
  sourceRef: string;
  usageRightsConfirmed: boolean;
  fileName?: string;
  /** Ảnh chọn khi tuyến chưa lưu: chưa tải, tải ở lần lưu đầu (validation-report D-25) */
  file?: File;
};
export type ListedCheckpoint = {
  checkpointId: string;
  name: string;
  status: CheckpointStatus;
  connectivityMode?: ConnectivityMode | undefined;
};

export type RouteForm = {
  name: Pair;
  shortDescription: Pair;
  description: Pair;
  startingPoint: Pair;
  participationRequirements: Pair;
  preparation: Pair;
  bestTime: Pair;
  safetyWarning: Pair;
  noSafetyWarningConfirmed: boolean;
  distanceKm: string;
  durationMin: string;
  difficulty: Difficulty | '';
  groupTags: GroupTag[];
  experienceTags: ExperienceTag[];
  thumbnail: RouteImage | null;
  gallery: { image: RouteImage; caption: Pair }[];
  routeMap: RouteImage | null;
  routeMapCaption: Pair;
  offlineRouteMapRequired: boolean;
  highlights: Pair[];
  checkpoints: ListedCheckpoint[];
};

export type StepId = 'card' | 'details' | 'tags' | 'checkpoints';

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'card', label: 'Thẻ tuyến' },
  { id: 'details', label: 'Chi tiết' },
  { id: 'tags', label: 'Nhãn' },
  { id: 'checkpoints', label: 'Điểm dừng' },
];

const EMPTY_PAIR: Pair = { vi: '', en: '' };

export const EMPTY_ROUTE_FORM: RouteForm = {
  name: EMPTY_PAIR,
  shortDescription: EMPTY_PAIR,
  description: EMPTY_PAIR,
  startingPoint: EMPTY_PAIR,
  participationRequirements: EMPTY_PAIR,
  preparation: EMPTY_PAIR,
  bestTime: EMPTY_PAIR,
  safetyWarning: EMPTY_PAIR,
  noSafetyWarningConfirmed: false,
  distanceKm: '',
  durationMin: '',
  difficulty: '',
  groupTags: [],
  experienceTags: [],
  thumbnail: null,
  gallery: [],
  routeMap: null,
  routeMapCaption: EMPTY_PAIR,
  offlineRouteMapRequired: false,
  highlights: [],
  checkpoints: [],
};

/** Bước chứa một `targetFieldKey`, để panel chuyển bước trước khi focus (BR-M03-L03) */
export function stepOf(fieldKey: string): StepId {
  const base = fieldKey.split('.')[0] ?? '';
  if (['thumbnailMediaId', 'name', 'shortDescription', 'distanceKm', 'durationMin', 'difficulty'].includes(base)) return 'card';
  if (['groupTags', 'experienceTags'].includes(base)) return 'tags';
  if (base === 'checkpointList') return 'checkpoints';
  return 'details';
}

const pairOf = (value: DraftBilingual | undefined): Pair => ({ vi: value?.vi ?? '', en: value?.en ?? '' });

const bilingual = (value: Pair): DraftBilingual | undefined => {
  const vi = value.vi.trim();
  const en = value.en.trim();
  return vi || en ? { ...(vi ? { vi } : {}), ...(en ? { en } : {}) } : undefined;
};

export const isPendingImage = (image: RouteImage) => image.mediaId.startsWith('pending:');

/** Form không kèm ảnh chưa tải (cho lần tạo tuyến) */
export function withoutPendingImages(form: RouteForm): RouteForm {
  const keep = (image: RouteImage | null) => (image && !isPendingImage(image) ? image : null);
  return {
    ...form,
    thumbnail: keep(form.thumbnail),
    routeMap: keep(form.routeMap),
    offlineRouteMapRequired: Boolean(keep(form.routeMap)) && form.offlineRouteMapRequired,
    gallery: form.gallery.filter((item) => !isPendingImage(item.image)),
  };
}

/** Số nhập trên form: rỗng hoặc không đọc được → chưa nhập; dấu phẩy thập phân được chấp nhận */
export function parseNumber(value: string): number | undefined {
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return undefined;
  const number = Number(trimmed);
  return Number.isNaN(number) ? undefined : number;
}

export function toRouteContent(form: RouteForm): RouteContent {
  const content: RouteContent = {
    noSafetyWarningConfirmed: form.noSafetyWarningConfirmed,
    offlineRouteMapRequired: Boolean(form.routeMap) && form.offlineRouteMapRequired,
    groupTags: form.groupTags,
    experienceTags: form.experienceTags,
    galleryItems: form.gallery.map(({ image, caption }) => {
      const value = bilingual(caption);
      return value ? { mediaId: image.mediaId, caption: value } : { mediaId: image.mediaId };
    }),
    highlights: form.highlights.map((item) => bilingual(item) ?? {}),
    checkpointList: form.checkpoints.map(({ checkpointId }) => ({ checkpointId })),
  };
  for (const key of [
    'name',
    'shortDescription',
    'description',
    'startingPoint',
    'participationRequirements',
    'preparation',
    'bestTime',
    'safetyWarning',
    'routeMapCaption',
  ] as const) {
    const value = bilingual(form[key]);
    if (value) content[key] = value;
  }
  const distance = parseNumber(form.distanceKm);
  const duration = parseNumber(form.durationMin);
  if (distance !== undefined) content.distanceKm = distance;
  if (duration !== undefined) content.durationMin = duration;
  if (form.difficulty) content.difficulty = form.difficulty;
  if (form.thumbnail) content.thumbnailMediaId = form.thumbnail.mediaId;
  if (form.routeMap) content.routeMapMediaId = form.routeMap.mediaId;
  return content;
}

/** Tick quyền của mọi ảnh trên form, gửi cùng C-01 */
export function mediaSettingsOf(form: RouteForm) {
  return [form.thumbnail, ...form.gallery.map((item) => item.image), form.routeMap].flatMap((image) =>
    image ? [{ mediaId: image.mediaId, usageRightsConfirmed: image.usageRightsConfirmed }] : [],
  );
}

/** Ngữ cảnh cho panel: cờ quyền và tên tệp lấy từ form, trạng thái điểm dừng lấy từ lần nạp */
export function publishContextOf(form: RouteForm): RoutePublishContext {
  const images = [form.thumbnail, ...form.gallery.map((item) => item.image), form.routeMap].flatMap((image) => (image ? [image] : []));
  return {
    media: new Map(images.map((image) => [image.mediaId, { usageRightsConfirmed: image.usageRightsConfirmed, fileName: image.fileName }])),
    checkpoints: new Map(form.checkpoints.map((checkpoint) => [checkpoint.checkpointId, { name: checkpoint.name, status: checkpoint.status }])),
  };
}

export function fromRouteEditor(editor: RouteEditor): RouteForm {
  const content = (editor.draft ?? editor.published)?.content;
  if (!content) return EMPTY_ROUTE_FORM;
  const media = new Map(editor.media.map((item) => [item.mediaId, item]));
  const image = (mediaId: string | undefined): RouteImage | null => {
    const item = mediaId ? media.get(mediaId) : undefined;
    return item ? { mediaId: item.mediaId, sourceRef: item.sourceRef, usageRightsConfirmed: item.usageRightsConfirmed } : null;
  };
  const listed = new Map(editor.checkpoints.map((checkpoint) => [checkpoint.checkpointId, checkpoint]));
  return {
    name: pairOf(content.name),
    shortDescription: pairOf(content.shortDescription),
    description: pairOf(content.description),
    startingPoint: pairOf(content.startingPoint),
    participationRequirements: pairOf(content.participationRequirements),
    preparation: pairOf(content.preparation),
    bestTime: pairOf(content.bestTime),
    safetyWarning: pairOf(content.safetyWarning),
    noSafetyWarningConfirmed: content.noSafetyWarningConfirmed,
    distanceKm: content.distanceKm === undefined ? '' : String(content.distanceKm),
    durationMin: content.durationMin === undefined ? '' : String(content.durationMin),
    difficulty: content.difficulty ?? '',
    groupTags: content.groupTags ?? [],
    experienceTags: content.experienceTags ?? [],
    thumbnail: image(content.thumbnailMediaId),
    gallery: (content.galleryItems ?? []).flatMap((item) => {
      const found = image(item.mediaId);
      return found ? [{ image: found, caption: pairOf(item.caption) }] : [];
    }),
    routeMap: image(content.routeMapMediaId),
    routeMapCaption: pairOf(content.routeMapCaption),
    offlineRouteMapRequired: content.offlineRouteMapRequired,
    highlights: (content.highlights ?? []).map(pairOf),
    checkpoints: (content.checkpointList ?? []).flatMap(({ checkpointId }) => {
      const checkpoint = listed.get(checkpointId);
      return checkpoint ? [checkpoint] : [];
    }),
  };
}
