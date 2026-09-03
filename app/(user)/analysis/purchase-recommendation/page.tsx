import Link from 'next/link';
import AnalysisFrame from '@/components/analysis/analysis-frame';
import Badge from '@/components/ui/badge';
import DataTable, { formatNumber, type Column } from '@/components/ui/data-table';
import EmptyValue from '@/components/ui/empty-value';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import { getPurchaseRecommendations } from '@/lib/scm';
import type { PurchaseRecommendation } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function NumberValue({ value, reasonCode, suffix = '' }: { value: number | null; reasonCode?: string | null; suffix?: string }) {
  return value === null ? <EmptyValue reasonCode={reasonCode ?? undefined} /> : formatNumber(value, suffix);
}

function DateValue({ value, reasonCode }: { value: string | null; reasonCode?: string | null }) {
  return value ? value : <EmptyValue reasonCode={reasonCode ?? undefined} />;
}

const columns: Column<PurchaseRecommendation>[] = [
  {
    key: 'itemId',
    label: '품목',
    render: (row) => <Link className="recommendation-link" href={`/analysis/purchase-recommendation/${encodeURIComponent(row.itemId)}`}><strong>{row.itemId}</strong><br /><span className="muted">{row.itemName}</span></Link>,
  },
  { key: 'itemGrade', label: '등급', align: 'center', render: (row) => row.itemGrade ?? <EmptyValue reasonCode="NO_ITEM_POLICY" /> },
  { key: 'riskStatus', label: 'Risk', align: 'center', render: (row) => <Badge status={row.riskStatus} /> },
  { key: 'forecastQty', label: 'Forecast', align: 'right', render: (row) => <NumberValue value={row.forecastQty} reasonCode={row.reasonCode} /> },
  { key: 'confirmedOrderQty', label: '확정 수주', align: 'right', render: (row) => <NumberValue value={row.confirmedOrderQty} reasonCode={row.reasonCode} /> },
  { key: 'demandBasisQty', label: '기준 수요', align: 'right', render: (row) => <NumberValue value={row.demandBasisQty} reasonCode={row.reasonCode} /> },
  { key: 'availableInventory', label: '가용 재고', align: 'right', render: (row) => <NumberValue value={row.availableInventory} reasonCode={row.reasonCode} /> },
  { key: 'scheduledReceipt', label: '예정 입고', align: 'right', render: (row) => <NumberValue value={row.scheduledReceipt} reasonCode={row.reasonCode} /> },
  { key: 'safetyStock', label: 'Safety Stock', align: 'right', render: (row) => <NumberValue value={row.safetyStock} reasonCode={row.reasonCode} /> },
  { key: 'stockoutDate', label: '소진 예정일', align: 'center', render: (row) => <DateValue value={row.stockoutDate} reasonCode={row.reasonCode} /> },
  { key: 'requiredQty', label: '필요 수량', align: 'right', render: (row) => <NumberValue value={row.requiredQty} reasonCode={row.reasonCode} /> },
  { key: 'moq', label: 'MOQ', align: 'right', render: (row) => <NumberValue value={row.moq} reasonCode="NO_ITEM_POLICY" /> },
  { key: 'packSize', label: 'Pack', align: 'right', render: (row) => <NumberValue value={row.packSize} reasonCode="NO_ITEM_POLICY" /> },
  { key: 'recommendedQty', label: '추천 발주량', align: 'right', render: (row) => row.recommendedQty === null ? <EmptyValue reasonCode={row.reasonCode ?? undefined} /> : <strong>{formatNumber(row.recommendedQty)}</strong> },
  { key: 'recommendedOrderDate', label: '추천 발주일', align: 'center', render: (row) => row.immediateOrder ? <Badge status="CRITICAL" label="즉시 발주" /> : <DateValue value={row.recommendedOrderDate} reasonCode={row.reasonCode} /> },
  { key: 'calculationStatus', label: '계산 상태', align: 'center', render: (row) => row.calculationStatus === 'READY' || row.calculationStatus === 'NO_ORDER_NEEDED' ? <Badge status="SAFE" label={row.calculationStatus} /> : <Badge status="CALCULATION_UNAVAILABLE" /> },
];

export default async function PurchaseRecommendationPage() {
  const { rows, error } = await getPurchaseRecommendations();
  if (error) {
    return <AnalysisFrame title="발주 추천" description="Forecast, 재고, 확정 수주, Safety Stock을 연결해 발주 필요량을 제안합니다."><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error}</p></Panel></AnalysisFrame>;
  }

  const readyRows = rows.filter((row) => row.calculationStatus === 'READY');
  const immediateRows = rows.filter((row) => row.immediateOrder);
  const unavailableRows = rows.filter((row) => row.calculationStatus === 'CALCULATION_UNAVAILABLE');

  return (
    <AnalysisFrame title="발주 추천" description="Forecast와 확정 수주 중 큰 값을 기준으로 Safety Stock·가용재고·예정 입고를 반영합니다. 계산 불가는 숫자로 추정하지 않습니다.">
      <div className="grid grid-4">
        <KpiCard label="전체 품목" value={rows.length} foot="analytics.v_purchase_recommendation" status="SAFE" />
        <KpiCard label="추천 가능" value={readyRows.length} foot="DB 계산이 완료된 품목" status="SAFE" />
        <KpiCard label="즉시 발주" value={immediateRows.length} foot="추천일이 오늘보다 이전" status="CRITICAL" />
        <KpiCard label="계산 불가" value={unavailableRows.length} foot="reason_code 확인 필요" status="CALCULATION_UNAVAILABLE" />
      </div>
      <Panel className="section" title="품목별 발주 추천" description="수량과 추천일은 analytics.v_purchase_recommendation의 DB 계산 결과입니다. 품목을 선택하면 Forecast → Projection → Safety Stock → Stockout → Recommendation 흐름을 확인할 수 있습니다.">
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.itemId} empty="표시할 데이터가 없습니다. analytics.v_purchase_recommendation 노출 설정을 확인하세요." />
      </Panel>
    </AnalysisFrame>
  );
}
