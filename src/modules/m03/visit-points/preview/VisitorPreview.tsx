// Xem trước như du khách (tasks T092; BR-M03-F12; admin-ui-flow §5; Should). Render ở client từ bản nháp:
// không ghi gì, không gọi lookup, chỉ xin URL đọc media của admin. Không bao giờ hiện cho du khách.
import { useState } from 'react';
import { useAdminApi } from '../../api/AdminApiProvider';
import type { ConnectivityMode, DraftBilingual, MediaType, SpokenLanguage } from '../../contracts/adminDtos';
import { useMediaUrl } from '../../media/signedUrl';
import { formatMessage } from '../../messages/catalog';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import styles from './VisitorPreview.module.css';

export type PreviewMedia = { mediaId: string; type: MediaType; sourceRef: string; spokenLanguage?: SpokenLanguage | undefined };

export type VisitorPreviewProps = {
  checkpointName: DraftBilingual;
  connectivityMode?: ConnectivityMode | undefined;
  objectName: DraftBilingual;
  introductionText: DraftBilingual;
  media: readonly PreviewMedia[];
};

type Language = 'vi' | 'en';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
];

function PreviewImage({ sourceRef }: { sourceRef: string }) {
  const { url } = useMediaUrl(useAdminApi(), sourceRef);
  return url ? <img className={styles.image} src={url} alt="" /> : null;
}

function PreviewAv({ item }: { item: PreviewMedia }) {
  const { url } = useMediaUrl(useAdminApi(), item.sourceRef);
  if (!url) return null;
  return (
    <figure className={styles.av}>
      {item.type === 'VIDEO' ? <video className={styles.video} src={url} controls /> : <audio src={url} controls />}
      {item.spokenLanguage === 'NONE' ? <figcaption className={styles.caption}>{DISPLAY_NAMES.spokenLanguage.NONE}</figcaption> : null}
    </figure>
  );
}

export function VisitorPreview({ checkpointName, connectivityMode, objectName, introductionText, media }: VisitorPreviewProps) {
  const [language, setLanguage] = useState<Language>('vi');
  const images = media.filter((item) => item.type === 'IMAGE');
  // Âm thanh/video chỉ ở điểm dừng có mạng: tệp của ngôn ngữ đang chọn và tệp "Không lời" (BR-M03-E17)
  const av =
    connectivityMode === 'ONLINE_AVAILABLE'
      ? media.filter((item) => item.type !== 'IMAGE' && (item.spokenLanguage === language || item.spokenLanguage === 'NONE'))
      : [];

  return (
    <section className={styles.preview} aria-label="Xem trước như du khách">
      <p className={styles.label}>{formatMessage('MSG-PREVIEW-DRAFT')}</p>
      <div className={styles.switch} role="group" aria-label="Ngôn ngữ xem trước">
        {LANGUAGES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={styles.language}
            aria-pressed={language === option.value}
            onClick={() => setLanguage(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className={styles.screen} lang={language}>
        <p className={styles.place}>{checkpointName[language]}</p>
        <h3 className={styles.name}>{objectName[language]}</h3>
        {images.map((item) => (
          <PreviewImage key={item.mediaId} sourceRef={item.sourceRef} />
        ))}
        <p className={styles.intro}>{introductionText[language]}</p>
        {av.map((item) => (
          <PreviewAv key={item.mediaId} item={item} />
        ))}
      </div>
    </section>
  );
}
