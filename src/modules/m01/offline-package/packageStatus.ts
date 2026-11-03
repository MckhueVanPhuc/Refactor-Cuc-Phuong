// Trạng thái hiển thị của gói (E-SCR-M01-004-06; design-system §5.1, §5.2 "Package panel"): bản đang dùng (sẵn sàng
// hiện hành/cũ, không đọc được) tách khỏi candidate (đang tải, chưa hoàn tất); candidate lỗi không xóa dấu vết bản cũ.
import type { M01Messages } from '../i18n';
import type { PackageEntry } from '../storage/readers';

export type ActiveStatus = 'readyCurrent' | 'readyOutdated' | 'unreadable';
export type CandidateStatus = 'downloading' | 'incomplete';

export function activeStatusOf(entry: PackageEntry | undefined): ActiveStatus | null {
  if (!entry?.active) return null;
  if (!entry.active.pkg) return 'unreadable';
  return entry.active.pkg.versionStatus === 'OUTDATED' ? 'readyOutdated' : 'readyCurrent';
}

export function candidateStatusOf(entry: PackageEntry | undefined): CandidateStatus | null {
  if (!entry?.candidate) return null;
  return entry.candidate.phase === 'DANG_TAI' ? 'downloading' : 'incomplete';
}

/** Nhãn chữ của trạng thái (không chỉ biểu đạt bằng màu, screen spec §8). */
export function statusLabel(status: ActiveStatus | CandidateStatus, messages: M01Messages): string {
  if (status === 'unreadable') return messages.offline.unreadable;
  return messages.offline.status[status];
}
