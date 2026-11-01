import { describe, expect, it } from 'vitest';
import {
  DISPLAY_NAMES,
  NEVER_SHOWN_WORDS,
  readinessLabel,
  revisionStatusName,
  routeStatusName,
  checkpointStatusName,
  qrStatusName,
} from './displayNames';

// Giá trị enum chép từ spec-M03 §5.4 / §5.1 / §6
const ENUMS: Record<keyof typeof DISPLAY_NAMES, readonly string[]> = {
  routeStatus: ['NHAP', 'HOAT_DONG', 'TAM_DONG', 'LUU_TRU'],
  checkpointStatus: ['NHAP', 'HOAT_DONG', 'TAM_DONG', 'LUU_TRU'],
  qrStatus: ['NHAP', 'HOAT_DONG', 'THU_HOI'],
  revisionStatus: ['NHAP', 'PHAT_HANH', 'LUU_TRU', 'DA_BO'],
  connectivityMode: ['OFFLINE_REQUIRED', 'ONLINE_AVAILABLE'],
  role: ['REVIEWER', 'CONTENT_STAFF'],
  accountStatus: ['INVITATION_PENDING', 'ACTIVE', 'DEACTIVATED'],
  sessionStatus: ['HOAN_TAT', 'BO_DO'],
  actionResult: ['SUCCESS', 'FAILURE'],
  closureSource: ['MANUAL', 'AUTO_NO_ACTIVE_CHECKPOINT'],
  mediaType: ['IMAGE', 'AUDIO', 'VIDEO'],
  spokenLanguage: ['vi', 'en', 'NONE'],
  uploadState: ['uploading', 'uploaded', 'failed'],
  publicationUnit: [
    'ROUTE_FIRST_PUBLICATION',
    'ROUTE_INFORMATION',
    'CHECKPOINT_FIRST_PUBLICATION',
    'CHECKPOINT_REVISION',
    'QR_OBJECT',
  ],
  difficulty: ['NHE', 'TRUNG_BINH', 'KHO'],
  timeTag: ['TIME_NGAN', 'TIME_VUA', 'TIME_DAI'],
  groupTag: ['GROUP_CA_NHAN_NGUOI_LON', 'GROUP_GIA_DINH_CO_TRE', 'GROUP_CAN_DE_DANG'],
  experienceTag: ['INTEREST_THIEN_NHIEN_CHUP_ANH', 'INTEREST_TIM_HIEU', 'INTEREST_KHAM_PHA'],
};

describe('tên hiển thị (spec-M03 §5.4)', () => {
  it.each(Object.entries(ENUMS))('%s: mọi giá trị enum có tên hiển thị không rỗng', (concept, values) => {
    const names = DISPLAY_NAMES[concept as keyof typeof DISPLAY_NAMES] as Record<string, string>;
    expect(Object.keys(names).sort()).toEqual([...values].sort());
    for (const value of values) expect(names[value]).toMatch(/\S/);
  });

  it('đúng câu chữ của spec ở các mục dễ nhầm', () => {
    expect(routeStatusName('HOAT_DONG')).toBe('Đang hoạt động');
    expect(checkpointStatusName('LUU_TRU')).toBe('Đã lưu trữ');
    expect(qrStatusName('THU_HOI')).toBe('Đã thu hồi');
    expect(revisionStatusName('NHAP')).toBe('Bản nháp');
    expect(revisionStatusName('LUU_TRU')).toBe('Bản cũ');
    expect(DISPLAY_NAMES.role.REVIEWER).toBe('Quản lý');
    expect(DISPLAY_NAMES.actionResult.FAILURE).toBe('Không thành công');
  });

  it('readiness: Sẵn sàng / Chưa đủ: {điều còn thiếu}', () => {
    expect(readinessLabel([])).toBe('Sẵn sàng');
    expect(readinessLabel(['Tên đối tượng', 'Giới thiệu'])).toBe('Chưa đủ: Tên đối tượng, Giới thiệu');
  });

  it('không tên hiển thị nào chứa mã enum hay từ cấm', () => {
    const all = Object.values(DISPLAY_NAMES).flatMap((names) => Object.values(names as Record<string, string>));
    for (const name of all) {
      expect(name).not.toMatch(/[A-Z]{2,}_[A-Z_]+/);
      for (const word of NEVER_SHOWN_WORDS) expect(name.toLowerCase()).not.toContain(word.toLowerCase());
    }
  });
});
