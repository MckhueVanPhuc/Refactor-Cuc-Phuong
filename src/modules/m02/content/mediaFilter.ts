// Danh sách audio/video hiển thị (tasks T053; BR-M02-026; FR-M02-014; research R-12): chỉ tệp có `spokenLanguage` bằng
// ngôn ngữ hiện tại hoặc `NONE`, giữ thứ tự nhận; nhãn đánh số trong từng loại ("Âm thanh 1", "Video 1").
import type { LanguageCode } from '../../../shared/contracts/languagePreference';
import type { MediaResource } from '../../../shared/contracts/liveQrLookup';
import type { M02Messages } from '../i18n';

export type MediaItem = { resource: MediaResource; label: string };

export function filterMedia(media: readonly MediaResource[], language: LanguageCode, messages: M02Messages): MediaItem[] {
  const counters = { AUDIO: 0, VIDEO: 0 };
  return media
    .filter((resource) => resource.spokenLanguage === language || resource.spokenLanguage === 'NONE')
    .map((resource) => {
      counters[resource.type] += 1;
      const n = counters[resource.type];
      return { resource, label: resource.type === 'AUDIO' ? messages.content.audioLabel({ n }) : messages.content.videoLabel({ n }) };
    });
}
