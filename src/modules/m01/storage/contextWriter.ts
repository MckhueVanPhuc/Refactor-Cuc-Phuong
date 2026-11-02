// Ghi SelectedRouteContext v3 (selected-route-context-v3-contract §2; FR-M01-012; BR-M01-009): validate rồi một
// transaction `put` slot `current`, thay context trước. Lỗi → transaction rollback, context trước nguyên vẹn.
import {
  selectedRouteContextV3Schema,
  type SelectedRouteContextV3,
} from '../../../shared/contracts/selectedRouteContext';
import { visitorDb } from '../../../shared/db/visitorDb';
import { consumeContextWriteFailure } from './faultInjection';
import { CURRENT_SLOT } from './rows';
import { selectedRouteContextTable } from './tables';

export async function writeSelectedRouteContext(context: SelectedRouteContextV3): Promise<void> {
  const value = selectedRouteContextV3Schema.parse(context);
  await visitorDb.transaction('rw', selectedRouteContextTable, async () => {
    await selectedRouteContextTable.put({ ...value, slot: CURRENT_SLOT });
    // Tiêm lỗi cho kiểm thử (V21): ném sau khi put để kiểm rollback
    if (consumeContextWriteFailure()) throw new Error('lỗi ghi context (kiểm thử)');
  });
}
