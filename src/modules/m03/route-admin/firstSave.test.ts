import { describe, expect, it } from 'vitest';
import { syntheticFile } from '../api/contract/harness';
import { createFakeAdminApi } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import { FakeStore } from '../api/fake/store';
import { saveNewRoute } from './firstSave';
import { EMPTY_ROUTE_FORM, type RouteForm, type RouteImage } from './routeForm';

const pending = (name: string, rights = true): RouteImage => ({
  mediaId: `pending:${name}`,
  sourceRef: '',
  usageRightsConfirmed: rights,
  fileName: name,
  file: syntheticFile(name, 'image/jpeg', 1024),
});

function setup() {
  const store = new FakeStore();
  store.signIn(FIXTURE_ACCOUNTS.CONTENT_STAFF.userId);
  return { store, api: createFakeAdminApi(store) };
}

const form = (change: Partial<RouteForm>): RouteForm => ({ ...EMPTY_ROUTE_FORM, name: { vi: 'Đường lên Mả Tổ', en: '' }, ...change });

describe('lần lưu đầu của tuyến mới kèm ảnh đã chọn (validation-report D-25)', () => {
  it('tạo tuyến, tải và đăng ký từng ảnh, rồi lưu lại tuyến kèm ảnh và tick quyền', async () => {
    const { store, api } = setup();
    const result = await saveNewRoute(
      api,
      form({
        thumbnail: pending('dai-dien.jpg'),
        gallery: [{ image: pending('anh-1.jpg', false), caption: { vi: 'Cây chò', en: 'Cho tree' } }],
        routeMap: pending('so-do.jpg'),
        offlineRouteMapRequired: true,
      }),
    );
    expect(result.result).toMatchObject({ ok: true, messageKey: 'MSG-SAVED' });
    expect(result.failedFiles).toEqual([]);
    expect(result.total).toBe(3);
    if (!result.result.ok) return;
    const editor = await api.getRouteEditor(result.result.data.routeId);
    const content = editor.draft!.content;
    const usage = (mediaId: string | undefined) => editor.media.find((media) => media.mediaId === mediaId);
    expect(usage(content.thumbnailMediaId)).toMatchObject({ usage: 'ROUTE_THUMBNAIL', usageRightsConfirmed: true });
    expect(usage(content.galleryItems?.[0]?.mediaId)).toMatchObject({ usage: 'ROUTE_GALLERY', usageRightsConfirmed: false });
    expect(content.galleryItems?.[0]?.caption).toEqual({ vi: 'Cây chò', en: 'Cho tree' });
    expect(usage(content.routeMapMediaId)).toMatchObject({ usage: 'ROUTE_MAP' });
    expect(content.offlineRouteMapRequired).toBe(true);
    expect(store.state.routes.size).toBe(1);
  });

  it('một ảnh tải lỗi: tuyến vẫn được tạo với các ảnh còn lại, ảnh lỗi được nêu tên', async () => {
    const { store, api } = setup();
    store.failNext('MEDIA_REGISTERED');
    const result = await saveNewRoute(api, form({ thumbnail: pending('dai-dien.jpg'), routeMap: pending('so-do.jpg') }));
    expect(result.result.ok).toBe(true);
    expect(result.failedFiles).toEqual(['dai-dien.jpg']);
    if (!result.result.ok) return;
    const content = (await api.getRouteEditor(result.result.data.routeId)).draft!.content;
    expect(content.thumbnailMediaId).toBeUndefined();
    expect(content.routeMapMediaId).toBeDefined();
  });

  it('lần tạo bị từ chối (giá trị sai) → không tạo tuyến, không tải ảnh nào', async () => {
    const { store, api } = setup();
    const result = await saveNewRoute(
      api,
      form({ difficulty: 'KHO', groupTags: ['GROUP_GIA_DINH_CO_TRE'], thumbnail: pending('dai-dien.jpg') }),
    );
    expect(result.result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-TAG-CONFLICT' });
    expect(store.state.routes.size).toBe(0);
    expect(store.storage.size).toBe(0);
  });

  it('không có ảnh nào → chỉ một lần lưu', async () => {
    const { store, api } = setup();
    const result = await saveNewRoute(api, form({}));
    expect(result).toMatchObject({ result: { ok: true }, failedFiles: [], total: 0 });
    expect(store.audit.filter((row) => row.action === 'ROUTE_DRAFT_SAVED')).toHaveLength(1);
  });
});
