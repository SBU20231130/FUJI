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

const columns: Column<StockoutRisk>[] = [
  { key: 'itemId', label: '품목코드', render: (row) => <span className="data-value">{row.itemId}</span> },
  { key: 'itemName', label: '품목명' },
  { key: 'supplier', label: '공급처' },
  { key: 'currentStock', label: '현재고', align: 'right', render: (row) => row.currentStock === null ? <EmptyValue reasonCode="NO_INVENTORY_DATA" /> : formatNumber(row.currentStock) },
  { key: 'dailyUsageAvg', label: '예측 일평균', align: 'right', render: (row) => row.dailyUsageAvg === null ? <EmptyValue reasonCode={row.reasonCode ?? undefined} /> : formatNumber(row.dailyUsageAvg) },
  { key: 'daysOfSupply', label: '공급 가능 일수', align: 'right', render: (row) => row.daysOfSupply === null ? <EmptyValue reasonCode={row.reasonCode ?? undefined} /> : formatNumber(row.daysOfSupply, '일') },
  { key: 'stockoutDate', label: '소진 기간', align: 'center', render: (row) => row.stockoutDate ?? <EmptyValue reasonCode={row.reasonCode ?? undefined} /> },
  { key: 'status', label: '상태', align: 'center', render: (row) => <Badge status={row.status} /> },
];

export default async function StockoutPage() {
  const [{ rows, error }, { data: kpi, error: kpiError }] = await Promise.all([getStockoutRisk(), getStockoutKpi()]);
  if (error || kpiError) {
    return <AnalysisFrame title="재고 소진 위험" description="예측 수요와 기간별 재고 Projection을 기준으로 소진 위험을 확인합니다."><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error ?? kpiError}</p></Panel></AnalysisFrame>;
  }

  return (
    <AnalysisFrame title="재고 소진 위험" description="현재고에서 예정 입고·확정 수주·Soft Allocation·예측 수요를 기간 순서대로 반영합니다. 계산 불가는 사유코드와 함께 표시합니다.">
      <div className="grid grid-4">
        <KpiCard label="전체 품목" value={kpi?.items ?? <EmptyValue />} foot="analytics.v_stockout_kpi" />
        <KpiCard label="CRITICAL" value={kpi?.critical ?? <EmptyValue />} foot="리드타임 내 소진 위험" status="CRITICAL" />
        <KpiCard label="WARNING" value={kpi?.warning ?? <EmptyValue />} foot="지금 발주 검토가 필요한 품목" status="WARNING" />
        <KpiCard label="SAFE" value={kpi?.safe ?? <EmptyValue />} foot="현재 기준 안전" status="SAFE" />
        <KpiCard label="계산 불가" value={kpi?.unavailable ?? <EmptyValue />} foot="reason_code 확인 필요" status="CALCULATION_UNAVAILABLE" />
      </div>
      <div className="section grid grid-2">
        <Panel title="위험 상태 요약" description="화면 상태는 공통 Badge를 사용합니다.">
          <div className="grid">
            <AlertRow status="CRITICAL" title="재고 소진 위험" description="가용재고가 계획 리드타임을 버티지 못하는 품목" meta={kpi?.critical ?? '—'} />
            <AlertRow status="WARNING" title="발주 검토" description="예상 소진 시점이 유효 리드타임 안쪽에 있는 품목" meta={kpi?.warning ?? '—'} />
            <AlertRow status="SAFE" title="안전 품목" description="예측 Projection 기간 안에 재고가 양수로 유지되는 품목" meta={kpi?.safe ?? '—'} />
            <AlertRow status="CALCULATION_UNAVAILABLE" title="계산 불가" description="재고·리드타임·Forecast 입력이 없어 판단할 수 없는 품목" meta={kpi?.unavailable ?? '—'} />
          </div>
        </Panel>
        <Panel title="계산 불가 표시 원칙" description="숫자로 추정하지 않습니다.">
          <div className="insight-banner"><div><strong>— + reason_code</strong><span>NO_INVENTORY_DATA, NO_LEADTIME, NO_FORECAST 등의 원인을 그대로 보여줍니다.</span></div></div>
        </Panel>
      </div>
      <Panel className="section" title="품목별 재고 소진 위험" description="analytics.v_stockout_risk · 기간별 상세는 Inventory Projection에서 확인합니다.">
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.itemId} empty="표시할 데이터가 없습니다. analytics.v_stockout_risk 노출 설정을 확인하세요." />
      </Panel>
    </AnalysisFrame>
  );
}
