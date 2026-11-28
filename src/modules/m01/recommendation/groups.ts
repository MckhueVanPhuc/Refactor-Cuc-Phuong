// Ba nhóm tiêu chí của SCR-M01-002 (thứ tự, nhãn, icon), dùng chung cho form và trang kết quả.
import { experienceTag, groupTag, timeTag } from '../../../shared/contracts/publishedRoute';
import type { M01Messages } from '../i18n/vi';
import type { RecommendationCriteria } from './recommend';

export type GroupKey = keyof RecommendationCriteria;

export type CriteriaGroup = { key: GroupKey; title: string; icon: string; options: { value: string; label: string }[] };

export function criteriaGroups(messages: M01Messages): CriteriaGroup[] {
  const labels = messages.labels;
  return [
    {
      key: 'time',
      title: messages.recommend.groupTitle.time,
      icon: 'clock',
      options: timeTag.options.map((v) => ({ value: v, label: labels.timeTag[v] })),
    },
    {
      key: 'group',
      title: messages.recommend.groupTitle.group,
      icon: 'people',
      options: groupTag.options.map((v) => ({ value: v, label: labels.groupTag[v] })),
    },
    {
      key: 'experience',
      title: messages.recommend.groupTitle.experience,
      icon: 'tree',
      options: experienceTag.options.map((v) => ({ value: v, label: labels.experienceTag[v] })),
    },
  ];
}
