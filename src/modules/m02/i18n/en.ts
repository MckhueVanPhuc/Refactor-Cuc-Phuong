// Chữ tiếng Anh của M02 (research R-14). Nhóm `notice` và `endPrompt` chép nguyên văn spec-M02 §5.1 "Fixed visitor
// messages"; các nhóm còn lại chép nguyên văn bảng copy của screen spec SCR-M02-001…004.
import type { M02Messages } from './vi';

export const en: M02Messages = {
  // Tiêu đề màn: bảng copy SCR-M02-001 (E-SCR-M02-001-02) và SCR-M02-004
  screenTitle: {
    trip: 'Your trip',
    // Tên sản phẩm, không dịch
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
    allScanned: ({ n }: { n: number }) => `You've scanned all ${n} checkpoints. End your trip?`,
    someLeft: ({ r }: { r: number }) =>
      r === 1 ? '1 checkpoint not scanned yet. End your trip anyway?' : `${r} checkpoints not scanned yet. End your trip anyway?`,
    end: 'End',
    continue: 'Continue',
  },
  trip: {
    scan: 'Scan QR',
    scanned: 'QR scanned',
    lookingUp: 'Checking the QR code…',
    visitRecorded: 'Scan recorded.',
    replaceFailed: 'Could not start the new trip. Your current trip is still in progress.',
    previousTripSyncError: 'Your previous trip could not be sent to the system. It is still saved on this device.',
    // Nút Finish (E-SCR-M02-001-19)
    finish: 'End trip',
    allScanned: ({ n }) => `You've scanned all ${n} points!`,
  },
  toast: {
    close: 'Dismiss',
  },
  // SCR-M02-001: journey và scanner
  journey: {
    heading: 'Journey',
    notScanned: 'Not scanned',
    progress: ({ scanned, total }) => `QR scanned: ${scanned}/${total} points`,
    currentRoute: 'Current route',
    remaining: ({ r }) => (r === 1 ? '1 stop left' : `${r} stops left`),
    allScanned: 'Every stop scanned',
    next: 'Next',
  },
  scanNotice: {
    uncheckedTitle: "This code couldn't be checked",
    notCounted: "This scan wasn't counted.",
    notCountedJourney: "This scan wasn't counted. Your journey below is unchanged.",
    retry: 'Try again',
  },
  scanner: {
    title: 'Scan a QR code',
    instruction: "Point the camera at the stop's QR code.",
    close: 'Close camera',
    retry: 'Try again',
    lookingFor: ({ number, name }) => `Looking for stop ${number} · ${name}`,
    howToTitle: 'How to turn on the camera',
    steps: ['Open your phone or browser settings', 'Allow camera access for this app', 'Come back and tap Try again'],
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
    downloadHint: "When you're online, open Resources to download this route's pack.",
    openResources: 'Open Resources',
    retry: 'Try again',
    mediaError: 'This file cannot be played.',
    play: 'Play',
    pause: 'Pause',
    scannedAt: ({ time }) => `Scanned at ${time}`,
    back: 'Back',
    audioLabel: ({ n }) => `Audio ${n}`,
    videoLabel: ({ n }) => `Video ${n}`,
    galleryTitle: 'Photo gallery',
    aboutTitle: ({ name }) => `About ${name}`,
    previousPhoto: 'Previous photo',
    nextPhoto: 'Next photo',
  },
  end: {
    chipComplete: 'Journey complete',
    chipEnded: 'Trip ended',
    title: 'Thank you for exploring Cuc Phuong.',
    farewell: 'See you on your next journey.',
    routeComplete: 'You walked the whole route',
    routeYours: 'Your route',
    visitedCount: 'stops visited',
    listTitle: 'Your journey',
    visited: 'Visited',
    missed: 'Not visited yet',
    syncPending: 'Waiting to sync',
    syncSynced: 'Synced to the park system',
    syncConflict: 'This trip could not be sent to the system. It is still saved on this device.',
    suggestNext: 'Suggest my next route',
    backToRoutes: 'Back to routes',
  },
  qrLink: {
    chooseRoute: 'Choose a route',
  },
};
