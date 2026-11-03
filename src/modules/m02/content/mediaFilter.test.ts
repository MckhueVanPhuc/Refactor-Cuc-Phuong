// Lọc audio/video theo ngôn ngữ (tasks T049; BR-M02-026; FR-M02-014; SC-M02-019).
import { describe, expect, it } from 'vitest';
import type { MediaResource } from '../../../shared/contracts/liveQrLookup';
import { en } from '../i18n/en';
import { vi } from '../i18n/vi';
import { filterMedia } from './mediaFilter';

const media: MediaResource[] = [
  { type: 'AUDIO', sourceRef: 'a-vi-1', spokenLanguage: 'vi' },
  { type: 'VIDEO', sourceRef: 'v-none', spokenLanguage: 'NONE' },
  { type: 'AUDIO', sourceRef: 'a-en', spokenLanguage: 'en' },
  { type: 'AUDIO', sourceRef: 'a-vi-2', spokenLanguage: 'vi' },
  { type: 'VIDEO', sourceRef: 'v-en', spokenLanguage: 'en' },
];

const refs = (items: ReturnType<typeof filterMedia>) => items.map((i) => i.resource.sourceRef);

describe('filterMedia', () => {
  it('vi: tệp vi + NONE theo thứ tự nhận; nhãn đánh số trong từng loại', () => {
    const items = filterMedia(media, 'vi', vi);
    expect(refs(items)).toEqual(['a-vi-1', 'v-none', 'a-vi-2']);
    expect(items.map((i) => i.label)).toEqual(['Âm thanh 1', 'Video 1', 'Âm thanh 2']);
  });

  it('en: tệp en + NONE; nhãn tiếng Anh', () => {
    const items = filterMedia(media, 'en', en);
    expect(refs(items)).toEqual(['v-none', 'a-en', 'v-en']);
    expect(items.map((i) => i.label)).toEqual(['Video 1', 'Audio 1', 'Video 2']);
  });

  it('không tệp nào khớp → rỗng', () => {
    expect(filterMedia([{ type: 'AUDIO', sourceRef: 'a-en', spokenLanguage: 'en' }], 'vi', vi)).toEqual([]);
    expect(filterMedia([], 'en', en)).toEqual([]);
  });
});
