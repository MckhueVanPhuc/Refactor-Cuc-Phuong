// Namespace `m02` cá»§a `window.__cpqTestHooks` (tasks T023). Chá»‰ Ä‘Æ°á»£c náº¡p báº±ng import() Ä‘á»™ng trong nhÃ¡nh MODE e2e/fake
// cá»§a src/app/App.tsx, nÃªn khÃ´ng vÃ o bundle production. Hook Ä‘Æ°á»£c thÃªm cÃ¹ng task táº¡o hÃ m mÃ  nÃ³ gá»i:
// `scan(text)` (US2, T039) vÃ  `failNextCreateSession` (V18, nhÃ¡nh thay phiÃªn lá»—i) á»Ÿ T071.
import { registerTestHooks, type TestHooks } from '../../../shared/testing/e2eHooks';
import { handleScannedText } from '../scan/scanBridge';

const hooks: TestHooks = {
  // ÄÆ°a chuá»—i vÃ o Ä‘Ãºng Ä‘Æ°á»ng cá»§a trÃ¬nh quÃ©t trÃªn mÃ n Ä‘ang má»Ÿ: parseQrLink â†’ processScan (T039)
  scan: (text: string) => handleScannedText(text),
};

export function registerM02TestHooks(): void {
  registerTestHooks('m02', hooks);
}
