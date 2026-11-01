// Lần lưu đầu của tuyến mới khi tác giả đã chọn ảnh trước (validation-report D-25). Media phải thuộc một tuyến
// đã tồn tại (C-04), nên một lần "Lưu bản nháp" chạy ba bước: tạo tuyến (C-01) → tải và đăng ký từng ảnh (C-04)
// → lưu lại tuyến kèm ảnh và tick quyền (C-01). Ảnh lỗi không chặn ảnh khác và được nêu tên (BR-M03-E14).
import type { AdminApi } from '../api/AdminApi';
import type { MediaUsage, SaveRouteDraftData } from '../contracts/adminDtos';
import type { CommandResult } from '../contracts/commandResult';
import { isPendingImage, mediaSettingsOf, toRouteContent, withoutPendingImages, type RouteForm, type RouteImage } from './routeForm';

export type NewRouteSave = {
  result: CommandResult<SaveRouteDraftData>;
  /** tên tệp không tải hoặc không đăng ký được */
  failedFiles: string[];
  /** số ảnh đã chọn trước lần lưu */
  total: number;
};

/** Ảnh chờ tải kèm usage theo chỗ dùng trên form */
function pendingSlots(form: RouteForm): { image: RouteImage; usage: MediaUsage }[] {
  return [
    ...(form.thumbnail ? [{ image: form.thumbnail, usage: 'ROUTE_THUMBNAIL' as const }] : []),
    ...form.gallery.map((item) => ({ image: item.image, usage: 'ROUTE_GALLERY' as const })),
    ...(form.routeMap ? [{ image: form.routeMap, usage: 'ROUTE_MAP' as const }] : []),
  ].filter(({ image }) => isPendingImage(image));
}

export async function saveNewRoute(api: AdminApi, form: RouteForm): Promise<NewRouteSave> {
  const slots = pendingSlots(form);
  const draft = withoutPendingImages(form);
  const created = await api.saveRouteDraft({ content: toRouteContent(draft), mediaSettings: mediaSettingsOf(draft) });
  if (!created.ok || slots.length === 0) return { result: created, failedFiles: [], total: slots.length };

  const { routeId } = created.data;
  const uploaded = new Map<string, RouteImage>();
  const failedFiles: string[] = [];
  for (const { image, usage } of slots) {
    const name = image.fileName ?? '';
    try {
      // Tệp lấy lại sau khi phiên hết hạn không còn nội dung: coi là chưa tải được
      if (!(image.file instanceof File)) throw new Error('mất tệp');
      const { objectPath } = await api.uploadMedia({ ownerType: 'ROUTE', ownerId: routeId, file: image.file });
      const registered = await api.registerMedia({ ownerType: 'ROUTE', ownerId: routeId, usage, type: 'IMAGE', objectPath });
      if (!registered.ok) throw new Error(registered.reason);
      uploaded.set(image.mediaId, {
        mediaId: registered.data.mediaId,
        sourceRef: registered.data.sourceRef,
        usageRightsConfirmed: image.usageRightsConfirmed,
        fileName: name,
      });
    } catch {
      failedFiles.push(name);
    }
  }

  // Thay ảnh chờ bằng media đã đăng ký; ảnh lỗi bị bỏ khỏi lần lưu này
  const swap = (image: RouteImage | null) => (image && isPendingImage(image) ? (uploaded.get(image.mediaId) ?? null) : image);
  const saved: RouteForm = {
    ...form,
    thumbnail: swap(form.thumbnail),
    routeMap: swap(form.routeMap),
    gallery: form.gallery.flatMap((item) => {
      const image = swap(item.image);
      return image ? [{ ...item, image }] : [];
    }),
  };
  if (uploaded.size === 0) return { result: created, failedFiles, total: slots.length };
  const editor = await api.getRouteEditor(routeId);
  const result = await api.saveRouteDraft({
    routeId,
    expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
    content: toRouteContent(saved),
    mediaSettings: mediaSettingsOf(saved),
  });
  return { result: result.ok ? result : created, failedFiles: result.ok ? failedFiles : slots.map(({ image }) => image.fileName ?? ''), total: slots.length };
}
