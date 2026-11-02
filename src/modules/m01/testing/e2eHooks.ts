// Namespace `m01` của `window.__cpqTestHooks` (tasks T031): nạp context, nạp gói, tiêm lỗi kích hoạt cho E2E của
// M01 (V12, V19) và M02. Chỉ được nạp bằng import() động trong nhánh MODE e2e/fake của src/app/App.tsx (DV-10),
// nên không vào bundle production. Playwright truyền tham số JSON; byte ảnh được sinh trong trình duyệt.
import type { OfflinePackage } from '../../../shared/contracts/offlinePackage';
import type { SelectedRouteContextV3 } from '../../../shared/contracts/selectedRouteContext';
import { registerTestHooks } from '../../../shared/testing/e2eHooks';
import { failNextActivation } from '../storage/faultInjection';
import { seedContext, seedReadyPackage } from '../storage/testSeed';
import { pngBytes } from './pngBytes';

export function registerM01TestHooks(): void {
  registerTestHooks('m01', {
    seedContext: (context: SelectedRouteContextV3) => seedContext(context),
    seedPackage: (pkg: OfflinePackage) => seedReadyPackage(pkg, () => new Blob([pngBytes()], { type: 'image/png' })),
    failNextActivation: () => failNextActivation(),
  });
}
