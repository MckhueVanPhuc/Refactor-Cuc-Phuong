// Tín hiệu cho Mila quanh một lần tải gói do du khách bấm (specs/005 contracts/mascot-event-contract.md §3; T061):
// `downloadStarted` trước `await`, `resolved` sau `await`. Chỉ phát sự kiện; kết quả thao tác trả về nguyên vẹn.
// Cập nhật lười khi mở chi tiết tuyến không đi qua đây (du khách không bấm, Mila không chen vào).
import { emitMascotEvent } from '../../../shared/mascot/index';
import type { PackageOpResult } from './packageOps';

export async function downloadWithMascot(
  routeId: string,
  update: boolean,
  download: () => Promise<PackageOpResult>,
): Promise<PackageOpResult> {
  emitMascotEvent({ type: 'm01.package.downloadStarted', routeRef: routeId, update });
  const result = await download();
  emitMascotEvent({
    type: 'm01.package.resolved',
    routeRef: routeId,
    kind: result.kind,
    ...(result.kind === 'failed' ? { reason: result.reason } : {}),
    update,
    online: typeof navigator === 'undefined' || navigator.onLine !== false,
  });
  return result;
}
