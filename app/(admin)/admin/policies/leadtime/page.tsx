import PageHeader from '@/components/shell/page-header';
import Badge from '@/components/ui/badge';
import EmptyValue from '@/components/ui/empty-value';
import Panel from '@/components/ui/panel';
import LeadtimePolicyForm from '@/components/admin/leadtime-policy-form';
import { requireAdmin } from '@/lib/auth';
import { getLeadtimePolicy, getLeadtimePolicyHistory } from '@/lib/scm';
import type { LeadtimePolicy } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function Value({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  return value === null ? <EmptyValue reasonCode="NO_DATA" /> : `${value.toLocaleString()}${suffix}`;
}

function sourceLabel(source: string | null) {
  if (source === 'ADMIN_CONFIRMED') return 'ADMIN 확정';
  if (source === 'ACTUAL_P80') return '실적 P80';
  return '계산 불가';
}

function SupplierPolicy({ rows }: { rows: LeadtimePolicy[] }) {
  const policies = Array.from(new Map(rows.map((row) => [row.supplierId, row])).values());
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr><th>공급처</th><th>적용 품목</th><th>실적 평균</th><th>P50</th><th>P80</th><th>P90</th><th>Effective LT</th><th>적용값</th><th>적용일</th><th>관리자 변경</th></tr></thead>
        <tbody>
          {policies.map((policy) => {
            const itemNames = rows.filter((row) => row.supplierId === policy.supplierId).map((row) => row.itemId).join(', ');
            return (
              <tr key={policy.supplierId}>
                <td><strong>{policy.supplierName}</strong><br /><span className="muted">{policy.supplierId} · {policy.country ?? '국가 미상'}</span></td>
                <td>{itemNames || <EmptyValue reasonCode="NO_ITEM" />}</td>
                <td><Value value={policy.meanDays} suffix="일" /></td>
                <td><Value value={policy.p50} suffix="일" /></td>
                <td><Value value={policy.p80} suffix="일" /></td>
                <td><Value value={policy.p90} suffix="일" /></td>
                <td><Value value={policy.effectiveLeadTime} suffix="일" /></td>
                <td><Badge status={policy.effectiveLeadTime === null ? 'CALCULATION_UNAVAILABLE' : 'SAFE'} label={sourceLabel(policy.source)} /></td>
                <td>{policy.confirmedAt ? new Date(policy.confirmedAt).toLocaleDateString('ko-KR') : <EmptyValue reasonCode="NOT_CONFIGURED" />}</td>
                <td><LeadtimePolicyForm supplierId={policy.supplierId} plannedLeadTime={policy.adminLeadTime} basis={policy.basis} confirmedReason={policy.confirmedReason} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTable({ rows }: { rows: Awaited<ReturnType<typeof getLeadtimePolicyHistory>>['rows'] }) {
  if (rows.length === 0) return <p className="data-table__empty">아직 정책 변경 이력이 없습니다.</p>;
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr><th>시각</th><th>공급처</th><th>변경 전</th><th>변경 후</th><th>사유</th><th>변경자</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.historyId}>
          <td>{row.changedAt ? new Date(row.changedAt).toLocaleString('ko-KR') : <EmptyValue reasonCode="NO_DATE" />}</td>
          <td>{row.supplierName}<br /><span className="muted">{row.supplierId}</span></td>
          <td><Value value={row.beforeLeadTime} suffix="일" /></td>
          <td><Value value={row.afterLeadTime} suffix="일" /></td>
          <td>{row.afterReason ?? row.beforeReason ?? <EmptyValue reasonCode="NO_REASON" />}</td>
          <td>{row.changedBy ?? '시스템'}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export default async function LeadtimePolicyPage() {
  await requireAdmin('/admin/policies/leadtime');
  const [{ rows, error }, history] = await Promise.all([getLeadtimePolicy(), getLeadtimePolicyHistory()]);

  if (error || history.error) {
    return <section><PageHeader eyebrow="ADMIN / SCM POLICIES" title="Lead Time 정책" description="관리자 확정값과 실적 P80의 적용 우선순위를 관리합니다." /><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error ?? history.error}</p></Panel></section>;
  }

  return (
    <section>
      <PageHeader eyebrow="ADMIN / SCM POLICIES" title="Lead Time 정책" description="관리자 확정값이 있으면 우선 적용하고, 없으면 실적 P80을 사용합니다. 변경은 audit_log와 이력 테이블에 남습니다." />
      <Panel className="section" title="공급처별 Effective Lead Time" description="리드타임 계산과 정책값은 DB view에서 결정됩니다. 화면은 조회와 정책 변경 요청만 담당합니다.">
        <SupplierPolicy rows={rows} />
      </Panel>
      <Panel className="section" title="정책 변경 이력" description="관리자 리드타임 변경의 before / after 기록입니다.">
        <HistoryTable rows={history.rows} />
      </Panel>
    </section>
  );
}
