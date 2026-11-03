// Xử lý một lần quét với lookup giả trên fake-indexeddb (tasks T036; BR-M02-005, 006, 020; FR-M02-006, 008, 022;
// SC-M02-004, 014; scan-resolution-contract §3, §4).
import { beforeEach, describe, expect, it } from 'vitest';
import { createFakeLookup } from '../api/fake/fakeLookup';
import { CHECKPOINTS, ROUTE_A } from '../api/fake/fixtures';
import { checkpointVisitsTable, playSessionsTable } from '../storage/tables';
import { processScan, processScannedText } from './processScan';
import { viewScannedPoint } from './viewScannedPoint';

const SESSION = '5b1e2d3c-4a5f-4e6d-8c7b-9a0f1e2d3c4b';
const lookup = createFakeLookup();
let clock = Date.parse('2026-11-04T02:10:00.000Z');
const deps = { lookup, now: () => new Date(clock) };

async function seedSession() {
  await playSessionsTable.add({
    sessionId: SESSION,
    sourceHandoffId: '1d0c6a2e-7b4f-4c3a-9e8d-2f1a0b9c8d7e',
    routeId: ROUTE_A,
    contentVersion: 3,
    journeyCheckpoints: structuredClone([...CHECKPOINTS]),
    status: 'DANG_DIEN_RA',
    startedAt: '2026-11-04T02:00:00.000Z',
  });
}

const visits = () => checkpointVisitsTable.toArray();

beforeEach(() => {
  lookup.reset();
  clock = Date.parse('2026-11-04T02:10:00.000Z');
});

describe('processScan', () => {
  it('đọc lại phiên từ Dexie và gửi routeId; lượt ghé đã commit khi hàm trả (SC-M02-004)', async () => {
    await seedSession();
    const result = await processScan('Q1a', 'scanner', deps);
    expect(lookup.calls).toEqual([{ qrIdentifier: 'Q1a', routeId: ROUTE_A }]);
    expect(result).toMatchObject({ display: { kind: 'LIVE' }, visitCreated: true, freeVisitor: false, finalPromptNeeded: false });
    expect(await visits()).toEqual([result.visit]);
  });

  it('phiên vừa kết thúc ở tab khác → không dùng phiên cũ, không ghi (BR-M02-002)', async () => {
    await seedSession();
    await playSessionsTable.update(SESSION, { status: 'BO_DO', endedAt: '2026-11-04T02:05:00.000Z' });
    const result = await processScan('Q1a', 'scanner', deps);
    expect(lookup.calls).toEqual([{ qrIdentifier: 'Q1a' }]);
    expect(result).toMatchObject({ freeVisitor: true, visit: null });
    expect(await visits()).toEqual([]);
  });

  it('QN online VALID với checkpointId = C2 → lượt ghé C2 có qrIdentifier = QN; journey không đổi (BR-M02-020; SC-M02-014)', async () => {
    await seedSession();
    const result = await processScan('QN', 'scanner', deps);
    expect(result.visit).toMatchObject({ checkpointId: 'C2', qrIdentifier: 'QN' });
    const [session] = await playSessionsTable.toArray();
    expect(session!.journeyCheckpoints).toEqual(CHECKPOINTS);
  });

  it('QN offline/lỗi nguồn → không lượt ghé, cần kết nối', async () => {
    await seedSession();
    lookup.set('QN', 'SOURCE_ERROR');
    expect(await processScan('QN', 'scanner', deps)).toMatchObject({ display: { kind: 'CONNECTION_NEEDED' }, visit: null });
    expect(await visits()).toEqual([]);
  });

  it('lookup quá hạn (lỗi nguồn) với mã trong journey → vẫn ghi lượt ghé, nguồn gói (BR-M02-005)', async () => {
    await seedSession();
    lookup.set('Q1a', 'SOURCE_ERROR');
    const result = await processScan('Q1a', 'scanner', deps);
    expect(result).toMatchObject({ display: { kind: 'PACKAGE', checkpoint: { checkpointId: 'C1' } }, visitCreated: true });
  });

  it('ghé theo thứ tự tùy ý; điểm cuối (sequence lớn nhất) lần đầu → finalPromptNeeded một lần (FR-M02-008; BR-M02-021)', async () => {
    await seedSession();
    const last = await processScan('Q3', 'scanner', deps);
    expect(last).toMatchObject({ visitCreated: true, finalPromptNeeded: true });
    clock += 60_000;
    expect(await processScan('Q1b', 'scanner', deps)).toMatchObject({ visitCreated: true, finalPromptNeeded: false });
    expect(await processScan('Q3', 'scanner', deps)).toMatchObject({ visitCreated: false, finalPromptNeeded: false });
    expect((await visits()).map((v) => v.checkpointId).sort()).toEqual(['C1', 'C3']);
  });

  it('mã thứ hai cùng điểm dừng → một lượt ghé, giờ ghé cũ; hai nội dung khác nhau (SC-M02-002, 008)', async () => {
    await seedSession();
    const first = await processScan('Q1a', 'scanner', deps);
    clock += 120_000;
    const second = await processScan('Q1b', 'scanner', deps);
    expect(second.visitCreated).toBe(false);
    expect(second.visit).toEqual(first.visit);
    expect(first.display).not.toEqual(second.display);
  });

  it('không có phiên → không gửi routeId, không ghi, gợi ý khách tự do', async () => {
    expect(await processScan('Q1a', 'scanner', deps)).toMatchObject({ freeVisitor: true, session: null, visit: null });
    expect(lookup.calls).toEqual([{ qrIdentifier: 'Q1a' }]);
    expect(await playSessionsTable.count()).toBe(0);
  });
});

describe('processScannedText', () => {
  it('link sai base → mã không hợp lệ, không gọi lookup (R-INVALID-LINK)', async () => {
    await seedSession();
    expect(await processScannedText('https://evil.example/q/Q1a', deps)).toMatchObject({ display: { kind: 'INVALID' }, freeVisitor: false });
    expect(lookup.calls).toEqual([]);
  });

  it('link đúng base (VITE_QR_PUBLIC_BASE_URL của Vitest) → xử lý như quét', async () => {
    await seedSession();
    expect(await processScannedText('http://localhost:5174/q/Q2', deps)).toMatchObject({ visit: { checkpointId: 'C2' } });
  });
});

describe('viewScannedPoint', () => {
  it('xem lại: không ghi lượt ghé mới, trả lượt ghé gốc (scan-resolution §4)', async () => {
    await seedSession();
    const first = await processScan('Q1a', 'scanner', deps);
    const review = await viewScannedPoint('Q1b', deps);
    expect(review).toMatchObject({ visit: first.visit, visitCreated: false, finalPromptNeeded: false });
    expect(await viewScannedPoint('Q2', deps)).toMatchObject({ visit: null });
    expect(await visits()).toHaveLength(1);
  });
});
