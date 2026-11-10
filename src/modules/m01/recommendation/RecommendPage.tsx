// SCR-M01-002 Gợi ý tuyến (FR-M01-004; US-M01-02 mục 2–3; screen spec §3–§6). Mỗi nhóm là một radio group dùng được
// bằng bàn phím (OQ-SCR-M01-002-002); nút lọc vô hiệu khi thiếu tiêu chí; 0 kết quả không nới tiêu chí; nguồn không
// đọc được thì báo nguồn, không báo "không có tuyến". Tiêu chí chỉ ở React state (HC-007).
import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/paths';
import { experienceTag, groupTag, timeTag } from '../../../shared/contracts/publishedRoute';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useCatalog } from '../catalog/catalogStore';
import { RouteCard } from '../catalog/RouteCard';
import { useM01Messages } from '../i18n/useM01Messages';
import { useDisplayLanguage } from '../language/useLanguagePreference';
import { useSignedUrls } from '../media/useSignedUrls';
import { recommend, type RecommendationCriteria, type RecommendationResult } from './recommend';
import styles from './RecommendPage.module.css';

type GroupKey = keyof RecommendationCriteria;

const GROUP_ICONS: Record<GroupKey, string> = { time: 'clock', group: 'people', experience: 'tree' };

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
  name,
  title,
  options,
  value,
  onChange,
}: {
  name: GroupKey;
  title: string;
  options: readonly { value: string; label: string }[];
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const titleId = useId();
  return (
    <div className={styles.group} role="radiogroup" aria-labelledby={titleId}>
      <p className={styles.groupTitle} id={titleId}>
        <TintIcon name={GROUP_ICONS[name]} />
        {title}
      </p>
      <div className={styles.options}>
        {options.map((option) => (
          <label className={styles.option} key={option.value}>
            <input
              type="radio"
              name={`recommend-${name}`}
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
  const { source, media } = useM01Services();
  const messages = useM01Messages();
  const language = useDisplayLanguage();
  const catalog = useCatalog(source);
  const [criteria, setCriteria] = useState<RecommendationCriteria>({});
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const routes = catalog.status === 'ready' ? catalog.routes : [];
  const complete = recommend(routes, criteria, language).kind === 'results';
  const results = result?.kind === 'results' ? recommend(routes, criteria, language) : null;
  const matched = results?.kind === 'results' ? results.routes : [];
  const thumbnails = useSignedUrls(
    media,
    matched.map((route) => route.thumbnail.sourceRef),
  );

  const labels = messages.labels;
  const groups: { key: GroupKey; title: string; options: { value: string; label: string }[] }[] = [
    { key: 'time', title: messages.recommend.groupTitle.time, options: timeTag.options.map((v) => ({ value: v, label: labels.timeTag[v] })) },
    { key: 'group', title: messages.recommend.groupTitle.group, options: groupTag.options.map((v) => ({ value: v, label: labels.groupTag[v] })) },
    {
      key: 'experience',
      title: messages.recommend.groupTitle.experience,
      options: experienceTag.options.map((v) => ({ value: v, label: labels.experienceTag[v] })),
    },
  ];

  function update(key: GroupKey, value: string) {
    setCriteria((previous) => ({ ...previous, [key]: value }));
    setResult(null);
  }

  function changeChoices() {
    setResult(null);
    // Ưu tiên radio đang chọn; `'input:checked, input'` trả phần tử đầu theo thứ tự tài liệu nên luôn là radio đầu tiên
    const form = formRef.current;
    (form?.querySelector<HTMLInputElement>('input:checked') ?? form?.querySelector<HTMLInputElement>('input'))?.focus();
  }

  const summary = groups
    .map((group) => group.options.find((option) => option.value === criteria[group.key])?.label)
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <h1 className={styles.title}>
        <TintIcon name="leaf" className={styles.leaf} />
        {messages.screenTitle.recommend}
      </h1>
      {catalog.status === 'unavailable' && <p className={styles.message}>{messages.recommend.sourceUnavailable}</p>}
      <form
        className={styles.form}
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          if (complete) setResult(recommend(routes, criteria, language));
        }}
      >
        {groups.map((group) => (
          <ChoiceGroup
            key={group.key}
            name={group.key}
            title={group.title}
            options={group.options}
            value={criteria[group.key]}
            onChange={(value) => update(group.key, value)}
          />
        ))}
        <button type="submit" className={styles.submit} disabled={!complete || catalog.status !== 'ready'}>
          <TintIcon name="send" />
          {messages.recommend.submit}
        </button>
      </form>

      {results?.kind === 'results' && (
        <section aria-live="polite">
          <p className={styles.summary}>{summary}</p>
          {matched.length > 0 ? (
            <ul className={styles.list}>
              {matched.map((route) => (
                <li key={route.routeId}>
                  <RouteCard route={route} language={language} thumbnailUrl={thumbnails.get(route.thumbnail.sourceRef)} />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <p>{messages.recommend.noMatch}</p>
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={changeChoices}>
                  {messages.recommend.changeChoices}
                </button>
                <Link className={styles.secondary} to={PATHS.catalog}>
                  <TintIcon name="star" />
                  {messages.recommend.seeAllRoutes}
                </Link>
              </div>
            </div>
          )}
        </section>
      )}
      {results?.kind !== 'results' && (
        <div className={`${styles.actions} ${styles.footerActions}`}>
          <Link className={`${styles.secondary} ${styles.wide}`} to={PATHS.catalog}>
            <TintIcon name="star" />
            {messages.recommend.seeAllRoutes}
          </Link>
        </div>
      )}
    </>
  );
}
