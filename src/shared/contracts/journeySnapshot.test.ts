import { describe, expect, it } from 'vitest';
import { journeySnapshotSchema, type JourneySnapshot } from './journeySnapshot';

function validSnapshot(): JourneySnapshot {
  return {
    routeId: 'r1',
    contentVersion: 1,
    status: 'DA_CONG_BO',
    publishedAt: '2026-10-30T03:00:00Z',
    checkpoints: [
      {
        checkpointId: 'c1',
        sequence: 1,
        checkpointName: { vi: 'Điểm 1', en: 'Stop 1' },
        connectivityMode: 'ONLINE_AVAILABLE',
        qrIdentifiers: ['q1'],
      },
      {
        checkpointId: 'c2',
        sequence: 2,
        checkpointName: { vi: 'Điểm 2', en: 'Stop 2' },
        connectivityMode: 'OFFLINE_REQUIRED',
        qrIdentifiers: ['q2', 'q3'],
        offlineResources: [
          {
            qrIdentifier: 'q2',
            objectName: { vi: 'Cây', en: 'Tree' },
            localizedContent: { vi: { introductionText: 'Giới thiệu' }, en: { introductionText: 'Intro' } },
            staticImages: ['media/tree.jpg'],
          },
          {
            qrIdentifier: 'q3',
            objectName: { vi: 'Đá', en: 'Rock' },
            localizedContent: { vi: { introductionText: 'Giới thiệu' }, en: { introductionText: 'Intro' } },
            staticImages: [],
          },
        ],
      },
    ],
  };
}

const parse = (value: unknown) => journeySnapshotSchema.safeParse(value);
const offlineCheckpoint = () => validSnapshot().checkpoints[1]!;

describe('JourneySnapshot (publication-public §3)', () => {
  it('nhận fixture hợp lệ; estimatedOfflineSizeBytes và offlineRouteMap tùy chọn', () => {
    expect(parse(validSnapshot()).success).toBe(true);
    expect(
      parse({
        ...validSnapshot(),
        estimatedOfflineSizeBytes: 1048576,
        offlineRouteMap: { sourceRef: 'media/map.png', caption: { vi: 'Sơ đồ', en: 'Map' } },
      }).success,
    ).toBe(true);
  });

  it('nhận publishedAt UTC dạng +00:00 (PostgREST), từ chối offset khác UTC', () => {
    expect(parse({ ...validSnapshot(), publishedAt: '2026-10-30T03:00:00.123456+00:00' }).success).toBe(true);
    expect(parse({ ...validSnapshot(), publishedAt: '2026-10-30T10:00:00+07:00' }).success).toBe(false);
    expect(parse({ ...validSnapshot(), publishedAt: '30/10/2026' }).success).toBe(false);
  });

  it('previousContentVersion vắng ở version 1, bằng contentVersion - 1 khi có', () => {
    expect(parse({ ...validSnapshot(), previousContentVersion: 0 }).success).toBe(false);
    expect(parse({ ...validSnapshot(), contentVersion: 3, previousContentVersion: 2 }).success).toBe(true);
    expect(parse({ ...validSnapshot(), contentVersion: 3, previousContentVersion: 1 }).success).toBe(false);
  });

  it('contentVersion là số nguyên ≥ 1', () => {
    expect(parse({ ...validSnapshot(), contentVersion: 0 }).success).toBe(false);
  });

  it('offlineResources chỉ có khi OFFLINE_REQUIRED', () => {
    const snapshot = validSnapshot();
    const online = { ...snapshot.checkpoints[0]!, offlineResources: offlineCheckpoint().offlineResources };
    expect(parse({ ...snapshot, checkpoints: [online, offlineCheckpoint()] }).success).toBe(false);
  });

  it('OFFLINE_REQUIRED: đúng một offlineResource cho mỗi qrIdentifier', () => {
    const snapshot = validSnapshot();
    const resources = offlineCheckpoint().offlineResources!;
    const missing = { ...offlineCheckpoint(), offlineResources: [resources[0]!] };
    const missingField: Record<string, unknown> = { ...offlineCheckpoint() };
    delete missingField['offlineResources'];
    const duplicate = { ...offlineCheckpoint(), offlineResources: [resources[0]!, resources[0]!] };
    const foreign = { ...offlineCheckpoint(), offlineResources: [resources[0]!, { ...resources[1]!, qrIdentifier: 'q9' }] };
    for (const checkpoint of [missing, missingField, duplicate, foreign]) {
      expect(parse({ ...snapshot, checkpoints: [snapshot.checkpoints[0], checkpoint] }).success).toBe(false);
    }
  });

  it('qrIdentifiers không rỗng', () => {
    const snapshot = validSnapshot();
    const empty = { ...snapshot.checkpoints[0]!, qrIdentifiers: [] };
    expect(parse({ ...snapshot, checkpoints: [empty, offlineCheckpoint()] }).success).toBe(false);
  });

  it('checkpointId và sequence duy nhất', () => {
    const snapshot = validSnapshot();
    const sameId = { ...offlineCheckpoint(), checkpointId: 'c1' };
    const sameSequence = { ...offlineCheckpoint(), sequence: 1 };
    expect(parse({ ...snapshot, checkpoints: [snapshot.checkpoints[0], sameId] }).success).toBe(false);
    expect(parse({ ...snapshot, checkpoints: [snapshot.checkpoints[0], sameSequence] }).success).toBe(false);
  });

  it('offline resource thiếu nội dung song ngữ → không hợp lệ', () => {
    const snapshot = validSnapshot();
    const resources = offlineCheckpoint().offlineResources!;
    const broken = {
      ...offlineCheckpoint(),
      offlineResources: [resources[0]!, { ...resources[1]!, localizedContent: { vi: { introductionText: 'Có' } } }],
    };
    expect(parse({ ...snapshot, checkpoints: [snapshot.checkpoints[0], broken] }).success).toBe(false);
  });

  it('không có trường audio/video (SC-M03-024)', () => {
    const snapshot = validSnapshot();
    const resources = offlineCheckpoint().offlineResources!;
    const withAudio = {
      ...offlineCheckpoint(),
      offlineResources: [{ ...resources[0]!, mediaResources: [{ type: 'AUDIO', sourceRef: 'a.mp3' }] }, resources[1]!],
    };
    expect(parse({ ...snapshot, checkpoints: [snapshot.checkpoints[0], withAudio] }).success).toBe(false);
  });

  it('status chỉ là DA_CONG_BO', () => {
    expect(parse({ ...validSnapshot(), status: 'NHAP' }).success).toBe(false);
  });
});
