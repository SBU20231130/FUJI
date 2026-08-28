import PageHeader from '@/components/shell/page-header';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import { requireAdmin } from '@/lib/auth';
import { getForecastSettings } from '@/lib/scm';
import type { ForecastSettings } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function DateValue({ value }: { value: string | null }) {
  return value ? value : <EmptyValue reasonCode="NOT_CONFIGURED" />;
}

function NumberValue({ value }: { value: number | null }) {
  return value === null ? <EmptyValue reasonCode="NOT_CONFIGURED" /> : value.toLocaleString();
}

function CheckBadge({ value }: { value: boolean | null }) {
  if (value === null) return <Badge status="CALCULATION_UNAVAILABLE" label="미설정" />;
  return <Badge status={value ? 'SAFE' : 'CRITICAL'} label={value ? '정상' : '점검 필요'} />;
}

function SettingsTable({ settings }: { settings: ForecastSettings }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <tbody>
          <tr><th>전체 데이터 기간</th><td><DateValue value={settings.dataStart} /> ~ <DateValue value={settings.dataEnd} /></td></tr>
          <tr><th>학습 기간</th><td><DateValue value={settings.trainStart} /> ~ <DateValue value={settings.trainEnd} /></td></tr>
          <tr><th>검증 기간</th><td><DateValue value={settings.testStart} /> ~ <DateValue value={settings.testEnd} /></td></tr>
          <tr><th>Granularity</th><td>{settings.granularity ?? <EmptyValue reasonCode="NOT_CONFIGURED" />}</td></tr>
          <tr><th>Champion metric</th><td>{settings.championMetric ?? <EmptyValue reasonCode="NOT_CONFIGURED" />}</td></tr>
          <tr><th>Baseline model</th><td>{settings.baselineModelId && settings.baselineModelVersion ? `${settings.baselineModelId} · v${settings.baselineModelVersion}` : <EmptyValue reasonCode="BASELINE_NOT_CONFIGURED" />}</td></tr>
          <tr><th>학습 행 수</th><td><NumberValue value={settings.trainRowCount} /></td></tr>
          <tr><th>검증 Actual 행 수</th><td><NumberValue value={settings.testRowCount} /></td></tr>
          <tr><th>기간 겹침 행 수</th><td><NumberValue value={settings.overlapRowCount} /></td></tr>
        </tbody>
      </table>
    </div>
  );
}

export default async function ForecastSettingsPage() {
  await requireAdmin('/admin/forecast-settings');
  const { data, error } = await getForecastSettings();

  if (error) {
    return <section><PageHeader eyebrow="ADMIN / FORECAST" title="Forecast 설정 검증" description="학습·검증 기간과 운영 정책이 모델 입력과 분리되어 있는지 확인합니다." /><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error}</p></Panel></section>;
  }
  if (!data) {
    return <section><PageHeader eyebrow="ADMIN / FORECAST" title="Forecast 설정 검증" description="학습·검증 기간과 운영 정책이 모델 입력과 분리되어 있는지 확인합니다." /><Panel><p className="muted">표시할 설정이 없습니다.</p></Panel></section>;
  }

  const isolationReady = data.trainWindowOk === true && data.testWindowOk === true && data.isolationOk === true;
  return (
    <section>
      <PageHeader eyebrow="ADMIN / FORECAST" title="Forecast 설정 검증" description="DB 설정에 따라 학습 데이터와 검증 Actual을 분리하고, 데이터 커버리지와 정책 적용 상태를 확인합니다." />
      <div className="grid grid-4">
        <KpiCard label="데이터 격리" value={<CheckBadge value={isolationReady} />} foot="train / test 기간 겹침 없음" status={isolationReady ? 'SAFE' : 'CRITICAL'} />
        <KpiCard label="학습 행 수" value={<NumberValue value={data.trainRowCount} />} foot="core.v_train_demand" />
        <KpiCard label="검증 행 수" value={<NumberValue value={data.testRowCount} />} foot="core.v_test_actual" />
        <KpiCard label="Granularity" value={data.granularity ?? <EmptyValue reasonCode="NOT_CONFIGURED" />} foot="core.forecast_setting" />
      </div>
      <Panel className="section" title="기간 및 커버리지" description="analytics.v_data_coverage에서 계산된 값입니다.">
        <SettingsTable settings={data} />
        <div className="button-row" style={{ marginTop: 'var(--space-4)' }}>
          <span><CheckBadge value={data.trainWindowOk} /> 학습 기간</span>
          <span><CheckBadge value={data.testWindowOk} /> 검증 기간</span>
          <span><CheckBadge value={data.isolationOk} /> 데이터 격리</span>
        </div>
      </Panel>
      <div className="section grid grid-2">
        <Panel title="기본 정책값" description="정책값은 core.policy_config에서 관리하며, 미설정은 숫자로 보정하지 않습니다.">
          <div className="data-table-wrap">
            <table className="data-table"><tbody>
              <tr><th>Service level</th><td><NumberValue value={data.defaultServiceLevel} /></td></tr>
              <tr><th>Review period (일)</th><td><NumberValue value={data.defaultReviewPeriodDays} /></td></tr>
              <tr><th>Safety buffer (일)</th><td><NumberValue value={data.defaultSafetyBufferDays} /></td></tr>
              <tr><th>품목 정책 수</th><td><NumberValue value={data.activeItemPolicyCount} /></td></tr>
            </tbody></table>
          </div>
        </Panel>
        <Panel title="학습 제외 규칙" description="core.outlier_rule에서 활성화된 학습 제외 조건을 확인합니다.">
          <div className="data-table-wrap">
            <table className="data-table"><tbody>
              <tr><th>활성 규칙 수</th><td><NumberValue value={data.enabledOutlierRuleCount} /></td></tr>
              <tr><th>학습 제외 규칙 수</th><td><NumberValue value={data.learningExcludedRuleCount} /></td></tr>
              <tr><th>적용 범위</th><td>{data.learningExcludedRuleCount === null ? <EmptyValue reasonCode="NOT_CONFIGURED" /> : 'Forecast / Demand Profile 학습 데이터'}</td></tr>
            </tbody></table>
          </div>
        </Panel>
      </div>
    </section>
  );
}
