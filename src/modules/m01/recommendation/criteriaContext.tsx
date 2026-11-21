// Tiêu chí gợi ý dùng chung giữa form (/recommend) và trang kết quả (/recommend/results) của SCR-M01-002.
// `RecommendationContext` là state tạm (HC-007): chỉ nằm trong bộ nhớ của layout M01, không lên URL, không lưu; tải lại
// trang là mất. Đặt ở layout để quay lại từ chi tiết tuyến vẫn thấy đúng kết quả.
import { createContext, useContext, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import type { RecommendationCriteria } from './recommend';

type CriteriaContextValue = {
  criteria: RecommendationCriteria;
  setCriteria: (update: (previous: RecommendationCriteria) => RecommendationCriteria) => void;
  /** Đặt bởi trang kết quả khi bấm "Đổi tiêu chí": form đưa focus về lựa chọn đang chọn khi mở lại. */
  focusChoiceOnReturn: MutableRefObject<boolean>;
};

const CriteriaContext = createContext<CriteriaContextValue | null>(null);

export function RecommendationCriteriaProvider({ children }: { children: ReactNode }) {
  const [criteria, setCriteria] = useState<RecommendationCriteria>({});
  const focusChoiceOnReturn = useRef(false);
  return (
    <CriteriaContext.Provider value={{ criteria, setCriteria, focusChoiceOnReturn }}>{children}</CriteriaContext.Provider>
  );
}

export function useRecommendationCriteria(): CriteriaContextValue {
  const value = useContext(CriteriaContext);
  if (!value) throw new Error('useRecommendationCriteria cần RecommendationCriteriaProvider (VisitorLayout)');
  return value;
}
