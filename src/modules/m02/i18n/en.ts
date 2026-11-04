// Chữ tiếng Anh của M02 (research R-14). Nhóm `notice` và `endPrompt` chép nguyên văn spec-M02 §5.1 "Fixed visitor
// messages"; các nhóm còn lại chép nguyên văn bảng copy của screen spec SCR-M02-001…004.
import type { M02Messages } from './vi';

export const en: M02Messages = {
  // Đề xuất của agent cho tiêu đề SCR-M02-001 (nguồn chỉ có tiếng Việt); chủ dự án duyệt 2026-11-04
  screenTitle: {
    trip: 'Your trip',
    // Tên sản phẩm, không dịch; chờ chủ dự án duyệt
    qrLink: 'Cúc Phương Quest',
  },
  notice: {
    temporarilyClosed: 'This area is temporarily closed. Please stop here or return as directed by Park Management.',
    invalid: 'This QR code is no longer valid or does not exist.',
    noOfflineResource: 'No offline content is available for this point.',
    sourceFailureInJourney: 'The latest content could not be loaded. Saved content is shown if available.',
    connectionNeeded: 'A connection is needed to check this QR code.',
    autoEndedCompleted: 'Your previous trip was ended automatically and recorded as completed.',
    autoEndedAbandoned: 'Your previous trip was ended automatically because more than 24 hours have passed.',
    freeVisitor: 'You are browsing freely; this scan is not recorded in a trip. To record your trip, choose a route.',
    cameraUnavailable: "The camera cannot be used. Allow camera access, or scan the code with your phone's own camera app.",
    sessionStartHint: 'During your trip, scan with the Scan button in the app so that your visits are recorded.',
  },
  endPrompt: {
    question: 'You have scanned the last point. End the trip?',
    end: 'End',
    continue: 'Continue',
  },
  trip: {
    scan: 'Scan',
    scanned: 'QR scanned',
    lookingUp: 'Checking the QR code…',
    visitRecorded: 'Scan recorded.',
    replaceFailed: 'Could not start the new trip. Your current trip is still in progress.',
    previousTripSyncError: 'Your previous trip could not be sent to the system. It is still saved on this device.',
    // Đề xuất của agent cho nút Finish (nguồn chỉ có tiếng Việt); chủ dự án duyệt 2026-11-04
    finish: 'End trip',
  },
  // Đề xuất của agent cho chữ lấy từ mockup-SCR-M02-001 (nguồn chỉ có tiếng Việt); chủ dự án duyệt 2026-11-04
  journey: {
    heading: 'Journey',
    notScanned: 'Not scanned',
    progress: ({ scanned, total }) => `QR scanned: ${scanned}/${total} points`,
  },
  scanner: {
    title: 'Scan a QR code',
    instruction: "Point the camera at the stop's QR code.",
    close: 'Close camera',
    retry: 'Try again',
  },
  handoff: {
    outdatedVersion: 'This trip data is from an older version. Please choose a route and start again.',
    alreadyUsed: 'This trip has already been started. To go again, choose a route and start again.',
    expired: 'This start has expired (over 24 hours). Please start again from the route list.',
    revoked: 'This route no longer accepts new trips. Please choose another route.',
    none: 'There is no trip to start. Please choose a route.',
  },
  content: {
    outdatedPackage: 'This content comes from an outdated download and may not be the latest.',
    needsNetwork: 'This point needs a network connection to show its content.',
    mediaError: 'This file cannot be played.',
    play: 'Play',
    pause: 'Pause',
    scannedAt: ({ time }) => `Scanned at ${time}`,
    back: 'Back',
    audioLabel: ({ n }) => `Audio ${n}`,
    videoLabel: ({ n }) => `Video ${n}`,
  },
  end: {
    title: 'Your trip has ended.',
    listTitle: 'Points scanned',
    syncPending: 'Waiting to be sent',
    syncSynced: 'Sent',
    syncConflict: 'This trip could not be sent to the system. It is still saved on this device.',
    backToRoutes: 'Back to routes',
  },
  qrLink: {
    chooseRoute: 'Choose a route',
  },
};
