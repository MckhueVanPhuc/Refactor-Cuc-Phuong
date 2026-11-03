// Chọn nguồn nội dung (tasks T048; BR-M02-009, 018; FR-M02-010; SC-M02-012) với cổng M01 giả.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHECKPOINTS, LIVE_CONTENT, readyPackage, ROUTE_A } from '../api/fake/fixtures';
import type { ScanDisplay } from '../scan/resolveScan';
import type { ScanResult } from '../scan/processScan';
import { fakeM01 } from '../testing/fakeM01Port';
import { selectContentSource } from './selectContentSource';

vi.mock('../m01Port', () => import('../testing/fakeM01Port'));

const [c1, c2, c3] = CHECKPOINTS as [(typeof CHECKPOINTS)[number], (typeof CHECKPOINTS)[number], (typeof CHECKPOINTS)[number]];
const session = { sessionId: '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b', routeId: ROUTE_A, contentVersion: 3 };

function scan(qrIdentifier: string, display: ScanDisplay, withSession = true): ScanResult {
  return {
    qrIdentifier,
    display,
    freeVisitor: !withSession,
    session: withSession ? session : null,
    visit: null,
    visitCreated: false,
    finalPromptNeeded: false,
  };
}

beforeEach(() => fakeM01.reset());

describe('selectContentSource', () => {
  it('online VALID → nội dung live của mã, cho cả OFFLINE_REQUIRED và ONLINE_AVAILABLE (BR-M02-009)', async () => {
    fakeM01.setPackage(readyPackage());
    for (const qr of ['Q1a', 'Q2'] as const) {
      const view = await selectContentSource(scan(qr, { kind: 'LIVE', content: LIVE_CONTENT[qr]! }));
      expect(view).toMatchObject({ kind: 'LIVE', objectName: LIVE_CONTENT[qr]!.objectName, images: LIVE_CONTENT[qr]!.staticImages });
    }
  });

  it('lỗi nguồn + OFFLINE_REQUIRED + có resource → nội dung gói của đúng mã; ảnh theo version của gói', async () => {
    fakeM01.setPackage(readyPackage());
    const a = await selectContentSource(scan('Q1a', { kind: 'PACKAGE', checkpoint: c1 }));
    const b = await selectContentSource(scan('Q1b', { kind: 'PACKAGE', checkpoint: c1 }));
    expect(a).toMatchObject({ kind: 'PACKAGE', outdated: false, images: { routeId: ROUTE_A, contentVersion: 3, sourceRefs: ['img/Q1a.png'] } });
    expect(a).not.toEqual(b);
  });

  it('thiếu resource hoặc không có gói SAN_SANG → không có nội dung offline, không phải mã không hợp lệ (BR-M02-018)', async () => {
    const noResource = readyPackage();
    noResource.resources = noResource.resources.filter((r) => r.qrIdentifier !== 'Q3');
    fakeM01.setPackage(noResource);
    expect(await selectContentSource(scan('Q3', { kind: 'PACKAGE', checkpoint: c3 }))).toEqual({
      kind: 'NO_OFFLINE',
      checkpointName: c3.checkpointName,
      reason: 'MISSING_RESOURCE',
    });
    fakeM01.reset();
    expect(await selectContentSource(scan('Q1a', { kind: 'PACKAGE', checkpoint: c1 }))).toMatchObject({ kind: 'NO_OFFLINE', reason: 'MISSING_RESOURCE' });
  });

  it('ONLINE_AVAILABLE offline → không có nội dung (US-M02-03 mục 3)', async () => {
    fakeM01.setPackage(readyPackage());
    expect(await selectContentSource(scan('Q2', { kind: 'PACKAGE', checkpoint: c2 }))).toMatchObject({ kind: 'NO_OFFLINE', reason: 'ONLINE_ONLY' });
  });

  it('cảnh báo gói cũ khi OUTDATED hoặc package.contentVersion < session.contentVersion; ảnh dùng version của gói', async () => {
    fakeM01.setPackage(readyPackage(2, 'CURRENT'));
    expect(await selectContentSource(scan('Q1a', { kind: 'PACKAGE', checkpoint: c1 }))).toMatchObject({
      kind: 'PACKAGE',
      outdated: true,
      images: { contentVersion: 2 },
    });
    fakeM01.setPackage(readyPackage(3, 'OUTDATED'));
    expect(await selectContentSource(scan('Q1a', { kind: 'PACKAGE', checkpoint: c1 }))).toMatchObject({ outdated: true });
  });

  it('gói không bao giờ bị đổi', async () => {
    const pkg = readyPackage();
    fakeM01.setPackage(pkg);
    await selectContentSource(scan('Q1a', { kind: 'PACKAGE', checkpoint: c1 }));
    const { readActiveOfflinePackage } = await import('../testing/fakeM01Port');
    expect(await readActiveOfflinePackage(ROUTE_A)).toEqual(pkg);
  });

  it('tạm đóng, mã không hợp lệ, cần kết nối → không có nội dung', async () => {
    for (const kind of ['CLOSED', 'INVALID', 'CONNECTION_NEEDED'] as const) {
      expect(await selectContentSource(scan('Q1a', { kind }))).toEqual({ kind });
    }
  });
});
