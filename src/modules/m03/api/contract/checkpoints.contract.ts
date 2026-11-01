// Điểm dừng và điểm tham quan — C-02, C-03, C-05 (CHECKPOINT_FIRST_PUBLICATION, QR_OBJECT), C-07, C-16, C-17,
// Q-05…Q-08 (BR-M03-B01–B03, D02–D05, D09, E02, E05, E09–E11, E13, A05; tasks T081).
import { expect, it } from 'vitest';
import { CHECKPOINT_QR_MAX_ITEMS, QR_INTRO_MIN_CHARS } from '../../config/limits';
import type { ConnectivityMode, SaveVisitPointDraftInput } from '../../contracts/adminDtos';
import type { ContractSuite } from './harness';
import { syntheticFile } from './harness';

const INTRO = 'Giới thiệu đủ dài cho du khách đọc tại chỗ.'.padEnd(QR_INTRO_MIN_CHARS, '.');
const READY_TEXT = {
  objectName: { vi: 'Cây chò', en: 'Cho tree' },
  introductionText: { vi: INTRO, en: INTRO },
};

export const checkpointsContract: ContractSuite = ({ subject, itFakeOnly }) => {
  const api = () => subject().api;

  async function signIn(role: 'CONTENT_STAFF' | 'REVIEWER' = 'CONTENT_STAFF') {
    await subject().controls.signInAs(role);
  }

  async function createCheckpoint(name: string, mode?: ConnectivityMode) {
    const content = {
      checkpointName: { vi: name, en: `${name} (en)` },
      ...(mode ? { connectivityMode: mode } : {}),
      ...(mode === 'ONLINE_AVAILABLE' ? { fieldVerificationConfirmed: true } : {}),
    };
    const result = await api().saveCheckpointDraft({ content });
    if (!result.ok) throw new Error(`không tạo được điểm dừng: ${result.reason}`);
    return result.data.checkpointId;
  }

  async function uploadImage(checkpointId: string) {
    const { objectPath } = await api().uploadMedia({
      ownerType: 'CHECKPOINT',
      ownerId: checkpointId,
      file: syntheticFile('anh.jpg', 'image/jpeg', 2048),
    });
    const result = await api().registerMedia({
      ownerType: 'CHECKPOINT',
      ownerId: checkpointId,
      usage: 'QR_MEDIA',
      type: 'IMAGE',
      objectPath,
    });
    if (!result.ok) throw new Error('không đăng ký được ảnh');
    return { mediaId: result.data.mediaId, objectPath };
  }

  async function saveVisitPoint(input: Partial<SaveVisitPointDraftInput> & { checkpointId: string }) {
    return api().saveVisitPointDraft({ content: {}, mediaSettings: [], ...input });
  }

  /** Điểm tham quan sẵn sàng: tên + giới thiệu song ngữ, một ảnh đã xác nhận quyền */
  async function addReadyVisitPoint(checkpointId: string, name = 'Cây chò') {
    const { mediaId, objectPath } = await uploadImage(checkpointId);
    const result = await saveVisitPoint({
      checkpointId,
      content: { ...READY_TEXT, objectName: { vi: name, en: `${name} (en)` }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true }],
    });
    if (!result.ok) throw new Error(`không lưu được điểm tham quan: ${result.reason}`);
    return { qrIdentifier: result.data.qrIdentifier, objectPath };
  }

  async function publishCheckpoint(checkpointId: string) {
    const review = await api().openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
    return api().publishUnit({
      unitType: 'CHECKPOINT_FIRST_PUBLICATION',
      subjectId: checkpointId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
  }

  async function publishVisitPoint(qrIdentifier: string) {
    const review = await api().openPublicationReview({ unitType: 'QR_OBJECT', subjectId: qrIdentifier });
    return api().publishUnit({
      unitType: 'QR_OBJECT',
      subjectId: qrIdentifier,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
  }

  async function revoke(qrIdentifier: string) {
    const editor = await api().getVisitPointEditor(qrIdentifier);
    return api().revokeVisitPoint({ qrIdentifier, reason: 'Cây đã đổ', expected: { entity: editor.concurrencyRevision } });
  }

  it('lưu điểm dừng lần đầu tạo điểm dừng Nháp; mode không có mặc định', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong');
    const editor = await api().getCheckpointEditor(checkpointId);
    expect(editor.status).toBe('NHAP');
    expect(editor.draft?.content.connectivityMode).toBeUndefined();
    expect(editor.draft?.revisionNumber).toBe(1);
  });

  it('tên tiếng Việt trùng (hoa/thường, khoảng trắng) với điểm dừng khác → VALIDATION MSG-CHECKPOINT-NAME-TAKEN', async () => {
    await signIn();
    await createCheckpoint('Hang Con Moong');
    const result = await api().saveCheckpointDraft({ content: { checkpointName: { vi: '  hang con MOONG ' } } });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-CHECKPOINT-NAME-TAKEN' });
  });

  it('"Dùng được khi có mạng" chưa tick khảo sát → VALIDATION MSG-ONLINE-NOT-VERIFIED', async () => {
    await signIn();
    const result = await api().saveCheckpointDraft({
      content: { checkpointName: { vi: 'Cây chò' }, connectivityMode: 'ONLINE_AVAILABLE' },
    });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-ONLINE-NOT-VERIFIED' });
  });

  it('ghi đè bằng concurrencyRevision cũ → STALE, không ghi gì', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong');
    const editor = await api().getCheckpointEditor(checkpointId);
    const expected = { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision };
    const first = await api().saveCheckpointDraft({ checkpointId, expected, content: { checkpointName: { vi: 'Hang A' } } });
    expect(first.ok).toBe(true);
    const second = await api().saveCheckpointDraft({ checkpointId, expected, content: { checkpointName: { vi: 'Hang B' } } });
    expect(second).toMatchObject({ ok: false, reason: 'STALE', messageKey: 'MSG-STALE' });
    expect((await api().getCheckpointEditor(checkpointId)).draft?.content.checkpointName?.vi).toBe('Hang A');
  });

  it('chưa lưu loại kết nối → thêm điểm tham quan bị BLOCKED MSG-MODE-REQUIRED-FIRST, không tạo QR nào', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong');
    const result = await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'Cây chò' } } });
    expect(result).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-MODE-REQUIRED-FIRST' });
    expect((await api().getCheckpointEditor(checkpointId)).visitPoints).toEqual([]);
  });

  it('lần lưu đầu tạo QR Nháp + qrIdentifier ≥ 16 ký tự [A-Za-z0-9] + bản nháp 1 cùng lúc (BR-M03-B01, B02, E15)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const result = await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'Cây chò' } } });
    expect(result).toMatchObject({ ok: true, messageKey: 'MSG-QR-CREATED', data: { created: true, revisionNumber: 1 } });
    if (!result.ok) return;
    expect(result.data.qrIdentifier).toMatch(/^[A-Za-z0-9]{16,}$/);
    const editor = await api().getVisitPointEditor(result.data.qrIdentifier);
    expect(editor).toMatchObject({ status: 'NHAP', creationOrder: 1, checkpointMode: 'OFFLINE_REQUIRED' });
    expect(editor.readiness.ready).toBe(false);

    const again = await saveVisitPoint({
      checkpointId,
      qrIdentifier: result.data.qrIdentifier,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { objectName: { vi: 'Cây chò ngàn năm' } },
    });
    expect(again).toMatchObject({ ok: true, messageKey: 'MSG-SAVED', data: { created: false } });
  });

  itFakeOnly('va chạm identifier tự sinh lại, không lộ lỗi (BR-M03-B03)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const first = await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'A' } } });
    if (!first.ok) throw new Error('cần điểm tham quan đầu');
    subject().controls.queueQrIdentifiers?.([first.data.qrIdentifier]);
    const second = await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'B' } } });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.data.qrIdentifier).not.toBe(first.data.qrIdentifier);
  });

  it('âm thanh/video ở điểm dừng "Cần tải trước" → VALIDATION MSG-AV-OFFLINE', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const { objectPath } = await api().uploadMedia({
      ownerType: 'CHECKPOINT',
      ownerId: checkpointId,
      file: syntheticFile('tieng.mp3', 'audio/mpeg', 2048),
    });
    const media = await api().registerMedia({ ownerType: 'CHECKPOINT', ownerId: checkpointId, usage: 'QR_MEDIA', type: 'AUDIO', objectPath });
    if (!media.ok) throw new Error('cần media');
    const { mediaId } = media.data;
    const result = await saveVisitPoint({
      checkpointId,
      content: { objectName: { vi: 'Chim' }, mediaItems: [{ mediaId }] },
      mediaSettings: [{ mediaId, usageRightsConfirmed: true, spokenLanguage: 'NONE' }],
    });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-AV-OFFLINE' });
  });

  it('đổi sang "Cần tải trước" khi điểm tham quan còn âm thanh/video → VALIDATION MSG-MODE-HAS-AV', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Vườn chim', 'ONLINE_AVAILABLE');
    const { objectPath } = await api().uploadMedia({
      ownerType: 'CHECKPOINT',
      ownerId: checkpointId,
      file: syntheticFile('tieng.mp3', 'audio/mpeg', 2048),
    });
    const media = await api().registerMedia({ ownerType: 'CHECKPOINT', ownerId: checkpointId, usage: 'QR_MEDIA', type: 'AUDIO', objectPath });
    if (!media.ok) throw new Error('cần media');
    const { mediaId } = media.data;
    expect(
      (await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'Chim' }, mediaItems: [{ mediaId }] }, mediaSettings: [{ mediaId, usageRightsConfirmed: true, spokenLanguage: 'NONE' }] })).ok,
    ).toBe(true);
    const editor = await api().getCheckpointEditor(checkpointId);
    const result = await api().saveCheckpointDraft({
      checkpointId,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: { ...editor.draft?.content, connectivityMode: 'OFFLINE_REQUIRED' },
    });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-MODE-HAS-AV' });
  });

  it(`quá ${CHECKPOINT_QR_MAX_ITEMS} điểm tham quan chưa thu hồi → BLOCKED MSG-LIMIT-QR; hủy một cái thì thêm lại được`, async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const created: string[] = [];
    for (let i = 0; i < CHECKPOINT_QR_MAX_ITEMS; i += 1) {
      const result = await saveVisitPoint({ checkpointId, content: { objectName: { vi: `Vật ${i}` } } });
      if (!result.ok) throw new Error(`không tạo được điểm tham quan ${i}`);
      created.push(result.data.qrIdentifier);
    }
    const over = await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'Vật thừa' } } });
    expect(over).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-LIMIT-QR' });
    if (!over.ok && over.reason === 'BLOCKED') {
      expect(over.values).toEqual({ tên: 'Hang Con Moong', 'tối đa': CHECKPOINT_QR_MAX_ITEMS });
    }

    const editor = await api().getVisitPointEditor(created[0]!);
    const discarded = await api().discardUnpublished({
      subjectType: 'QRCODE',
      subjectId: created[0]!,
      expected: { entity: editor.concurrencyRevision },
    });
    expect(discarded).toMatchObject({ ok: true, data: { status: 'THU_HOI' } });
    expect((await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'Vật mới' } } })).ok).toBe(true);
  });

  it('xuất bản lần đầu: điểm dừng + điểm tham quan sẵn sàng Đang hoạt động, điểm chưa sẵn sàng giữ Nháp (BR-M03-D05)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const ready = await addReadyVisitPoint(checkpointId);
    const draft = await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'Đá vôi' } } });
    if (!draft.ok) throw new Error('cần điểm tham quan nháp');

    const review = await api().openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
    expect(review.blockingIssues).toEqual([]);
    expect(review.affectedRoutes).toEqual([]);
    expect(review.leftOutQrObjects).toHaveLength(1);
    expect(review.leftOutQrObjects[0]?.name).toBe('Đá vôi');
    expect(review.leftOutQrObjects[0]?.missing.length).toBeGreaterThan(0);

    const result = await api().publishUnit({
      unitType: 'CHECKPOINT_FIRST_PUBLICATION',
      subjectId: checkpointId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
    expect(result).toMatchObject({ ok: true, messageKey: 'MSG-PUBLISHED', data: { newJourneyVersions: [] } });
    expect((await api().getCheckpointEditor(checkpointId)).status).toBe('HOAT_DONG');
    expect((await api().getVisitPointEditor(ready.qrIdentifier)).status).toBe('HOAT_DONG');
    expect((await api().getVisitPointEditor(draft.data.qrIdentifier)).status).toBe('NHAP');
  });

  it('một người tự xuất bản được, không cần người thứ hai; audit ghi tự xuất bản (BR-M03-A05)', async () => {
    await signIn('CONTENT_STAFF');
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    await addReadyVisitPoint(checkpointId);
    expect((await publishCheckpoint(checkpointId)).ok).toBe(true);
    const audit = (await subject().controls.auditRows()).filter((row) => row.action === 'PUBLISHED');
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ result: 'SUCCESS', selfPublished: true, subjectName: 'Hang Con Moong' });
  });

  it('điểm dừng chưa sẵn sàng: review liệt kê thiếu sót, xuất bản bị từ chối và không đổi gì (BR-M03-F01)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong');
    const review = await api().openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
    expect(review.blockingIssues.map((issue) => issue.messageKey)).toContain('MSG-MISSING-FIELD');
    const result = await api().publishUnit({
      unitType: 'CHECKPOINT_FIRST_PUBLICATION',
      subjectId: checkpointId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION' });
    expect((await api().getCheckpointEditor(checkpointId)).status).toBe('NHAP');
  });

  itFakeOnly('ảnh không đọc được ở điểm dừng "Cần tải trước" → MSG-IMAGE-NOT-READABLE, không xuất bản (BR-M03-D04 điều 4)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const { objectPath } = await addReadyVisitPoint(checkpointId);
    subject().controls.removeStorageObject?.(objectPath);
    const review = await api().openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
    expect(review.blockingIssues.map((issue) => issue.messageKey)).toContain('MSG-IMAGE-NOT-READABLE');
    const result = await api().publishUnit({
      unitType: 'CHECKPOINT_FIRST_PUBLICATION',
      subjectId: checkpointId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION' });
    expect((await api().getCheckpointEditor(checkpointId)).status).toBe('NHAP');
  });

  it('nội dung đổi sau khi mở review → STALE (review mở lại, BR-M03-F02)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    await addReadyVisitPoint(checkpointId);
    const review = await api().openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
    await addReadyVisitPoint(checkpointId, 'Cây lim');
    const result = await api().publishUnit({
      unitType: 'CHECKPOINT_FIRST_PUBLICATION',
      subjectId: checkpointId,
      reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
    });
    expect(result).toMatchObject({ ok: false, reason: 'STALE' });
  });

  it('điểm tham quan thêm vào điểm dừng đang hoạt động bắt đầu Nháp và xuất bản riêng (BR-M03-E13)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    await addReadyVisitPoint(checkpointId);
    await publishCheckpoint(checkpointId);
    const second = await addReadyVisitPoint(checkpointId, 'Cây lim');
    expect((await api().getVisitPointEditor(second.qrIdentifier)).status).toBe('NHAP');
    expect(await publishVisitPoint(second.qrIdentifier)).toMatchObject({ ok: true, messageKey: 'MSG-PUBLISHED' });
    const editor = await api().getVisitPointEditor(second.qrIdentifier);
    expect(editor.status).toBe('HOAT_DONG');
    expect(editor.published?.revisionNumber).toBe(1);
    expect(editor.draft).toBeUndefined();
  });

  it('thu hồi QR hoạt động cuối của điểm dừng hoạt động → BLOCKED MSG-LAST-QR; còn QR khác thì thu hồi được (BR-M03-E09, E11)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const first = await addReadyVisitPoint(checkpointId);
    await publishCheckpoint(checkpointId);
    expect(await revoke(first.qrIdentifier)).toMatchObject({ ok: false, reason: 'BLOCKED', messageKey: 'MSG-LAST-QR' });

    const second = await addReadyVisitPoint(checkpointId, 'Cây lim');
    await publishVisitPoint(second.qrIdentifier);
    expect(await revoke(first.qrIdentifier)).toMatchObject({ ok: true, data: { status: 'THU_HOI' } });
    expect((await api().getCheckpointEditor(checkpointId)).visitPoints.filter((vp) => vp.status === 'HOAT_DONG')).toHaveLength(1);
  });

  it('thu hồi cần lý do → không có lý do thì bị từ chối', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const first = await addReadyVisitPoint(checkpointId);
    const second = await addReadyVisitPoint(checkpointId, 'Cây lim');
    await publishCheckpoint(checkpointId);
    const editor = await api().getVisitPointEditor(second.qrIdentifier);
    const result = await api().revokeVisitPoint({ qrIdentifier: first.qrIdentifier, reason: '   ', expected: { entity: editor.concurrencyRevision } });
    expect(result.ok).toBe(false);
  });

  it('in lại chỉ ghi một dòng audit; identifier và nội dung không đổi (BR-M03-E07)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const { qrIdentifier } = await addReadyVisitPoint(checkpointId);
    const before = await api().getVisitPointEditor(qrIdentifier);
    const auditBefore = (await subject().controls.auditRows()).length;
    expect(await api().recordReprint({ qrIdentifier })).toMatchObject({ ok: true });
    const audit = await subject().controls.auditRows();
    expect(audit).toHaveLength(auditBefore + 1);
    expect(audit.at(-1)).toMatchObject({ action: 'QR_REPRINTED', result: 'SUCCESS' });
    expect(await api().getVisitPointEditor(qrIdentifier)).toEqual(before);
  });

  it('hủy điểm dừng chưa từng xuất bản: cần lý do; điểm dừng Đã lưu trữ, điểm tham quan Nháp thành Đã thu hồi (BR-M03-D09)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const { qrIdentifier } = await addReadyVisitPoint(checkpointId);
    const editor = await api().getCheckpointEditor(checkpointId);
    const expected = { entity: editor.concurrencyRevision };
    expect((await api().discardUnpublished({ subjectType: 'CHECKPOINT', subjectId: checkpointId, expected })).ok).toBe(false);
    const result = await api().discardUnpublished({ subjectType: 'CHECKPOINT', subjectId: checkpointId, reason: 'Tạo nhầm', expected });
    expect(result).toMatchObject({ ok: true, data: { status: 'LUU_TRU' } });
    expect((await api().getVisitPointEditor(qrIdentifier)).status).toBe('THU_HOI');
    // Tên của điểm dừng đã lưu trữ dùng lại được (BR-M03-D03 chỉ so điểm dừng chưa lưu trữ)
    expect((await api().saveCheckpointDraft({ content: { checkpointName: { vi: 'Hang Con Moong' } } })).ok).toBe(true);
  });

  it('điểm dừng đã từng xuất bản thì không hủy được', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    await addReadyVisitPoint(checkpointId);
    await publishCheckpoint(checkpointId);
    const editor = await api().getCheckpointEditor(checkpointId);
    const result = await api().discardUnpublished({
      subjectType: 'CHECKPOINT',
      subjectId: checkpointId,
      reason: 'Thử',
      expected: { entity: editor.concurrencyRevision },
    });
    expect(result.ok).toBe(false);
    expect((await api().getCheckpointEditor(checkpointId)).status).toBe('HOAT_DONG');
  });

  it('thư viện: tên, trạng thái, mode, số điểm tham quan, Sẵn sàng/Chưa đủ (Q-05)', async () => {
    await signIn();
    const ready = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    await addReadyVisitPoint(ready);
    await createCheckpoint('Vườn thực vật');
    const rows = await api().listCheckpoints({});
    const byName = new Map(rows.map((row) => [row.name, row]));
    expect(byName.get('Hang Con Moong')).toMatchObject({
      status: 'NHAP',
      connectivityMode: 'OFFLINE_REQUIRED',
      visitPointCount: 1,
      routesUsing: [],
      readiness: { ready: true, missing: [] },
    });
    expect(byName.get('Vườn thực vật')?.readiness.ready).toBe(false);
    expect((await api().listCheckpoints({ search: 'vườn' })).map((row) => row.name)).toEqual(['Vườn thực vật']);
  });

  it('mỗi command ghi đúng một dòng audit, kể cả khi bị từ chối', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong');
    const before = (await subject().controls.auditRows()).length;
    await saveVisitPoint({ checkpointId, content: { objectName: { vi: 'Cây chò' } } });
    const audit = await subject().controls.auditRows();
    expect(audit).toHaveLength(before + 1);
    expect(audit.at(-1)).toMatchObject({ action: 'VISIT_POINT_DRAFT_SAVED', result: 'FAILURE' });
  });

  it('chưa đăng nhập hoặc không có tài khoản → FORBIDDEN', async () => {
    await subject().controls.signInWithoutAccount();
    expect(await api().saveCheckpointDraft({ content: {} })).toMatchObject({ ok: false, reason: 'FORBIDDEN' });
  });

  it('điểm tham quan không chuyển được sang điểm dừng khác (BR-M03-E12)', async () => {
    await signIn();
    const first = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    const other = await createCheckpoint('Động Người Xưa', 'OFFLINE_REQUIRED');
    const { qrIdentifier } = await addReadyVisitPoint(first);
    const editor = await api().getVisitPointEditor(qrIdentifier);
    const moved = await saveVisitPoint({
      checkpointId: other,
      qrIdentifier,
      expected: { entity: editor.concurrencyRevision, draft: editor.draft?.concurrencyRevision },
      content: editor.draft!.content,
    });
    expect(moved.ok).toBe(false);
    expect((await api().getVisitPointEditor(qrIdentifier)).checkpointId).toBe(first);
    expect((await api().getCheckpointEditor(other)).visitPoints).toEqual([]);
  });

  it('ghi chú vị trí lưu cùng form, không cần xuất bản, không tạo bản nháp chờ hay version; có kiểm stale (BR-M03-D11)', async () => {
    await signIn();
    const checkpointId = await createCheckpoint('Hang Con Moong', 'OFFLINE_REQUIRED');
    await addReadyVisitPoint(checkpointId);
    expect((await publishCheckpoint(checkpointId)).ok).toBe(true);
    const editor = await api().getCheckpointEditor(checkpointId);
    const saved = await api().saveCheckpointDraft({
      checkpointId,
      expected: { entity: editor.concurrencyRevision },
      content: editor.published!.content,
      locationNote: 'Cạnh nhà chờ số 2',
    });
    expect(saved.ok).toBe(true);
    const after = await api().getCheckpointEditor(checkpointId);
    expect(after.locationNote).toBe('Cạnh nhà chờ số 2');
    expect(after.draft).toBeUndefined();
    expect((await api().listCheckpoints({})).find((row) => row.checkpointId === checkpointId)?.hasPendingDraft).toBe(false);

    const stale = await api().saveCheckpointDraft({
      checkpointId,
      expected: { entity: editor.concurrencyRevision },
      content: editor.published!.content,
      locationNote: 'Ghi đè',
    });
    expect(stale).toMatchObject({ ok: false, reason: 'STALE' });
    expect((await api().getCheckpointEditor(checkpointId)).locationNote).toBe('Cạnh nhà chờ số 2');
  });
};
