// Dựng dữ liệu điểm dừng/điểm tham quan cho test component, qua chính AdminApi giả (không ghi thẳng store).
// Chỉ test import file này; nó không vào bundle ứng dụng.
import { syntheticFile } from '../api/contract/harness';
import { createFakeAdminApi } from '../api/fake/fakeAdminApi';
import { FIXTURE_ACCOUNTS } from '../api/fake/fixtures';
import type { FakeStore } from '../api/fake/store';
import { QR_INTRO_MIN_CHARS } from '../config/limits';
import type { AdminRole, ConnectivityMode, SpokenLanguage } from '../contracts/adminDtos';

export const READY_INTRO = 'Giới thiệu đủ dài cho du khách đọc tại chỗ.'.padEnd(QR_INTRO_MIN_CHARS, '.');

export type SeedVisitPoint = {
  name?: string;
  /** đủ tên/giới thiệu song ngữ và một ảnh đã tick quyền */
  ready?: boolean;
  audio?: SpokenLanguage;
};

export type SeedCheckpoint = {
  name: string;
  mode?: ConnectivityMode;
  visitPoints?: SeedVisitPoint[];
  publish?: boolean;
  as?: AdminRole;
};

export type SeededCheckpoint = { checkpointId: string; qrIdentifiers: string[]; imagePaths: string[] };

function must<T>(result: { ok: true; data: T } | { ok: false; reason: string }): T {
  if (!result.ok) throw new Error(`seed thất bại: ${result.reason}`);
  return result.data;
}

export async function seedCheckpoint(store: FakeStore, seed: SeedCheckpoint): Promise<SeededCheckpoint> {
  const previousUser = store.currentUserId;
  store.currentUserId = FIXTURE_ACCOUNTS[seed.as ?? 'CONTENT_STAFF'].userId;
  const api = createFakeAdminApi(store);
  try {
    const { checkpointId } = must(
      await api.saveCheckpointDraft({
        content: {
          checkpointName: { vi: seed.name, en: `${seed.name} (en)` },
          ...(seed.mode ? { connectivityMode: seed.mode } : {}),
          ...(seed.mode === 'ONLINE_AVAILABLE' ? { fieldVerificationConfirmed: true } : {}),
        },
      }),
    );

    const qrIdentifiers: string[] = [];
    const imagePaths: string[] = [];
    for (const visitPoint of seed.visitPoints ?? []) {
      const mediaItems: { mediaId: string }[] = [];
      const mediaSettings: { mediaId: string; usageRightsConfirmed: boolean; spokenLanguage?: SpokenLanguage }[] = [];
      if (visitPoint.ready) {
        const { objectPath } = await api.uploadMedia({
          ownerType: 'CHECKPOINT',
          ownerId: checkpointId,
          file: syntheticFile('anh.jpg', 'image/jpeg', 2048),
        });
        const { mediaId } = must(
          await api.registerMedia({ ownerType: 'CHECKPOINT', ownerId: checkpointId, usage: 'QR_MEDIA', type: 'IMAGE', objectPath }),
        );
        imagePaths.push(objectPath);
        mediaItems.push({ mediaId });
        mediaSettings.push({ mediaId, usageRightsConfirmed: true });
      }
      if (visitPoint.audio) {
        const { objectPath } = await api.uploadMedia({
          ownerType: 'CHECKPOINT',
          ownerId: checkpointId,
          file: syntheticFile('tieng.mp3', 'audio/mpeg', 2048),
        });
        const { mediaId } = must(
          await api.registerMedia({ ownerType: 'CHECKPOINT', ownerId: checkpointId, usage: 'QR_MEDIA', type: 'AUDIO', objectPath }),
        );
        mediaItems.push({ mediaId });
        mediaSettings.push({ mediaId, usageRightsConfirmed: true, spokenLanguage: visitPoint.audio });
      }
      const name = visitPoint.name;
      const { qrIdentifier } = must(
        await api.saveVisitPointDraft({
          checkpointId,
          content: {
            ...(name ? { objectName: visitPoint.ready ? { vi: name, en: `${name} (en)` } : { vi: name } } : {}),
            ...(visitPoint.ready ? { introductionText: { vi: READY_INTRO, en: READY_INTRO } } : {}),
            mediaItems,
          },
          mediaSettings,
        }),
      );
      qrIdentifiers.push(qrIdentifier);
    }

    if (seed.publish) {
      const review = await api.openPublicationReview({ unitType: 'CHECKPOINT_FIRST_PUBLICATION', subjectId: checkpointId });
      must(
        await api.publishUnit({
          unitType: 'CHECKPOINT_FIRST_PUBLICATION',
          subjectId: checkpointId,
          reviewedConcurrencyRevision: review.reviewedConcurrencyRevision,
        }),
      );
    }
    return { checkpointId, qrIdentifiers, imagePaths };
  } finally {
    store.currentUserId = previousUser;
  }
}
