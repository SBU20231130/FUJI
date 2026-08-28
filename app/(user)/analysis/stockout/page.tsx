import AnalysisFrame from '@/components/analysis/analysis-frame';
import AlertRow from '@/components/ui/alert-row';
import Badge from '@/components/ui/badge';
import DataTable, { formatNumber, type Column } from '@/components/ui/data-table';
import EmptyValue from '@/components/ui/empty-value';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import { getStockoutKpi, getStockoutRisk } from '@/lib/scm';
import type { StockoutRisk } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function StockoutDays({ row }: { row: StockoutRisk }) {
  return row.stockoutDays === null ? <EmptyValue reasonCode={row.reasonCode} /> : formatNumber(row.stockoutDays, '일');
}

const columns: Column<StockoutRisk>[] = [
  { key: 'itemId', label: '품목코드', render: (row) => <span className="data-value">{row.itemId}</span> },
  { key: 'itemName', label: '품목명' },
  { key: 'supplier', label: '공급처' },
  { key: 'availableQty', label: '가용재고', align: 'right', render: (row) => row.availableQty === null ? <EmptyValue /> : formatNumber(row.availableQty) },
  { key: 'dailyUsageAvg', label: '일평균사용량', align: 'right', render: (row) => row.dailyUsageAvg === null ? <EmptyValue reasonCode={row.reasonCode} /> : formatNumber(row.dailyUsageAvg) },
  { key: 'stockoutDays', label: '소진예상', align: 'right', render: (row) => <StockoutDays row={row} /> },
  { key: 'status', label: '상태', align: 'center', render: (row) => <Badge status={row.status} /> },
];

export default async function StockoutPage() {
  const [{ rows, error }, { data: kpi, error: kpiError }] = await Promise.all([getStockoutRisk(), getStockoutKpi()]);
  if (error || kpiError) {
    return <AnalysisFrame title="재고 소진 위험" description="가용재고와 일평균 사용량을 기준으로 소진 위험을 확인합니다."><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error ?? kpiError}</p></Panel></AnalysisFrame>;
  }

  return (
    <AnalysisFrame title="재고 소진 위험" description="가용재고 ÷ 일평균 사용량으로 계산 가능한 품목만 일수를 표시하고, 계산 불가는 사유코드와 함께 표시합니다.">
      <div className="grid grid-4">
        <KpiCard label="전체 품목" value={kpi?.items ?? <EmptyValue />} foot="analytics.v_stockout_kpi" />
        <KpiCard label="CRITICAL" value={kpi?.critical ?? <EmptyValue />} foot="리드타임 내 소진 위험" status="CRITICAL" />
        <KpiCard label="SAFE" value={kpi?.safe ?? <EmptyValue />} foot="현재 기준 안전" status="SAFE" />
        <KpiCard label="계산 불가" value={kpi?.unavailable ?? <EmptyValue />} foot="reason_code 확인 필요" status="CALCULATION_UNAVAILABLE" />
      </div>
      <div className="section grid grid-2">
        <Panel title="위험 상태 요약" description="화면 상태는 공통 Badge를 사용합니다.">
          <div className="grid">
            <AlertRow status="CRITICAL" title="재고 소진 위험" description="가용재고가 계획 리드타임을 버티지 못하는 품목" meta={kpi?.critical ?? '—'} />
            <AlertRow status="SAFE" title="안전 품목" description="현재 사용량 기준으로 소진 위험이 낮은 품목" meta={kpi?.safe ?? '—'} />
            <AlertRow status="CALCULATION_UNAVAILABLE" title="계산 불가" description="사용 이력 또는 계획 리드타임이 없어 판단할 수 없는 품목" meta={kpi?.unavailable ?? '—'} />
          </div>
        </Panel>
        <Panel title="계산 불가 표시 원칙" description="숫자로 추정하지 않습니다.">
          <div className="insight-banner"><div><strong>— + reason_code</strong><span>NO_USAGE, NO_LEADTIME 등의 원인을 그대로 보여줍니다.</span></div></div>
        </Panel>
      </div>
      <Panel className="section" title="품목별 재고 소진 위험" description="analytics.v_stockout_risk 조회 결과">
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.itemId} empty="표시할 데이터가 없습니다. analytics.v_stockout_risk 노출 설정을 확인하세요." />
      </Panel>
    </AnalysisFrame>
  );
}
