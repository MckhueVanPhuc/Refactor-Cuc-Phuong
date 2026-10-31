import { describe, expect, it } from 'vitest';
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';
import { routeDerivedValues, timeTagName, timeTagOf } from './routeDerived';

const cp = (checkpointId: string, sequence: number, connectivityMode: 'ONLINE_AVAILABLE' | 'OFFLINE_REQUIRED') => ({
  checkpointId,
  sequence,
  checkpointName: { vi: `Điểm ${checkpointId}`, en: `Stop ${checkpointId}` },
  connectivityMode,
  qrIdentifiers: [`q-${checkpointId}`],
  ...(connectivityMode === 'OFFLINE_REQUIRED'
    ? {
        offlineResources: [
          {
            qrIdentifier: `q-${checkpointId}`,
            objectName: { vi: 'a', en: 'b' },
            localizedContent: { vi: { introductionText: 'x' }, en: { introductionText: 'y' } },
            staticImages: [],
          },
        ],
      }
    : {}),
});

const snapshot = (checkpoints: JourneySnapshot['checkpoints'], extra: Partial<JourneySnapshot> = {}): JourneySnapshot => ({
  routeId: 'r1',
  contentVersion: 1,
  status: 'DA_CONG_BO',
  publishedAt: '2026-10-31T00:00:00.000Z',
  checkpoints,
  ...extra,
});

describe('nhãn thời gian suy ra từ thời lượng (BR-M03-C11)', () => {
  it.each([
    [90, 'TIME_NGAN'],
    [91, 'TIME_VUA'],
    [180, 'TIME_VUA'],
    [181, 'TIME_DAI'],
  ] as const)('%i phút → %s', (minutes, tag) => {
    expect(timeTagOf(minutes)).toBe(tag);
  });

  it('chưa nhập thời lượng → chưa có nhãn; tên hiển thị theo §5.4', () => {
    expect(timeTagOf(undefined)).toBeUndefined();
    expect(timeTagName(45)).toBe('Ngắn');
    expect(timeTagName(120)).toBe('Vừa');
    expect(timeTagName(240)).toBe('Dài');
    expect(timeTagName(undefined)).toBe('Chưa có (tính từ thời lượng)');
  });
});

describe('giá trị suy ra từ snapshot đang active (BR-M03-C11, T08)', () => {
  it('số điểm dừng, cờ offline, danh sách tên theo sequence (có khoảng trống)', () => {
    const derived = routeDerivedValues(snapshot([cp('c1', 1, 'ONLINE_AVAILABLE'), cp('c3', 3, 'OFFLINE_REQUIRED')]));
    expect(derived).toEqual({
      checkpointCount: 2,
      hasOfflineRequiredCheckpoint: true,
      hasOfflineRouteMap: false,
      checkpointSummaries: [
        { checkpointId: 'c1', sequence: 1, checkpointName: { vi: 'Điểm c1', en: 'Stop c1' } },
        { checkpointId: 'c3', sequence: 3, checkpointName: { vi: 'Điểm c3', en: 'Stop c3' } },
      ],
    });
  });

  it('chỉ điểm dừng có mạng → không cần tải trước; có sơ đồ offline → cờ sơ đồ', () => {
    const derived = routeDerivedValues(
      snapshot([cp('c1', 1, 'ONLINE_AVAILABLE')], { offlineRouteMap: { sourceRef: 'uploads/ROUTE/r1/map' } }),
    );
    expect(derived.hasOfflineRequiredCheckpoint).toBe(false);
    expect(derived.hasOfflineRouteMap).toBe(true);
  });

  it('không có snapshot → không có giá trị nào (không bao giờ lấy từ input của nhân viên)', () => {
    expect(routeDerivedValues(undefined)).toEqual({
      checkpointCount: 0,
      hasOfflineRequiredCheckpoint: false,
      hasOfflineRouteMap: false,
      checkpointSummaries: [],
    });
  });
});
