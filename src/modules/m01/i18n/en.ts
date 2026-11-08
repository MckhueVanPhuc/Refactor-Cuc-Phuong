// Chữ tiếng Anh của M01 (research R-12). Câu chép nguyên văn bảng copy của screen spec SCR-M01-001…004.
// Tên màn, điều hướng, nhãn mục và câu hoãn cập nhật: agent đề xuất, chủ dự án duyệt và đưa vào bảng copy 2026-11-05
// (validation-report DV-13, DV-30, DV-40, DV-57, §13.3).
import type { M01Messages } from './vi';

export const en: M01Messages = {
  // Bảng copy SCR-M01-001…004 — DV-13
  nav: {
    catalog: 'Routes',
    recommend: 'Route suggestions',
    offline: 'Offline downloads',
  },
  screenTitle: {
    catalog: 'Routes',
    recommend: 'Route suggestions',
    routeDetail: 'Route details & preparation',
    offline: 'Offline downloads',
  },
  language: {
    groupLabel: 'Language',
    chooseTitle: 'Choose your language',
    chooseLead: 'Choose a language to begin your journey through Cuc Phuong National Park.',
  },

  catalog: {
    offlineNeeded: 'Download first',
    stats: ({ n, km, min }) => `${n} stops · ${km} km · ${min} min`,
    empty: 'No routes are available right now.',
    stale: 'Saved data, which may not be the latest.',
    sourceUnavailable: 'Could not load the routes. Check your connection and try again.',
  },
  update: {
    available: 'A new version of the app is available.',
    apply: 'Update',
    later: 'Later',
    deferred: 'A route download or trip is in progress. Please try updating again when it finishes.',
  },

  labels: {
    difficulty: { NHE: 'Easy', TRUNG_BINH: 'Moderate', KHO: 'Hard' },
    timeTag: {
      TIME_NGAN: 'Short (up to 90 min)',
      TIME_VUA: 'Medium (90–180 min)',
      TIME_DAI: 'Long (over 180 min)',
    },
    groupTag: {
      GROUP_CA_NHAN_NGUOI_LON: 'Individuals and adults',
      GROUP_GIA_DINH_CO_TRE: 'Family with young children',
      GROUP_CAN_DE_DANG: 'Need an easy route',
    },
    experienceTag: {
      INTEREST_THIEN_NHIEN_CHUP_ANH: 'Nature and photography',
      INTEREST_TIM_HIEU: 'Learning',
      INTEREST_KHAM_PHA: 'Exploration',
    },
  },

  recommend: {
    submit: 'Show matching routes',
    noMatch: 'No route matches your choices. You can change them or see all routes.',
    changeChoices: 'Change choices',
    seeAllRoutes: 'See all routes',
    sourceUnavailable: 'Could not load the routes. Check your connection and try again.',
    groupTitle: { time: 'Time', group: 'Who is going', experience: 'Experience' },
  },

  routeDetail: {
    // Bảng copy SCR-M01-003 — DV-30
    sections: {
      distance: 'Distance',
      duration: 'Duration',
      difficulty: 'Difficulty',
      safetyWarning: 'Safety warning',
      description: 'About this route',
      startingPoint: 'Starting point',
      participationRequirements: 'Requirements',
      preparation: 'What to bring',
      bestTime: 'Best time to go',
      highlights: 'Highlights',
      routeMap: 'Route map',
      checkpoints: 'Stops',
    },
    distanceValue: ({ km }) => `${km} km`,
    durationValue: ({ min }) => `${min} min`,
    start: 'Start',
    offlineDecisionTitle: 'Download this route first',
    stopsMayLackContent: ({ list }) => `Some stops may have no content unless you download first: ${list}.`,
    estimatedSize: ({ n }) => `Estimated size: about ${n} MB.`,
    sizeUnavailable: 'Size not available.',
    scanHint:
      'Without a network, scan codes with the Scan button in the app, because the phone camera may not be able to open the app.',
    download: 'Download',
    continueWithoutDownload: 'Continue without download',
    goBack: 'Go back',
    savedAt: ({ time }) => `Saved on ${time}; this may not be the latest information.`,
    outdated: 'This download is out of date but still usable.',
    incomplete: 'The download is not complete. Please try again.',
    startBlockedOffline: 'Cannot start: you are offline and this route has not been downloaded.',
    startFailed: 'Could not start. Please try again.',
    routeUnavailable: 'This route is not available for new trips right now.',
    sourceErrorUsingSaved: 'Could not load the latest information. Showing saved information.',
  },

  offline: {
    // Bảng copy SCR-M01-003, SCR-M01-004 — DV-40
    panelTitle: 'Offline download',
    version: ({ n }) => `Version ${n}`,
    view: 'View',
    update: 'Update',
    status: {
      notDownloaded: 'Not downloaded',
      downloading: 'Downloading',
      readyCurrent: 'Ready – up to date',
      readyOutdated: 'Ready – newer version available',
      incomplete: 'Incomplete',
    },
    essentialsSavedAt: ({ time }) => `Route information saved on ${time}`,
    hasOfflineRouteMap: 'Includes offline route map',
    updateFailed: 'Could not update. The downloaded version is still in use.',
    storageError:
      'Could not save data on this device, so the download did not finish. Your earlier download is not affected. You can try again.',
    deleteConfirm: ({ name }) => `Delete the download for "${name}"? A trip in progress is not affected.`,
    deleteConfirmAction: 'Delete',
    deleteKeepAction: 'Keep',
    empty: 'You have not downloaded any route.',
    outdatedWarning: 'This download is out of date but still usable.',
    unreadable: 'This download cannot be read',
    downloadAgain: 'Download again',
    delete: 'Delete',
  },
};
