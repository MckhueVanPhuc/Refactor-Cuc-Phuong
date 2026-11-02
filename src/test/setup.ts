import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// findBy*/waitFor chờ tối đa 3 s thay vì 1 s: chunk lazy và render chậm hơn khi cả bộ test chạy song song
// (validation-report D-74). Ca qua vẫn xong ngay khi điều kiện đúng; chỉ ca sai mới chờ lâu hơn.
configure({ asyncUtilTimeout: 3_000 });

afterEach(async () => {
  cleanup();
  // Xóa mọi database IndexedDB giả sau mỗi ca để dữ liệu Dexie không rò giữa các ca trong cùng file
  // (plan M01 Complexity #4). Dexie tự đóng kết nối khi nhận versionchange và mở lại ở thao tác kế tiếp.
  const databases = await indexedDB.databases();
  await Promise.all(databases.map(({ name }) => (name ? deleteDatabase(name) : undefined)));
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
