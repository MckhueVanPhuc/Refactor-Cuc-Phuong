// Bước 3 "Nhãn" (tasks T111): nhãn nhóm, nhãn trải nghiệm; nhãn thời gian chỉ đọc, suy từ thời lượng (BR-M03-C11, C12).
import { Checkbox } from '../../../../shared/ui/Checkbox';
import type { ExperienceTag, GroupTag } from '../../contracts/adminDtos';
import { DISPLAY_NAMES } from '../../messages/displayNames';
import { FIELD_LABELS } from '../../messages/fieldLabels';
import { timeTagName } from '../../validation/routeDerived';
import { parseNumber } from '../routeForm';
import type { StepProps } from './shared';
import styles from './steps.module.css';

function TagGroup<T extends string>({
  fieldKey,
  legend,
  names,
  selected,
  onChange,
  error,
  readOnly,
}: {
  fieldKey: string;
  legend: string;
  names: Record<T, string>;
  selected: readonly T[];
  onChange: (tags: T[]) => void;
  error: string | undefined;
  readOnly: boolean;
}) {
  return (
    <fieldset className={styles.group} data-field-key={fieldKey} tabIndex={-1}>
      <legend className={styles.groupLabel}>{legend}</legend>
      <div className={styles.tags}>
        {(Object.entries(names) as [T, string][]).map(([tag, name]) => (
          <Checkbox
            key={tag}
            label={name}
            checked={selected.includes(tag)}
            disabled={readOnly}
            // Một nhóm là tập phân biệt: một giá trị không chọn được hai lần (BR-M03-C12)
            onChange={(checked) => onChange(checked ? [...selected, tag] : selected.filter((other) => other !== tag))}
          />
        ))}
      </div>
      {error ? <p className={styles.error}>Lỗi: {error}</p> : null}
    </fieldset>
  );
}

export function TagsStep({ form, update, errorFor, readOnly }: StepProps) {
  return (
    <>
      <TagGroup<GroupTag>
        fieldKey="groupTags"
        legend={FIELD_LABELS.ROUTE.groupTags}
        names={DISPLAY_NAMES.groupTag}
        selected={form.groupTags}
        onChange={(groupTags) => update((current) => ({ ...current, groupTags }))}
        error={errorFor('groupTags')}
        readOnly={readOnly}
      />
      <TagGroup<ExperienceTag>
        fieldKey="experienceTags"
        legend={FIELD_LABELS.ROUTE.experienceTags}
        names={DISPLAY_NAMES.experienceTag}
        selected={form.experienceTags}
        onChange={(experienceTags) => update((current) => ({ ...current, experienceTags }))}
        error={errorFor('experienceTags')}
        readOnly={readOnly}
      />
      <p className={styles.derived}>Nhãn thời gian: {timeTagName(parseNumber(form.durationMin))}</p>
    </>
  );
}
