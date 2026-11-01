// C-04 register_media — media-storage-contract §1 bước 3–4 (DAC-M03-055–058; BR-M03-C14, E14).
import { expect, it } from 'vitest';
import type { RegisterMediaInput } from '../../contracts/adminDtos';
import type { ContractSuite } from './harness';
import { syntheticFile } from './harness';

const MB = 1_048_576;

export const mediaContract: ContractSuite = ({ subject }) => {
  async function setup(owner: 'ROUTE' | 'CHECKPOINT' = 'ROUTE') {
    const { controls } = subject();
    await controls.signInAs('CONTENT_STAFF');
    return owner === 'ROUTE' ? controls.seedRoute('Tuyến thử') : controls.seedCheckpoint('Điểm thử');
  }

  async function upload(ownerType: 'ROUTE' | 'CHECKPOINT', ownerId: string, type: string, sizeBytes: number) {
    const { objectPath } = await subject().api.uploadMedia({
      ownerType,
      ownerId,
      file: syntheticFile('tep', type, sizeBytes),
    });
    return objectPath;
  }

  const register = (input: RegisterMediaInput) => subject().api.registerMedia(input);

  it('ảnh hợp lệ → mediaId mới, sourceRef = objectPath; object nằm dưới uploads/{ownerType}/{ownerId}/', async () => {
    const routeId = await setup();
    const objectPath = await upload('ROUTE', routeId, 'image/png', 512 * 1024);
    expect(objectPath.startsWith(`uploads/ROUTE/${routeId}/`)).toBe(true);
    const result = await register({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_GALLERY', type: 'IMAGE', objectPath });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.sourceRef).toBe(objectPath);
    expect(result.data.mediaId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('âm thanh và video hợp lệ cho điểm tham quan (QR_MEDIA thuộc điểm dừng)', async () => {
    const checkpointId = await setup('CHECKPOINT');
    const audio = await upload('CHECKPOINT', checkpointId, 'audio/mpeg', 4 * MB);
    const video = await upload('CHECKPOINT', checkpointId, 'video/mp4', 30 * MB);
    const base = { ownerType: 'CHECKPOINT' as const, ownerId: checkpointId, usage: 'QR_MEDIA' as const };
    expect((await register({ ...base, type: 'AUDIO', objectPath: audio, spokenLanguage: 'vi' })).ok).toBe(true);
    expect((await register({ ...base, type: 'VIDEO', objectPath: video })).ok).toBe(true);
  });

  it('MIME không hỗ trợ hoặc không khớp loại → VALIDATION MSG-FILE-TYPE', async () => {
    const routeId = await setup();
    const gif = await upload('ROUTE', routeId, 'image/gif', 1024);
    const result = await register({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath: gif });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-FILE-TYPE' });

    const checkpointId = await subject().controls.seedCheckpoint('Điểm thử');
    const mp3 = await upload('CHECKPOINT', checkpointId, 'audio/mpeg', 1024);
    const mismatch = await register({
      ownerType: 'CHECKPOINT',
      ownerId: checkpointId,
      usage: 'QR_MEDIA',
      type: 'VIDEO',
      objectPath: mp3,
    });
    expect(mismatch).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-FILE-TYPE' });
  });

  it('vượt dung lượng theo loại → VALIDATION MSG-FILE-TOO-BIG (biên: đúng mức tối đa vẫn nhận)', async () => {
    const routeId = await setup();
    const atLimit = await upload('ROUTE', routeId, 'image/jpeg', 2 * MB);
    const overLimit = await upload('ROUTE', routeId, 'image/jpeg', 2 * MB + 1);
    const base = { ownerType: 'ROUTE' as const, ownerId: routeId, usage: 'ROUTE_GALLERY' as const, type: 'IMAGE' as const };
    expect((await register({ ...base, objectPath: atLimit })).ok).toBe(true);
    expect(await register({ ...base, objectPath: overLimit })).toMatchObject({
      ok: false,
      reason: 'VALIDATION',
      messageKey: 'MSG-FILE-TOO-BIG',
    });
  });

  it('ảnh của tuyến phải là IMAGE: âm thanh cho ROUTE_MAP → VALIDATION MSG-FILE-TYPE', async () => {
    const routeId = await setup();
    const mp3 = await upload('ROUTE', routeId, 'audio/mpeg', 1024);
    const result = await register({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_MAP', type: 'AUDIO', objectPath: mp3 });
    expect(result).toMatchObject({ ok: false, reason: 'VALIDATION', messageKey: 'MSG-FILE-TYPE' });
  });

  it('usage không hợp với owner, owner không tồn tại, object không tồn tại → FAILED', async () => {
    const routeId = await setup();
    const image = await upload('ROUTE', routeId, 'image/jpeg', 1024);
    const wrongUsage = await register({ ownerType: 'ROUTE', ownerId: routeId, usage: 'QR_MEDIA', type: 'IMAGE', objectPath: image });
    expect(wrongUsage).toMatchObject({ ok: false, reason: 'FAILED' });
    const noOwner = await register({ ownerType: 'ROUTE', ownerId: 'khong-co', usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath: image });
    expect(noOwner).toMatchObject({ ok: false, reason: 'FAILED' });
    const noObject = await register({
      ownerType: 'ROUTE',
      ownerId: routeId,
      usage: 'ROUTE_THUMBNAIL',
      type: 'IMAGE',
      objectPath: `uploads/ROUTE/${routeId}/khong-co`,
    });
    expect(noObject).toMatchObject({ ok: false, reason: 'FAILED' });
  });

  it('issue của VALIDATION dùng nhãn tiếng Việt, không lộ id hay mã', async () => {
    const routeId = await setup();
    const gif = await upload('ROUTE', routeId, 'image/gif', 1024);
    const result = await register({ ownerType: 'ROUTE', ownerId: routeId, usage: 'ROUTE_THUMBNAIL', type: 'IMAGE', objectPath: gif });
    if (result.ok || result.reason !== 'VALIDATION') throw new Error('cần VALIDATION');
    const [issue] = result.issues;
    expect(issue).toMatchObject({ fieldLabel: 'Ảnh đại diện', targetItemType: 'ROUTE', targetFieldKey: 'thumbnailMediaId' });
    expect(issue?.message).not.toContain(routeId);
    expect(issue?.message).not.toMatch(/IMAGE|ROUTE_/);
  });
};
