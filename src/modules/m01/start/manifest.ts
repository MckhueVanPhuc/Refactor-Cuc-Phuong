// Manifest hành trình = bản chiếu giá trị của JourneySnapshot (spec-M01 §5.3; m03-publication-consumer-contract §5;
// DAC-M01-007): đủ checkpoint, chép nguyên, không phân loại lại; không mang offlineResources, text hay ảnh.
import type { JourneyManifest } from '../../../shared/contracts/journeyManifest';
import type { JourneySnapshot } from '../../../shared/contracts/journeySnapshot';

export function manifestFromSnapshot(snapshot: JourneySnapshot): JourneyManifest {
  return {
    routeId: snapshot.routeId,
    contentVersion: snapshot.contentVersion,
    checkpoints: snapshot.checkpoints.map(({ checkpointId, sequence, checkpointName, connectivityMode, qrIdentifiers }) => ({
      checkpointId,
      sequence,
      checkpointName: { ...checkpointName },
      connectivityMode,
      qrIdentifiers: [...qrIdentifiers],
    })),
  };
}
