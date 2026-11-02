// Nạp dữ liệu M01 cho hook E2E và test (tasks T031; quickstart V12, V19; E2E của M02). Không phải writer nghiệp vụ:
// không qua pipeline tải hay Start. Chỉ được gọi từ src/modules/m01/testing/ (MODE e2e/fake) và test.
import { offlinePackageSchema, type OfflinePackage } from '../../../shared/contracts/offlinePackage';
import {
  selectedRouteContextV3Schema,
  type SelectedRouteContextV3,
} from '../../../shared/contracts/selectedRouteContext';
import { visitorDb } from '../../../shared/db/visitorDb';
import { declaredImageRefs } from './readers';
import { CURRENT_SLOT } from './rows';
import {
  activePackagesTable,
  imageBytesTable,
  offlinePackagesTable,
  offlineResourcesTable,
  PACKAGE_READ_TABLES,
  selectedRouteContextTable,
} from './tables';

/** Ghi context hiện tại (đã kiểm schema). */
export async function seedContext(context: SelectedRouteContextV3): Promise<void> {
  const value = selectedRouteContextV3Schema.parse(context);
  await selectedRouteContextTable.put({ ...value, slot: CURRENT_SLOT });
}

/** Ghi một gói `SAN_SANG` active (đã kiểm schema) cùng byte cho mọi ảnh khai báo; thay gói cũ của tuyến. */
export async function seedReadyPackage(pkg: OfflinePackage, blobFor: (sourceRef: string) => Blob): Promise<void> {
  const value = offlinePackageSchema.parse(pkg);
  if (value.status !== 'SAN_SANG') throw new Error('chỉ nạp gói SAN_SANG');
  const { resources, ...row } = value;
  const key = { routeId: value.routeId, contentVersion: value.contentVersion };
  const images = declaredImageRefs(value).map((sourceRef) => ({ ...key, sourceRef, blob: blobFor(sourceRef) }));
  await visitorDb.transaction('rw', PACKAGE_READ_TABLES, async () => {
    await offlinePackagesTable.where('routeId').equals(value.routeId).delete();
    await offlineResourcesTable.filter((resource) => resource.routeId === value.routeId).delete();
    await imageBytesTable.filter((image) => image.routeId === value.routeId).delete();
    await offlinePackagesTable.put(row);
    await offlineResourcesTable.bulkPut(resources.map((resource) => ({ ...resource, ...key })));
    await imageBytesTable.bulkPut(images);
    await activePackagesTable.put(key);
  });
}
