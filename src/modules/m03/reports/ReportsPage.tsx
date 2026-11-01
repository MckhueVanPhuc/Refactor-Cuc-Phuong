// SCR-M03-005 Báo cáo vận hành (tasks T159; Q-12, Q-13; BR-M03-J05–J08; SC-M03-035): lọc tuyến (tùy chọn) và
// khoảng ngày dd/mm/yyyy (mặc định 30 ngày); hai tab RPT-01 / RPT-02; ghi chú là chữ thường một dòng, không phải
// banner. Không biểu đồ, không xuất tệp, không cập nhật tức thời. Cả hai role xem được.
import { useCallback, useEffect, useId, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Banner } from '../../../shared/ui/Banner';
import { Button } from '../../../shared/ui/Button';
import { Select } from '../../../shared/ui/Select';
import { TextField } from '../../../shared/ui/TextField';
import { useAdminApi } from '../api/AdminApiProvider';
import { AdminApiError } from '../api/errors';
import { useSessionExpiry } from '../auth/useSessionExpiry';
import { REPORT_MAX_SPAN_DAYS } from '../config/limits';
import type { ReportInput, RouteListRow } from '../contracts/adminDtos';
import type { Rpt01Output, Rpt02Output } from '../contracts/reportOutputs';
import layout from '../editor/EditorLayout.module.css';
import { formatMessage } from '../messages/catalog';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { formatDate, formatTime } from '../messages/format';
import { ADMIN_PATHS } from '../paths';
import { defaultReportDates, displayDate, resolveReportDates } from './reportInput';
import styles from './ReportsPage.module.css';

type Tab = 'summary' | 'visits';

const TABS: { id: Tab; label: string }[] = [
  { id: 'summary', label: 'Tổng hợp chuyến đi' },
  { id: 'visits', label: 'Lượt ghé theo điểm dừng' },
];

const percent = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });

type Reports = { rpt01: Rpt01Output; rpt02: Rpt02Output };

export function ReportsPage() {
  const api = useAdminApi();
  const navigate = useNavigate();
  const expire = useSessionExpiry();
  const tabsId = useId();
  const [initial] = useState(() => defaultReportDates(new Date()));
  const [fromText, setFromText] = useState(displayDate(initial.fromDate));
  const [toText, setToText] = useState(displayDate(initial.toDate));
  const [routeId, setRouteId] = useState('');
  const [routes, setRoutes] = useState<RouteListRow[]>([]);
  const [tab, setTab] = useState<Tab>('summary');
  const [reports, setReports] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AdminApiError | null>(null);

  const dates = resolveReportDates({ fromText, toText }, new Date());

  const query = useCallback(
    async (input: ReportInput) => {
      setLoading(true);
      try {
        const [rpt01, rpt02] = await Promise.all([api.reportRpt01(input), api.reportRpt02(input)]);
        setReports({ rpt01, rpt02 });
        setError(null);
      } catch (caught) {
        const apiError = AdminApiError.from(caught);
        if (apiError.messageKey === 'MSG-SESSION-EXPIRED') expire();
        else setError(apiError);
      } finally {
        setLoading(false);
      }
    },
    [api, expire],
  );

  /** "Áp dụng": chỉ gửi khi khoảng ngày hợp lệ (E-SCR-M03-005-09) */
  function apply() {
    if (!dates.ok) return;
    void query({ fromDate: dates.fromDate, toDate: dates.toDate, ...(routeId ? { routeId } : {}) });
  }

  useEffect(() => {
    void query({ fromDate: initial.fromDate, toDate: initial.toDate });
    api.listRoutes({}).then(
      (rows) => setRoutes(rows.filter((row) => row.status !== 'NHAP')),
      () => setRoutes([]),
    );
  }, [api, initial, query]);

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = TABS[(TABS.findIndex((item) => item.id === tab) + (event.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!;
    setTab(next.id);
    document.getElementById(`${tabsId}-${next.id}`)?.focus();
  }

  const lastIngestion = reports?.rpt01.lastSuccessfulIngestionAt;
  const routeOptions = [{ value: '', label: 'Tất cả tuyến' }, ...routes.map((row) => ({ value: row.routeId, label: row.name ?? 'Tuyến chưa đặt tên' }))];
  const empty = reports !== null && reports.rpt01.totalSessionCount === 0;

  return (
    <div className={layout.page}>
      <div className={layout.heading}>
        <div className={layout.titleBlock}>
          <h1 className={layout.title}>Báo cáo vận hành</h1>
          {reports ? (
            <p className={layout.note}>
              {lastIngestion
                ? formatMessage('MSG-REPORT-UPDATED', { giờ: formatTime(lastIngestion), ngày: formatDate(lastIngestion) })
                : formatMessage('MSG-REPORT-NO-DATA-YET')}
            </p>
          ) : null}
          <p className={layout.note}>{formatMessage('MSG-REPORT-SCOPE')}</p>
        </div>
        <div className={layout.headingActions}>
          <Button onClick={() => void navigate(ADMIN_PATHS.routes)}>Quay lại</Button>
        </div>
      </div>

      <div className={styles.filters} role="search">
        <TextField label="Từ ngày" value={fromText} onChange={setFromText} placeholder="dd/mm/yyyy" />
        <TextField label="Đến ngày" value={toText} onChange={setToText} placeholder="dd/mm/yyyy" />
        <Select label="Tuyến" value={routeId} options={routeOptions} onChange={setRouteId} />
        <div className={styles.apply}>
          <Button variant="primary" disabled={!dates.ok || loading} onClick={apply}>
            Áp dụng
          </Button>
        </div>
      </div>
      {!dates.ok ? (
        <p className={styles.inputError}>
          {dates.messageKey === 'MSG-REPORT-SPAN'
            ? formatMessage('MSG-REPORT-SPAN', { 'tối đa': REPORT_MAX_SPAN_DAYS })
            : formatMessage('MSG-REPORT-DATES-INVALID')}
        </p>
      ) : null}

      {/* Chỉ lỗi tải báo cáo mới là thông báo kiểu cảnh báo (BR-M03-J08) */}
      {error ? <Banner tone="error">{formatMessage('MSG-GENERIC')}</Banner> : null}

      <div className={styles.tabs} role="tablist" aria-label="Báo cáo" onKeyDown={onTabKeyDown}>
        {TABS.map((item) => (
          <button
            key={item.id}
            id={`${tabsId}-${item.id}`}
            type="button"
            role="tab"
            className={styles.tab}
            aria-selected={tab === item.id}
            aria-controls={`${tabsId}-${item.id}-panel`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section
        className={layout.section}
        role="tabpanel"
        id={`${tabsId}-${tab}-panel`}
        aria-labelledby={`${tabsId}-${tab}`}
        aria-busy={loading || undefined}
      >
        {!reports ? null : empty ? (
          <p className={layout.empty}>{formatMessage('MSG-REPORT-EMPTY')}</p>
        ) : tab === 'summary' ? (
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>Tổng số chuyến đi</dt>
              <dd className={styles.value}>{reports.rpt01.totalSessionCount}</dd>
            </div>
            <div className={styles.stat}>
              <dt>{DISPLAY_NAMES.sessionStatus.HOAN_TAT}</dt>
              <dd className={styles.value}>
                {reports.rpt01.completedCount} <span className={styles.rate}>({percent.format(reports.rpt01.completedRate)})</span>
              </dd>
            </div>
            <div className={styles.stat}>
              <dt>{DISPLAY_NAMES.sessionStatus.BO_DO}</dt>
              <dd className={styles.value}>
                {reports.rpt01.abandonedCount} <span className={styles.rate}>({percent.format(reports.rpt01.abandonedRate)})</span>
              </dd>
            </div>
          </dl>
        ) : (
          <>
            <div className={layout.tableWrap}>
              <table className={layout.table} aria-label="Lượt ghé theo điểm dừng">
                <thead>
                  <tr>
                    <th scope="col">Tuyến</th>
                    <th scope="col">Điểm dừng</th>
                    <th scope="col">Thứ tự</th>
                    <th scope="col">Số chuyến đi</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.rpt02.items.map((item) => (
                    <tr key={`${item.routeId}:${item.checkpointId}`}>
                      <td>{item.routeName}</td>
                      <td>{item.checkpointName}</td>
                      <td>{item.sequence}</td>
                      <td>{item.uniqueSessionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={layout.note}>{formatMessage('MSG-REPORT-VISIT-MEANING')}</p>
          </>
        )}
      </section>
    </div>
  );
}

export default ReportsPage;
