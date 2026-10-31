// Kiểm tra điểm dừng (tasks T085; BR-M03-D01–D04, D11). Hàm thuần: chạy ở panel client và ở adapter giả.
// Kiểm tra liên dòng (tên trùng, còn âm thanh/video) nhận dữ liệu của các dòng khác qua tham số.
import { NAME_MAX_CHARS, NOTE_MAX_CHARS } from '../config/limits';
import type { CheckpointContent, ConnectivityMode } from '../contracts/adminDtos';
import type { ValidationIssue } from '../contracts/validationIssue';
import { checkRequired, checkRequiredBilingual, checkText, makeIssue } from './common';

export type CheckpointForm = { content: CheckpointContent; locationNote?: string };

const target = (checkpointId: string) => ({ itemType: 'CHECKPOINT' as const, itemId: checkpointId });

/** So tên tiếng Việt: bỏ khoảng trắng hai đầu, không phân biệt hoa/thường (BR-M03-D03) */
export function normalizeCheckpointName(name: string): string {
  return name.trim().toLocaleLowerCase('vi');
}

/** Giá trị sai rõ ràng trên chính form — chặn lưu */
export function checkpointSaveIssues(checkpointId: string, { content, locationNote }: CheckpointForm): ValidationIssue[] {
  const at = target(checkpointId);
  const issues = [
    ...checkText({ ...at, fieldKey: 'checkpointName.vi', value: content.checkpointName?.vi, max: NAME_MAX_CHARS }),
    ...checkText({ ...at, fieldKey: 'checkpointName.en', value: content.checkpointName?.en, max: NAME_MAX_CHARS }),
    ...checkText({ ...at, fieldKey: 'locationNote', value: locationNote, max: NOTE_MAX_CHARS }),
  ];
  // "Dùng được khi có mạng" chỉ chọn được sau khi tick khảo sát (BR-M03-D02)
  if (content.connectivityMode === 'ONLINE_AVAILABLE' && !content.fieldVerificationConfirmed) {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_SAVE',
        fieldKey: 'fieldVerificationConfirmed',
        messageKey: 'MSG-ONLINE-NOT-VERIFIED',
        values: { tên: content.checkpointName?.vi?.trim() ?? '' },
      }),
    );
  }
  return issues;
}

/** Tên tiếng Việt trùng với tên nháp hoặc tên đã xuất bản của điểm dừng khác chưa lưu trữ */
export function checkpointNameTaken(
  checkpointId: string,
  name: string | undefined,
  otherNames: readonly string[],
): ValidationIssue[] {
  if (!name?.trim()) return [];
  const key = normalizeCheckpointName(name);
  if (!otherNames.some((other) => normalizeCheckpointName(other) === key)) return [];
  return [
    makeIssue({
      ...target(checkpointId),
      severity: 'BLOCKS_SAVE',
      fieldKey: 'checkpointName.vi',
      messageKey: 'MSG-CHECKPOINT-NAME-TAKEN',
      values: { tên: name.trim() },
    }),
  ];
}

/** Đổi sang "Cần tải trước" khi điểm tham quan (bản nháp hoặc đã xuất bản) còn âm thanh/video */
export function modeHasAvIssues(
  checkpointId: string,
  mode: ConnectivityMode | undefined,
  visitPointsWithAv: readonly string[],
): ValidationIssue[] {
  if (mode !== 'OFFLINE_REQUIRED' || visitPointsWithAv.length === 0) return [];
  return [
    makeIssue({
      ...target(checkpointId),
      severity: 'BLOCKS_SAVE',
      fieldKey: 'connectivityMode',
      messageKey: 'MSG-MODE-HAS-AV',
      values: { 'danh sách': visitPointsWithAv.join(', ') },
    }),
  ];
}

/**
 * Khoảng trống xuất bản theo BR-M03-D04 điều 1–3. Điều 4 (ảnh đọc được) cần Storage nên do backend kiểm
 * lúc mở review và lúc xuất bản.
 */
export function checkpointPublishIssues(
  checkpointId: string,
  content: CheckpointContent,
  readyVisitPointCount: number,
): ValidationIssue[] {
  const at = target(checkpointId);
  const issues = [
    ...checkRequiredBilingual({ ...at, fieldKey: 'checkpointName', value: content.checkpointName }),
    ...checkRequired({ ...at, fieldKey: 'connectivityMode', value: content.connectivityMode }),
  ];
  if (readyVisitPointCount === 0) {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_PUBLISH',
        fieldKey: 'visitPoints',
        messageKey: 'MSG-MISSING-FIELD',
        values: { 'tên ô': 'ít nhất một điểm tham quan sẵn sàng' },
      }),
    );
  }
  return issues;
}
