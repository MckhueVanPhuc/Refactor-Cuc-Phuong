// Q-09 cho hộp thoại đóng/mở lại (tasks T136; BR-M03-H01, H06, X03): các tuyến bị ảnh hưởng, tuyến sẽ tự đóng,
// kết quả kiểm tra kỹ thuật khi mở lại. Chỉ nạp khi hộp thoại mở; `input` null thì không nạp gì.
import { useEffect, useState } from 'react';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import type { OperationImpact, OperationImpactInput } from '../contracts/adminDtos';

export function useOperationImpact(input: OperationImpactInput | null) {
  const api = useAdminApi();
  const [impact, setImpact] = useState<OperationImpact | null>(null);
  const [error, setError] = useState<AdminApiError | null>(null);
  const operation = input?.operation;
  const subjectId = input?.subjectId;

  useEffect(() => {
    setImpact(null);
    setError(null);
    if (!operation || !subjectId) return;
    let cancelled = false;
    api.getOperationImpact({ operation, subjectId }).then(
      (loaded) => {
        if (!cancelled) setImpact(loaded);
      },
      (caught: unknown) => {
        if (!cancelled) setError(AdminApiError.from(caught));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, operation, subjectId]);

  return { impact, error };
}
