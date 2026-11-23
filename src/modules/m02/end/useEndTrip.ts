// Kết thúc chuyến từ câu hỏi cuối chuyến hoặc Finish (tasks T075; E-SCR-M02-003-02): phiên thành `HOAN_TAT` cùng mục
// hàng đợi (finishSession), rồi sang màn kết quả `/trip/end`. Không cần mạng (SR-SCR-M02-003-004).
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { finishSession } from '../storage/terminalTransition';
import { requestSync } from '../sync/startSync';

export const endPath = `${PATHS.m02SessionEntry}/end`;

export type EndRouteState = { sessionId: string };

/**
 * Phiên vừa kết thúc bằng thao tác trong lần tải trang này — chỉ để Mila biết có nên ăn mừng (spec-Mascot US-MAS-08).
 * Chỉ ở bộ nhớ: tải lại trang thì mất. Không dùng router state vì trình duyệt giữ nó qua lần tải lại.
 */
let endedHere: string | null = null;

/** `true` một lần cho phiên vừa kết thúc ở đây; lần gọi sau và sau khi tải lại là `false`. */
export function takeEndedHere(sessionId: string): boolean {
  if (endedHere !== sessionId) return false;
  endedHere = null;
  return true;
}

export function useEndTrip(): { endTrip: (sessionId: string) => Promise<void>; ending: boolean } {
  const navigate = useNavigate();
  const [ending, setEnding] = useState(false);
  const endTrip = async (sessionId: string) => {
    setEnding(true);
    try {
      const result = await finishSession(sessionId);
      if (result.kind === 'FINISHED') {
        endedHere = sessionId;
        requestSync();
      }
      // Phiên đã kết thúc ở tab khác cũng sang màn kết quả của phiên đó
      if (result.kind === 'FINISHED' || result.kind === 'NOT_RUNNING') {
        navigate(endPath, { state: { sessionId } satisfies EndRouteState });
      }
    } finally {
      setEnding(false);
    }
  };
  return { endTrip, ending };
}
