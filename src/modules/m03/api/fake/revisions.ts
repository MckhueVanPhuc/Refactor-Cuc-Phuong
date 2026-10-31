// Revision trên adapter giả (spec-M03 §6.3; BR-M03-F06): mỗi mục có tối đa một bản nháp chờ dùng chung và
// tối đa một bản `PHAT_HANH`; xuất bản đưa bản cũ về `LUU_TRU`. Dùng chung cho tuyến, điểm dừng và QR.
import type { EditorRevision, SubjectType } from '../../contracts/adminDtos';
import type { CommandSpec, FakeRevision, FakeStore } from './store';

export function revisionsOf(store: FakeStore, subjectType: SubjectType, subjectId: string): FakeRevision[] {
  return [...store.state.revisions.values()]
    .filter((rev) => rev.subjectType === subjectType && rev.subjectId === subjectId)
    .sort((a, b) => a.revisionNumber - b.revisionNumber);
}

export function draftOf(store: FakeStore, subjectType: SubjectType, subjectId: string): FakeRevision | undefined {
  return revisionsOf(store, subjectType, subjectId).find((rev) => rev.status === 'NHAP');
}

export function publishedOf(store: FakeStore, subjectType: SubjectType, subjectId: string): FakeRevision | undefined {
  return revisionsOf(store, subjectType, subjectId).find((rev) => rev.status === 'PHAT_HANH');
}

/** Đã từng xuất bản: có bản `PHAT_HANH` hoặc bản cũ `LUU_TRU` */
export function everPublished(store: FakeStore, subjectType: SubjectType, subjectId: string): boolean {
  return revisionsOf(store, subjectType, subjectId).some((rev) => rev.status === 'PHAT_HANH' || rev.status === 'LUU_TRU');
}

/** Nội dung đang sửa: bản nháp nếu có, ngược lại bản đã xuất bản */
export function currentContent<C>(store: FakeStore, subjectType: SubjectType, subjectId: string): C | undefined {
  return (draftOf(store, subjectType, subjectId) ?? publishedOf(store, subjectType, subjectId))?.content as C | undefined;
}

/** Ghi bản nháp chờ: sửa bản đang có, hoặc tạo bản mới dựa trên bản đã xuất bản (lần lưu đầu của một lần sửa) */
export function writeDraft(
  store: FakeStore,
  subjectType: SubjectType,
  subjectId: string,
  content: FakeRevision['content'],
  actorEmail: string,
): FakeRevision {
  const now = store.now();
  const existing = draftOf(store, subjectType, subjectId);
  if (existing) {
    existing.content = structuredClone(content);
    existing.lastEditedByEmail = actorEmail;
    existing.lastEditedAt = now;
    existing.concurrencyRevision += 1;
    return existing;
  }
  const all = revisionsOf(store, subjectType, subjectId);
  const published = all.find((rev) => rev.status === 'PHAT_HANH');
  const revision: FakeRevision = {
    revisionId: store.newUuid(),
    subjectType,
    subjectId,
    revisionNumber: (all.at(-1)?.revisionNumber ?? 0) + 1,
    status: 'NHAP',
    content: structuredClone(content),
    lastEditedByEmail: actorEmail,
    lastEditedAt: now,
    concurrencyRevision: 1,
  };
  if (published) revision.basedOnRevisionNumber = published.revisionNumber;
  store.state.revisions.set(revision.revisionId, revision);
  return revision;
}

/** Bản nháp → `PHAT_HANH`, bản đang xuất bản → `LUU_TRU`. Trả cờ "tự xuất bản" (người xuất bản là người sửa cuối). */
export function publishDraft(store: FakeStore, draft: FakeRevision, actorEmail: string): boolean {
  const previous = publishedOf(store, draft.subjectType, draft.subjectId);
  if (previous) {
    previous.status = 'LUU_TRU';
    previous.concurrencyRevision += 1;
  }
  const selfPublished = draft.lastEditedByEmail === actorEmail;
  draft.status = 'PHAT_HANH';
  draft.publishedByEmail = actorEmail;
  draft.publishedAt = store.now();
  draft.selfPublished = selfPublished;
  draft.concurrencyRevision += 1;
  return selfPublished;
}

export function toEditorRevision<C>(rev: FakeRevision | undefined): EditorRevision<C> | undefined {
  if (!rev) return undefined;
  const summary: EditorRevision<C> = {
    revisionNumber: rev.revisionNumber,
    status: rev.status,
    lastEditedByEmail: rev.lastEditedByEmail,
    lastEditedAt: rev.lastEditedAt,
    concurrencyRevision: rev.concurrencyRevision,
    content: structuredClone(rev.content) as C,
  };
  if (rev.basedOnRevisionNumber !== undefined) summary.basedOnRevisionNumber = rev.basedOnRevisionNumber;
  if (rev.publishedByEmail !== undefined) summary.publishedByEmail = rev.publishedByEmail;
  if (rev.publishedAt !== undefined) summary.publishedAt = rev.publishedAt;
  if (rev.selfPublished !== undefined) summary.selfPublished = rev.selfPublished;
  return summary;
}

/**
 * Kiểm tra stale cho một mục và bản nháp chờ của nó (BR-M03-F06). Bản nháp đã có mà người gọi không gửi
 * `draft` nghĩa là người khác vừa tạo bản nháp → stale.
 */
export function expectedFor(
  entity: { concurrencyRevision: number; lastEditedByEmail: string; lastEditedAt: string },
  draft: FakeRevision | undefined,
  submitted: { entity?: number | undefined; draft?: number | undefined } | undefined,
): NonNullable<CommandSpec['expected']> {
  const checks: NonNullable<CommandSpec['expected']> = [
    {
      submitted: submitted?.entity,
      current: entity.concurrencyRevision,
      editorEmail: entity.lastEditedByEmail,
      editedAt: entity.lastEditedAt,
    },
  ];
  if (draft) {
    checks.push({
      submitted: submitted?.draft,
      current: draft.concurrencyRevision,
      editorEmail: draft.lastEditedByEmail,
      editedAt: draft.lastEditedAt,
    });
  }
  return checks;
}

/** Ghi nhận một lần sửa trên bản ghi thực thể */
export function touch(
  store: FakeStore,
  entity: { concurrencyRevision: number; lastEditedByEmail: string; lastEditedAt: string },
  actorEmail: string,
): void {
  entity.concurrencyRevision += 1;
  entity.lastEditedByEmail = actorEmail;
  entity.lastEditedAt = store.now();
}
