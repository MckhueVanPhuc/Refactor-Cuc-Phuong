// SCR-M01-002 Gợi ý tuyến — form (FR-M01-004; US-M01-02 mục 2–3; screen spec §3–§6). Mỗi nhóm là một radio group dùng
// được bằng bàn phím (OQ-SCR-M01-002-002); nút lọc vô hiệu khi thiếu tiêu chí; bấm thì mở trang kết quả riêng
// (RecommendResultsPage). Nguồn không đọc được thì báo nguồn. Tiêu chí chỉ ở React state của layout (HC-007).
import { useEffect, useId, useRef } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '../../../app/paths';
import { emitMascotEvent, MascotSlot } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useCatalog } from '../catalog/catalogStore';
import { useM01Messages } from '../i18n/useM01Messages';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import { useRecommendationCriteria } from './criteriaContext';
import { criteriaGroups, type CriteriaGroup, type GroupKey } from './groups';
import { recommend } from './recommend';
import styles from './RecommendPage.module.css';

/** Trạng thái điều hướng: trang kết quả mở từ form nên "Đổi tiêu chí" chỉ cần quay lại một bước. */
export type RecommendResultsState = { fromForm: true };

/** Cho phép xuống dòng ngay sau "/" (ví dụ "Cá nhân/người lớn") mà không đổi chữ đọc được. */
function breakAfterSlash(text: string) {
  return text.split('/').flatMap((part, index) => (index === 0 ? [part] : ['/', <wbr key={index} />, part]));
}

/** Nhãn có phần trong ngoặc (ví dụ "Ngắn (đến 90 phút)") xuống dòng phần ngoặc; chữ đọc được vẫn y nguyên. */
function OptionLabel({ label }: { label: string }) {
  const cut = label.indexOf(' (');
  if (cut < 0) return <span className={styles.optionText}>{breakAfterSlash(label)}</span>;
  return (
    <span className={styles.optionText}>
      {label.slice(0, cut)}{' '}
      <span className={styles.optionNote}>{label.slice(cut + 1)}</span>
    </span>
  );
}

function ChoiceGroup({
  group,
  value,
  onChange,
}: {
  group: CriteriaGroup;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const titleId = useId();
  return (
    <div className={styles.group} role="radiogroup" aria-labelledby={titleId}>
      <p className={styles.groupTitle} id={titleId}>
        <TintIcon name={group.icon} />
        {group.title}
      </p>
      <div className={styles.options}>
        {group.options.map((option) => (
          <label className={styles.option} key={option.value}>
            <input
              type="radio"
              name={`recommend-${group.key}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <OptionLabel label={option.label} />
          </label>
        ))}
      </div>
    </div>
  );
}

export function RecommendPage() {
  const { source } = useM01Services();
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const catalog = useCatalog(source);
  const navigate = useNavigate();
  const { criteria, setCriteria, focusChoiceOnReturn } = useRecommendationCriteria();
  const formRef = useRef<HTMLFormElement>(null);

  const routes = catalog.status === 'ready' ? catalog.routes : [];
  const complete = recommend(routes, criteria, language).kind === 'results';
  const groups = criteriaGroups(messages);

  // Mila hỏi tiêu chí khi mở form lần đầu (MAS-B-010); chỉ phát sự kiện, không đổi hành vi form
  useEffect(() => emitMascotEvent({ type: 'm01.recommend.opened' }), []);

  // Quay về từ "Đổi tiêu chí": focus về lựa chọn đang chọn (không phải radio đầu tiên của nhóm)
  useEffect(() => {
    if (!focusChoiceOnReturn.current) return;
    focusChoiceOnReturn.current = false;
    const form = formRef.current;
    (form?.querySelector<HTMLInputElement>('input:checked') ?? form?.querySelector<HTMLInputElement>('input'))?.focus();
  }, [focusChoiceOnReturn]);

  function update(key: GroupKey, value: string) {
    setCriteria((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <>
      <div className={styles.head}>
        <h1 className={styles.title}>
          <TintIcon name="leaf" className={styles.leaf} />
          {messages.screenTitle.recommend}
        </h1>
        {/* Mila đứng cạnh tiêu đề (spec-Mascot v1.5 §5.1 SCR-M01-002 "Heading", DOCK); trống thì không chiếm chỗ */}
        <MascotSlot id="recommend-head" modes={['DOCK']} size="recommend" />
      </div>
      {catalog.status === 'unavailable' && <p className={styles.message}>{messages.recommend.sourceUnavailable}</p>}
      <form
        className={styles.form}
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          const state: RecommendResultsState = { fromForm: true };
          if (complete) void navigate(PATHS.recommendResults, { state });
        }}
      >
        {groups.map((group) => (
          <ChoiceGroup
            key={group.key}
            group={group}
            value={criteria[group.key]}
            onChange={(value) => update(group.key, value)}
          />
        ))}
        <button type="submit" className={styles.submit} disabled={!complete || catalog.status !== 'ready'}>
          <TintIcon name="send" />
          {messages.recommend.submit}
        </button>
      </form>
    </>
  );
}
