import { describe, expect, it } from 'vitest';
import { VISITOR_DB_NAME, VISITOR_DB_SCHEMA_V1, visitorDb } from './visitorDb';

// Chép tay từ data-model M01 §4 (= Physical §11). Đổi bảng đó thì đổi ở đây và tăng version chung.
const EXPECTED_STORES: Record<string, string> = {
  languagePreference: 'slot',
  selectedRouteContext: 'slot, &handoffId',
  offlinePackages: '[routeId+contentVersion], routeId',
  offlineResources: '[routeId+contentVersion+qrIdentifier], [routeId+contentVersion], qrIdentifier',
  activePackages: 'routeId',
  packageCandidates: 'routeId',
  imageBytes: '[routeId+contentVersion+sourceRef], [routeId+contentVersion]',
  playSessions: 'sessionId, &sourceHandoffId, status',
  checkpointVisits: '[sessionId+checkpointId], sessionId',
  pendingSyncItems: 'sessionId, syncStatus',
};

describe('visitorDb (data-model M01 §4; Physical §11)', () => {
  it('database tên cuc-phuong-quest, version 1', () => {
    expect(VISITOR_DB_NAME).toBe('cuc-phuong-quest');
    expect(visitorDb.name).toBe('cuc-phuong-quest');
    expect(visitorDb.verno).toBe(1);
  });

  it('khai báo đúng 10 store, chuỗi stores() chép 1:1 từ data-model §4', () => {
    expect(VISITOR_DB_SCHEMA_V1).toEqual(EXPECTED_STORES);
  });

  it('store mở ra có đúng khóa chính và index', async () => {
    await visitorDb.open();
    const actual = Object.fromEntries(
      visitorDb.tables.map((table) => [
        table.name,
        [table.schema.primKey.src, ...table.schema.indexes.map((index) => index.src)].join(', '),
      ]),
    );
    expect(actual).toEqual(EXPECTED_STORES);
  });

  it('handoffId là unique index: hai dòng cùng handoffId bị từ chối', async () => {
    const table = visitorDb.table('selectedRouteContext');
    await table.put({ slot: 'current', handoffId: 'h1' });
    await expect(table.put({ slot: 'other', handoffId: 'h1' })).rejects.toMatchObject({ name: 'ConstraintError' });
  });
});
