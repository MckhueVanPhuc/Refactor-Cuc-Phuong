// Hook quyết định offline trước Start (tasks T065 → T086). Khi tuyến cần gói mà chưa có gói `SAN_SANG`, Start hỏi hook
// này. Trước US6 hook đi thẳng Start theo điều kiện của chooseStartPath; US6 thay bằng OfflineDecisionDialog.
export type OfflineDecision = 'continue' | 'cancel';

export type RequestOfflineDecision = () => Promise<OfflineDecision>;

export const continueWithoutDecision: RequestOfflineDecision = async () => 'continue';
