// SCR-M02-002 — Nội dung điểm tham quan. US2 (tasks T047): nhận kết quả quét qua router state và hiện phản hồi
// "Visit recorded" khi lần quét vừa ghi lượt ghé. Nội dung live/gói, ảnh và media dựng ở US3.
import { useLocation, useParams } from 'react-router';
import { useM02Messages } from '../i18n/useM02Messages';
import { FieldLayout, FieldNotice } from '../layout/FieldLayout';
import type { ContentRouteState } from '../session/TripPage';
import styles from './ContentPage.module.css';

export function ContentPage() {
  const messages = useM02Messages();
  const { qrIdentifier } = useParams();
  const state = (useLocation().state ?? {}) as ContentRouteState;

  return (
    <FieldLayout surface="reader">
      {state.scan?.visitCreated && (
        <FieldNotice>
          <p className={styles.recorded} role="status">
            {messages.trip.visitRecorded}
          </p>
        </FieldNotice>
      )}
      <div
        data-qr={qrIdentifier}
        data-display={state.scan?.display.kind ?? (state.review ? 'REVIEW' : 'NONE')}
        data-visit-checkpoint={state.scan?.visit?.checkpointId}
      />
    </FieldLayout>
  );
}
