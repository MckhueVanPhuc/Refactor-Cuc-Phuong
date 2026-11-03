// Bảng có kiểu của ba store M02 trên database dùng chung (Physical §11). Chỉ code trong src/modules/m02/storage/
// dùng file này.
import type { Table } from 'dexie';
import { visitorDb } from '../../../shared/db/visitorDb';
import type { CheckpointVisitRow, PendingSyncItemRow, PlaySessionRow } from './rows';

export const playSessionsTable: Table<PlaySessionRow, string> = visitorDb.table('playSessions');
export const checkpointVisitsTable: Table<CheckpointVisitRow, [string, string]> = visitorDb.table('checkpointVisits');
export const pendingSyncItemsTable: Table<PendingSyncItemRow, string> = visitorDb.table('pendingSyncItems');

/** Ba store mà mọi transaction tạo/thay/kết thúc phiên ghi cùng lúc (data-model §3). */
export const M02_SESSION_TABLES = [playSessionsTable, checkpointVisitsTable, pendingSyncItemsTable];
