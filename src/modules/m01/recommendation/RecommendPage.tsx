// SCR-M01-002 Gợi ý tuyến — form (FR-M01-004; US-M01-02 mục 2–3; screen spec §3–§6; spec-M01 v3.3). Mỗi nhóm là một
// nhóm ô chọn nhiều dùng được bằng bàn phím (OQ-SCR-M01-002-002): chạm để chọn, chạm lại để bỏ; "Bỏ chọn tất cả" bỏ mọi
// ý. Không chọn gì vẫn lọc được (trả mọi tuyến). Bấm lọc thì mở trang kết quả riêng (RecommendResultsPage). Nguồn không
// đọc được thì báo nguồn. Tiêu chí chỉ ở React state của layout (HC-007).
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useNavigationType } from 'react-router';
import { PATHS } from '../../../app/paths';
import { emitMascotEvent, MascotSlot } from '../../../shared/mascot/index';
import { TintIcon } from '../../../shared/ui/Icon';
import { useM01Services } from '../api/services';
import { useCatalog } from '../catalog/catalogStore';
import { useM01Messages } from '../i18n/useM01Messages';
import { useRecommendationCriteria } from './criteriaContext';
import { criteriaGroups, type CriteriaGroup, type GroupKey } from './groups';
import { hasAnyChoice } from './recommend';
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
  values,
  onToggle,
}: {
  group: CriteriaGroup;
  values: readonly string[];
  onToggle: (value: string) => void;
}) {
  const titleId = useId();
  return (
    <div className={styles.group} role="group" aria-labelledby={titleId}>
      <p className={styles.groupTitle} id={titleId}>
        <TintIcon name={group.icon} />
        {group.title}
      </p>
      <div className={styles.options}>
        {group.options.map((option) => (
          <label className={styles.option} key={option.value}>
            <input
              type="checkbox"
              name={`recommend-${group.key}`}
              value={option.value}
              checked={values.includes(option.value)}
              onChange={() => onToggle(option.value)}
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
  const catalog = useCatalog(source);
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const { criteria, setCriteria, focusChoiceOnReturn, leftResults } = useRecommendationCriteria();
  const formRef = useRef<HTMLFormElement>(null);

  const groups = criteriaGroups(messages);
  const anyChoice = hasAnyChoice(criteria);

  // Mila hỏi tiêu chí mỗi lần mở form (MAS-B-010); quay lui từ trang kết quả ("Đổi tiêu chí", Back: POP hoặc REPLACE)
  // thì Mila chỉ đứng, không nói (spec-Mascot v1.11). Chỉ phát sự kiện, không đổi hành vi form.
  // Chốt một lần lúc mở (StrictMode chạy effect hai lần nhưng giữ state)
  const [fromResults] = useState(() => leftResults.current && navigationType !== 'PUSH');
  useEffect(() => {
    leftResults.current = false;
    emitMascotEvent({ type: 'm01.recommend.opened', fromResults });
  }, [fromResults, leftResults]);

  // Quay về từ "Đổi tiêu chí": focus về lựa chọn đang chọn (không phải ô đầu tiên của nhóm)
  useEffect(() => {
    if (!focusChoiceOnReturn.current) return;
    focusChoiceOnReturn.current = false;
    const form = formRef.current;
    (form?.querySelector<HTMLInputElement>('input:checked') ?? form?.querySelector<HTMLInputElement>('input'))?.focus();
  }, [focusChoiceOnReturn]);

  function toggle(key: GroupKey, value: string) {
    setCriteria((previous) => {
      const current = previous[key] ?? [];
      const next = current.includes(value) ? current.filter((other) => other !== value) : [...current, value];
      return { ...previous, [key]: next };
    });
  }

  function clearAll() {
    setCriteria(() => ({}));
    // Nút biến mất khi không còn ý nào: đưa focus về ô đầu tiên để bàn phím không mất chỗ
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
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
          if (catalog.status === 'ready') void navigate(PATHS.recommendResults, { state });
        }}
      >
        {groups.map((group) => (
          <ChoiceGroup
            key={group.key}
            group={group}
            values={criteria[group.key] ?? []}
            onToggle={(value) => toggle(group.key, value)}
          />
        ))}
        {anyChoice && (
          <button type="button" className={styles.clearAll} onClick={clearAll}>
            <TintIcon name="close" />
            {messages.recommend.clearAll}
          </button>
        )}
        <button type="submit" className={styles.submit} disabled={catalog.status !== 'ready'}>
          <TintIcon name="send" />
          {messages.recommend.submit}
        </button>
      </form>
    </>
  );
}
