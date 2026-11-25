// Câu hỏi kết thúc chuyến chờ ở màn chuyến đi (spec-M02 v3.4 BR-M02-021; CHG-MASCOT-2026-11-25-06 D8). Lượt quét đầu
// tiên ở điểm cuối được ghi ở trang nội dung; câu hỏi hiện một lần ở lần mở màn chuyến đi kế tiếp trong tab này (thường
// khi du khách bấm Quay lại). Chỉ là tín hiệu UI trong sessionStorage của tab, không phải dữ liệu phiên: đánh dấu theo
// lượt ghé nên trang nội dung mount lại (lùi/tiến, tải lại) không hỏi lần nữa. Không đọc/ghi được storage → bộ nhớ.

type Entry = { sessionId: string; visitRef: string; shown: boolean };

const KEY = 'm02.finalPrompt';
let memory: Entry | null = null;

function read(): Entry | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Entry) : memory;
  } catch {
    return memory;
  }
}

function write(entry: Entry): void {
  memory = entry;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // Chỉ còn bản trong bộ nhớ
  }
}

/** Lượt quét đầu tiên ở điểm cuối vừa ghi. Cùng lượt ghé đã đánh dấu (kể cả đã hỏi) → không đổi gì. */
export function markFinalPrompt(sessionId: string, visitRef: string): void {
  if (read()?.visitRef === visitRef) return;
  write({ sessionId, visitRef, shown: false });
}

/** `true` một lần cho phiên đang mở có câu hỏi đang chờ; sau đó `false`. */
export function takeFinalPrompt(sessionId: string): boolean {
  const entry = read();
  if (!entry || entry.shown || entry.sessionId !== sessionId) return false;
  write({ ...entry, shown: true });
  return true;
}

/** Chỉ test dùng. */
export function resetFinalPromptForTest(): void {
  memory = null;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
}
