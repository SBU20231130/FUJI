import AnalysisFrame from '@/components/analysis/analysis-frame';
import Badge from '@/components/ui/badge';
import DataTable, { formatNumber, type Column } from '@/components/ui/data-table';
import EmptyValue from '@/components/ui/empty-value';
import Panel from '@/components/ui/panel';
import { getInventoryProjection } from '@/lib/scm';
import type { InventoryProjectionRow } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function NumberValue({ value, reasonCode, suffix = '' }: { value: number | null; reasonCode?: string | null; suffix?: string }) {
  return value === null ? <EmptyValue reasonCode={reasonCode ?? undefined} /> : formatNumber(value, suffix);
}

const columns: Column<InventoryProjectionRow>[] = [
  { key: 'period', label: '기간' },
  { key: 'itemId', label: '품목', render: (row) => <><strong>{row.itemId}</strong><br /><span className="muted">{row.itemName}</span></> },
  { key: 'supplier', label: '공급처' },
  { key: 'beginningInventory', label: '기초 재고', align: 'right', render: (row) => <NumberValue value={row.beginningInventory} reasonCode={row.reasonCode} /> },
  { key: 'scheduledReceipts', label: '예정 입고', align: 'right', render: (row) => <NumberValue value={row.scheduledReceipts} /> },
  { key: 'confirmedSalesOrder', label: '확정 수주', align: 'right', render: (row) => <NumberValue value={row.confirmedSalesOrder} /> },
  { key: 'softAllocation', label: 'Soft Allocation', align: 'right', render: (row) => <NumberValue value={row.softAllocation} /> },
  { key: 'forecastDemand', label: 'Forecast', align: 'right', render: (row) => <NumberValue value={row.forecastDemand} reasonCode={row.reasonCode} /> },
  { key: 'endingProjectedInventory', label: '기말 Projection', align: 'right', render: (row) => <NumberValue value={row.endingProjectedInventory} reasonCode={row.reasonCode} /> },
  { key: 'stockoutPeriod', label: '소진 기간', align: 'center', render: (row) => row.stockoutPeriod ?? <EmptyValue reasonCode={row.reasonCode ?? undefined} /> },
  { key: 'daysOfSupply', label: '공급 일수', align: 'right', render: (row) => <NumberValue value={row.daysOfSupply} reasonCode={row.reasonCode} suffix="일" /> },
  { key: 'monthsOfSupply', label: '공급 개월', align: 'right', render: (row) => <NumberValue value={row.monthsOfSupply} reasonCode={row.reasonCode} suffix="개월" /> },
  { key: 'status', label: 'Risk', align: 'center', render: (row) => <Badge status={row.status} /> },
  { key: 'reasonCode', label: 'Reason Code', align: 'center', render: (row) => row.reasonCode ? <span className="muted">{row.reasonCode}</span> : '—' },
];

export default async function InventoryProjectionPage() {
  const { rows, error } = await getInventoryProjection();
  if (error) {
    return <AnalysisFrame title="Inventory Projection" description="현재고와 공급·수요 흐름을 기간 순서대로 연결합니다."><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error}</p></Panel></AnalysisFrame>;
  }
  const asOf = rows.find((row) => row.projectionAsOf)?.projectionAsOf;
  return (
    <AnalysisFrame title="Inventory Projection" description={`현재고 기준일 ${asOf ?? '—'}부터 예정 입고·확정 수주·Soft Allocation·Forecast를 DB 계산 순서로 표시합니다.`}>
      <Panel title="기간별 재고 흐름" description="Forecast가 없거나 시작 재고가 없으면 값을 0으로 보정하지 않고 — + reason_code로 표시합니다.">
        <DataTable columns={columns} rows={rows} rowKey={(row, index) => `${row.itemId}-${row.period}-${index}`} empty="표시할 데이터가 없습니다. analytics.v_inventory_projection 노출 설정을 확인하세요." />
      </Panel>
    </AnalysisFrame>
  );
}
