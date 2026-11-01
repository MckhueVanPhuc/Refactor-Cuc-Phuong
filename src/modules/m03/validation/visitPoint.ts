// Kiểm tra điểm tham quan (tasks T086; BR-M03-E02–E05, E17). Hàm thuần: chạy ở panel client và ở adapter giả.
// Media theo thứ tự trên form; khóa trường của từng tệp mang chỉ số (`usageRights.2`) để panel focus đúng ô.
import {
  NAME_MAX_CHARS,
  NOTE_MAX_CHARS,
  QR_INTRO_MAX_CHARS,
  QR_INTRO_MIN_CHARS,
  QR_MAX_AV_FILES,
  QR_MAX_IMAGES,
  type MediaType,
} from '../config/limits';
import type { ConnectivityMode, QrContent, Readiness, SpokenLanguage } from '../contracts/adminDtos';
import type { ValidationIssue } from '../contracts/validationIssue';
import { fieldLabel } from '../messages/fieldLabels';
import { checkRequiredBilingual, checkText, makeIssue, trimmedLength } from './common';

export type VisitPointMediaItem = {
  mediaId: string;
  type: MediaType;
  usageRightsConfirmed: boolean;
  spokenLanguage?: SpokenLanguage | undefined;
  /** Tên tệp gốc khi UI còn biết (vừa tải trong phiên này); hệ thống không lưu tên tệp */
  fileName?: string | undefined;
};

export type VisitPointCheckInput = {
  qrIdentifier: string;
  /** Tên hiển thị của điểm tham quan (BR-M03-E16), dùng trong câu MSG-COUNT-* */
  displayName: string;
  checkpointName: string;
  /** Mode đã lưu của điểm dừng */
  checkpointMode?: ConnectivityMode | undefined;
  content: QrContent;
  installationLabel?: string | undefined;
  media: readonly VisitPointMediaItem[];
};

const target = (qrIdentifier: string) => ({ itemType: 'QRCODE' as const, itemId: qrIdentifier });

const isAv = (item: { type: MediaType }) => item.type !== 'IMAGE';

/** Tên tiếng Việt, hoặc "Điểm tham quan chưa đặt tên {số}" theo thứ tự tạo trong điểm dừng */
export function visitPointName(name: string | undefined, creationOrder: number): string {
  return name?.trim() || `Điểm tham quan chưa đặt tên ${creationOrder}`;
}

/**
 * Nhãn của một tệp trong câu thông báo. Hệ thống không lưu tên tệp gốc (validation-report D-3, chọn b),
 * nên khi không còn biết tên thì dùng "{điểm tham quan} – ảnh {n}". `index` là vị trí trong nhóm cùng loại.
 */
export function mediaLabel(displayName: string, item: VisitPointMediaItem, index: number): string {
  if (item.fileName) return item.fileName;
  return `${displayName} – ${item.type === 'IMAGE' ? 'ảnh' : 'âm thanh/video'} ${index + 1}`;
}

/** Nhãn của mọi tệp theo đúng thứ tự trong `media` */
function mediaLabels(input: VisitPointCheckInput): string[] {
  const counters = { image: 0, av: 0 };
  return input.media.map((item) => {
    const index = isAv(item) ? counters.av++ : counters.image++;
    return mediaLabel(input.displayName, item, index);
  });
}

/** Giá trị sai rõ ràng — chặn lưu (BR-M03-L01) */
export function visitPointSaveIssues(input: VisitPointCheckInput): ValidationIssue[] {
  const at = target(input.qrIdentifier);
  const { objectName, introductionText } = input.content;
  const issues = [
    ...checkText({ ...at, fieldKey: 'objectName.vi', value: objectName?.vi, max: NAME_MAX_CHARS }),
    ...checkText({ ...at, fieldKey: 'objectName.en', value: objectName?.en, max: NAME_MAX_CHARS }),
    ...checkText({ ...at, fieldKey: 'introductionText.vi', value: introductionText?.vi, max: QR_INTRO_MAX_CHARS }),
    ...checkText({ ...at, fieldKey: 'introductionText.en', value: introductionText?.en, max: QR_INTRO_MAX_CHARS }),
    ...checkText({ ...at, fieldKey: 'installationLabel', value: input.installationLabel, max: NOTE_MAX_CHARS }),
  ];
  const images = input.media.filter((item) => !isAv(item)).length;
  const av = input.media.filter(isAv).length;
  if (images > QR_MAX_IMAGES) {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_SAVE',
        fieldKey: 'images',
        messageKey: 'MSG-COUNT-IMAGES',
        values: { 'Tên điểm tham quan hoặc tên tuyến': input.displayName, 'tối đa': QR_MAX_IMAGES },
      }),
    );
  }
  if (av > 0 && input.checkpointMode === 'OFFLINE_REQUIRED') {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_SAVE',
        fieldKey: 'avFiles',
        messageKey: 'MSG-AV-OFFLINE',
        values: { tên: input.checkpointName },
      }),
    );
  } else if (av > QR_MAX_AV_FILES) {
    issues.push(
      makeIssue({
        ...at,
        severity: 'BLOCKS_SAVE',
        fieldKey: 'avFiles',
        messageKey: 'MSG-COUNT-AV',
        values: { 'Tên điểm tham quan': input.displayName, 'tối đa': QR_MAX_AV_FILES },
      }),
    );
  }
  return issues;
}

/** Giới thiệu có chữ nhưng ngắn hơn mức tối thiểu: chưa đủ để xuất bản (DAC-M03-052) */
function introTooShort(at: ReturnType<typeof target>, language: 'vi' | 'en', value: string | undefined): ValidationIssue[] {
  const length = trimmedLength(value ?? '');
  if (length === 0 || length >= QR_INTRO_MIN_CHARS) return [];
  const fieldKey = `introductionText.${language}`;
  return [
    makeIssue({
      ...at,
      severity: 'BLOCKS_PUBLISH',
      fieldKey,
      messageKey: 'MSG-MISSING-FIELD',
      values: { 'tên ô': `${fieldLabel('QRCODE', fieldKey)} (ít nhất ${QR_INTRO_MIN_CHARS} ký tự)` },
    }),
  ];
}

/** Khoảng trống xuất bản (BR-M03-E05, E17): song ngữ, độ dài giới thiệu, quyền sử dụng, ngôn ngữ nói */
export function visitPointPublishIssues(input: VisitPointCheckInput): ValidationIssue[] {
  const at = target(input.qrIdentifier);
  const { objectName, introductionText } = input.content;
  const labels = mediaLabels(input);
  const issues = [
    ...checkRequiredBilingual({ ...at, fieldKey: 'objectName', value: objectName }),
    ...checkRequiredBilingual({ ...at, fieldKey: 'introductionText', value: introductionText }),
    ...introTooShort(at, 'vi', introductionText?.vi),
    ...introTooShort(at, 'en', introductionText?.en),
  ];
  input.media.forEach((item, index) => {
    if (!item.usageRightsConfirmed) {
      issues.push(
        makeIssue({
          ...at,
          severity: 'BLOCKS_PUBLISH',
          fieldKey: `usageRights.${index}`,
          messageKey: 'MSG-RIGHTS-NOT-CONFIRMED',
          values: { 'tên tệp': labels[index] ?? '' },
        }),
      );
    }
    if (isAv(item) && !item.spokenLanguage) {
      issues.push(
        makeIssue({
          ...at,
          severity: 'BLOCKS_PUBLISH',
          fieldKey: `spokenLanguage.${index}`,
          messageKey: 'MSG-AV-LANGUAGE-MISSING',
          values: { 'tên tệp': labels[index] ?? '' },
        }),
      );
    }
  });
  return issues;
}

/** Readiness suy ra từ issue: điều còn thiếu là nhãn trường, không lặp (§5.4 "Chưa đủ: …") */
export function readinessOf(issues: readonly ValidationIssue[]): Readiness {
  const missing = [...new Set(issues.map((issue) => issue.fieldLabel))];
  return { ready: missing.length === 0, missing };
}
