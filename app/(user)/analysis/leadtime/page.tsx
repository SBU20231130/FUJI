import AnalysisFrame from '@/components/analysis/analysis-frame';
import Badge from '@/components/ui/badge';
import DataTable, { formatNumber, type Column } from '@/components/ui/data-table';
import EmptyValue from '@/components/ui/empty-value';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import { getLeadtimeGap } from '@/lib/scm';
import { summarizeLeadtimeGap, type LeadtimeGap } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function GapCell({ row }: { row: LeadtimeGap }) {
  if (row.gap === null) return <EmptyValue reasonCode={row.status} />;
  const sign = row.gap > 0 ? '+' : '';
  return <Badge status={row.status} label={`${sign}${formatNumber(row.gap, '일')}`} />;
}

const columns: Column<LeadtimeGap>[] = [
  { key: 'supplier', label: '공급처' },
  { key: 'country', label: '국가' },
  { key: 'masterLeadTime', label: '마스터', align: 'right', render: (row) => row.masterLeadTime === null ? <EmptyValue /> : formatNumber(row.masterLeadTime, '일') },
  { key: 'sampleCount', label: '표본수', align: 'right', render: (row) => row.sampleCount === null ? <EmptyValue /> : row.sampleCount.toLocaleString() },
  { key: 'actualAverage', label: '실적평균', align: 'right', render: (row) => row.actualAverage === null ? <EmptyValue /> : formatNumber(row.actualAverage, '일') },
  { key: 'p80', label: 'P80', align: 'right', render: (row) => row.p80 === null ? <EmptyValue /> : formatNumber(row.p80, '일') },
  { key: 'gap', label: '격차', align: 'right', render: (row) => <GapCell row={row} /> },
];

export default async function LeadtimePage() {
  const { rows, error } = await getLeadtimeGap();
  if (error) {
    return <AnalysisFrame title="리드타임 격차" description="공급처별 표준 리드타임과 실제 실적 P80을 비교합니다."><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error}</p></Panel></AnalysisFrame>;
  }

  const summary = summarizeLeadtimeGap(rows);
  return (
    <AnalysisFrame title="리드타임 격차" description="공급처별 표준 리드타임과 실제 실적 P80을 비교해 계획이 현실보다 짧은 공급처를 찾습니다.">
      <div className="grid grid-3">
        <KpiCard label="공급처" value={summary.suppliers} foot="사용 중인 생산법인" status="SAFE" />
        <KpiCard label="실제가 더 김" value={summary.longer} foot="격차가 양수인 공급처" status={summary.longerStatus} />
        <KpiCard label="표본 부족" value={summary.lowSample} foot="표본 10건 미만" status={summary.lowSampleStatus} />
      </div>
      <Panel className="section" title="공급처별 리드타임" description="격차 = P80 − 마스터">
        <DataTable columns={columns} rows={rows} rowKey={(row, index) => `${row.supplier}-${index}`} empty="표시할 데이터가 없습니다. analytics.v_leadtime_gap 노출 설정을 확인하세요." />
      </Panel>
    </AnalysisFrame>
  );
}
