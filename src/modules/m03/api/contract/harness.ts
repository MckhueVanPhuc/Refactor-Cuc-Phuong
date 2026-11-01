// Bộ test hành vi dùng chung cho MỌI adapter của AdminApi (tasks T043, T197).
// Cùng một bộ *.contract.ts chạy với adapter giả (giai đoạn A) và adapter Supabase trên stack local
// (giai đoạn B), để fake và SQL không lệch nhau. Ca cần tiêm lỗi hoặc giữ khóa đánh dấu `fakeOnly`.
import { beforeEach, describe, it } from 'vitest';
import type { JourneySnapshot } from '../../../../shared/contracts/journeySnapshot';
import type { PublishedRoute } from '../../../../shared/contracts/publishedRoute';
import type { AdminRole, AuditRow, CheckpointStatus } from '../../contracts/adminDtos';
import type { AdminApi } from '../AdminApi';

/** Điều khiển môi trường test; mỗi adapter tự cài (fake: store in-memory; Supabase: stack local). */
export type ContractControls = {
  signInAs(role: AdminRole): Promise<void>;
  /** Danh tính đã xác thực ở provider nhưng không có AdminAccount active */
  signInWithoutAccount(): Promise<void>;
  signOut(): Promise<void>;
  /** Dòng audit theo thứ tự ghi */
  auditRows(): Promise<AuditRow[]>;
  /** Tạo thẳng chủ sở hữu media để test không phụ thuộc story khác */
  seedRoute(name: string): Promise<string>;
  seedCheckpoint(name: string): Promise<string>;
  /** Tạo thẳng một AdminAccount (đã nối danh tính nếu `ACTIVE`/`DEACTIVATED`) */
  seedAccount(account: { email: string; role: AdminRole; status: 'ACTIVE' | 'DEACTIVATED' | 'INVITATION_PENDING' }): Promise<void>;
  /** fakeOnly */
  failNext?(action: string, messageKey?: 'MSG-PUBLISH-FAILED' | 'MSG-CLOSE-FAILED' | 'MSG-GENERIC'): void;
  /** fakeOnly */
  holdLock?(key: string): void;
  /** fakeOnly: identifier QR kế tiếp được "sinh" lấy từ danh sách này (giả lập va chạm, BR-M03-B03) */
  queueQrIdentifiers?(ids: string[]): void;
  /** fakeOnly: xóa object khỏi Storage để giả lập ảnh không đọc được (BR-M03-D04 điều 4) */
  removeStorageObject?(objectPath: string): void;
  /** fakeOnly: đổi dung lượng đã ghi nhận của một media (giả lập gói tải trước vượt trần, BR-M03-G10) */
  inflateMedia?(mediaId: string, sizeBytes: number): void;
  /** fakeOnly: đặt thẳng trạng thái điểm dừng (đóng/mở lại thật ở US6) */
  setCheckpointStatus?(checkpointId: string, status: CheckpointStatus): void;
  /** Những gì M01 đọc được của một tuyến: dòng Published Route và snapshot active (publication-public §2–§3) */
  readPublication(routeId: string): Promise<{ route: PublishedRoute | null; snapshot: JourneySnapshot | null }>;
};

export type ContractSubject = { api: AdminApi; controls: ContractControls };

export type ContractContext = {
  /** Subject mới cho mỗi test (beforeEach) */
  subject(): ContractSubject;
  /** `it` cho ca chỉ chạy được trên adapter giả */
  itFakeOnly: typeof it | typeof it.skip;
};

export type ContractSuite = (context: ContractContext) => void;

export function describeAdminApiContract(
  adapterName: string,
  makeSubject: () => ContractSubject | Promise<ContractSubject>,
  suites: Record<string, ContractSuite>,
  options: { fakeOnly: boolean },
): void {
  describe(`AdminApi contract — ${adapterName}`, () => {
    let current: ContractSubject | undefined;
    beforeEach(async () => {
      current = await makeSubject();
    });
    const context: ContractContext = {
      subject: () => {
        if (!current) throw new Error('subject chưa được tạo');
        return current;
      },
      itFakeOnly: options.fakeOnly ? it : it.skip,
    };
    for (const [name, suite] of Object.entries(suites)) {
      describe(name, () => suite(context));
    }
  });
}

/** Tệp synthetic cho test upload */
export function syntheticFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}
