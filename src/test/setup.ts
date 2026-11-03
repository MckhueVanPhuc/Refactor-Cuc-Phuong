import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// findBy*/waitFor chờ tối đa 3 s thay vì 1 s: chunk lazy và render chậm hơn khi cả bộ test chạy song song
// (validation-report D-74). Ca qua vẫn xong ngay khi điều kiện đúng; chỉ ca sai mới chờ lâu hơn.
configure({ asyncUtilTimeout: 3_000 });

// Ghi lại đồng bộ tên database được mở (Dexie giữ chính factory này nên lời gọi `open` đi qua đây)
const openedDatabases = new Set<string>();
const factory = globalThis.indexedDB;
const originalOpen = factory.open.bind(factory);
factory.open = (name: string, version?: number) => {
  openedDatabases.add(name);
  return originalOpen(name, version);
};

afterEach(() => {
  cleanup();
  // Xóa database IndexedDB giả mà ca vừa mở để dữ liệu Dexie không rò giữa các ca trong cùng file
  // (plan M01 Complexity #4). Dexie tự đóng kết nối khi nhận versionchange và mở lại ở thao tác kế tiếp.
  // Ca không mở database nào kết thúc đồng bộ như trước: một afterEach bất đồng bộ làm đổi thời điểm chạy và
  // khiến test M03 không dùng IndexedDB chập chờn (validation-report M01 DV-31).
  if (openedDatabases.size === 0) return undefined;
  const names = [...openedDatabases];
  openedDatabases.clear();
  return Promise.all(names.map(deleteDatabase)).then(() => undefined);
});

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// jsdom chưa có matchMedia; component dùng media query cần bản tối thiểu này
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
