import Link from 'next/link';
import AnalysisFrame from '@/components/analysis/analysis-frame';
import Badge from '@/components/ui/badge';
import DataTable, { formatNumber, type Column } from '@/components/ui/data-table';
import EmptyValue from '@/components/ui/empty-value';
import KpiCard from '@/components/ui/kpi-card';
import Panel from '@/components/ui/panel';
import { getInventoryProjection, getPurchaseRecommendation, getSafetyStock, getStockoutRisk } from '@/lib/scm';
import type { InventoryProjectionRow, PurchaseRecommendation, SafetyStock, StockoutRisk } from '@/lib/scm-model';

export const dynamic = 'force-dynamic';

function NumberValue({ value, reasonCode, suffix = '' }: { value: number | null; reasonCode?: string | null; suffix?: string }) {
  return value === null ? <EmptyValue reasonCode={reasonCode ?? undefined} /> : formatNumber(value, suffix);
}

function TraceTable({ trace }: { trace: Record<string, unknown> | null }) {
  if (!trace) return <EmptyValue reasonCode="CALCULATION_TRACE_UNAVAILABLE" />;
  const rows = Object.entries(trace).map(([key, value]) => ({ key, value: value === null || value === undefined || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value) }));
  return <DataTable columns={[{ key: 'key', label: '항목' }, { key: 'value', label: '값' }]} rows={rows} rowKey={(row) => row.key} />;
}

const projectionColumns: Column<InventoryProjectionRow>[] = [
  { key: 'period', label: '기간' },
  { key: 'beginningInventory', label: '기초 재고', align: 'right', render: (row) => <NumberValue value={row.beginningInventory} reasonCode={row.reasonCode} /> },
  { key: 'scheduledReceipts', label: '예정 입고', align: 'right', render: (row) => <NumberValue value={row.scheduledReceipts} /> },
  { key: 'confirmedSalesOrder', label: '확정 수주', align: 'right', render: (row) => <NumberValue value={row.confirmedSalesOrder} /> },
  { key: 'forecastDemand', label: 'Forecast', align: 'right', render: (row) => <NumberValue value={row.forecastDemand} reasonCode={row.reasonCode} /> },
  { key: 'endingProjectedInventory', label: '기말 Projection', align: 'right', render: (row) => <NumberValue value={row.endingProjectedInventory} reasonCode={row.reasonCode} /> },
  { key: 'status', label: 'Risk', align: 'center', render: (row) => <Badge status={row.status} /> },
];

function SafetyStockInputs({ row }: { row: SafetyStock }) {
  return (
    <div className="trace-grid">
      <div><span className="muted">Expected daily demand</span><strong><NumberValue value={row.expectedDailyDemand} reasonCode={row.reasonCode} /></strong></div>
      <div><span className="muted">Forecast error σD</span><strong><NumberValue value={row.forecastErrorSigma} reasonCode={row.reasonCode} /></strong></div>
      <div><span className="muted">Lead Time mean</span><strong><NumberValue value={row.leadtimeMean} reasonCode={row.reasonCode} suffix="일" /></strong></div>
      <div><span className="muted">Lead Time σL</span><strong><NumberValue value={row.leadtimeStddev} reasonCode={row.reasonCode} suffix="일" /></strong></div>
      <div><span className="muted">Effective Lead Time</span><strong><NumberValue value={row.effectiveLeadtime} reasonCode={row.reasonCode} suffix="일" /></strong></div>
      <div><span className="muted">서비스 수준 / Z</span><strong>{row.serviceLevel === null || row.zValue === null ? <EmptyValue reasonCode={row.reasonCode ?? 'NO_SERVICE_LEVEL'} /> : `${row.serviceLevel} / ${row.zValue}`}</strong></div>
    </div>
  );
}

export default async function PurchaseRecommendationDetailPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const decodedItemId = decodeURIComponent(itemId);
  const [recommendationResult, safetyStockResult, stockoutResult, projectionResult] = await Promise.all([
    getPurchaseRecommendation(decodedItemId),
    getSafetyStock(decodedItemId),
    getStockoutRisk(decodedItemId),
    getInventoryProjection(decodedItemId),
  ]);
  const error = recommendationResult.error ?? safetyStockResult.error ?? stockoutResult.error ?? projectionResult.error;
  const recommendation = recommendationResult.data;
  const safetyStock = safetyStockResult.rows[0] ?? null;
  const stockout = stockoutResult.rows[0] ?? null;

  if (error) {
    return <AnalysisFrame title={`발주 추천 · ${decodedItemId}`} description="품목별 SCM 계산 trace"><Panel><p className="text-danger">조회에 실패했습니다.</p><p className="muted">{error}</p><Link href="/analysis/purchase-recommendation" className="ui-button ui-button--ghost">목록으로</Link></Panel></AnalysisFrame>;
  }

  if (!recommendation) {
    return <AnalysisFrame title={`발주 추천 · ${decodedItemId}`} description="품목별 SCM 계산 trace"><Panel><p>품목을 찾을 수 없습니다.</p><Link href="/analysis/purchase-recommendation" className="ui-button ui-button--ghost">목록으로</Link></Panel></AnalysisFrame>;
  }

  const reasonCode = recommendation.reasonCode ?? safetyStock?.reasonCode ?? stockout?.reasonCode;
  return (
    <AnalysisFrame title={`${recommendation.itemId} · ${recommendation.itemName}`} description="Forecast → Inventory Projection → Safety Stock → Stockout → Purchase Recommendation">
      <div className="page-header-actions"><Link href="/analysis/purchase-recommendation" className="ui-button ui-button--ghost">← 추천 목록</Link></div>
      <div className="grid grid-4">
        <KpiCard label="기준 수요" value={<NumberValue value={recommendation.demandBasisQty} reasonCode={reasonCode} />} foot="Forecast / 확정 수주 중 큰 값" />
        <KpiCard label="Safety Stock" value={<NumberValue value={recommendation.safetyStock} reasonCode={reasonCode} />} foot="Z × σDLT" />
        <KpiCard label="필요 수량" value={<NumberValue value={recommendation.requiredQty} reasonCode={reasonCode} />} foot="DB 계산 결과" />
        <KpiCard label="추천 발주량" value={recommendation.recommendedQty === null ? <EmptyValue reasonCode={reasonCode ?? undefined} /> : recommendation.recommendedQty} foot={recommendation.immediateOrder ? <Badge status="CRITICAL" label="즉시 발주" /> : recommendation.orderTimingStatus ?? '—'} status={recommendation.calculationStatus === 'CALCULATION_UNAVAILABLE' ? 'CALCULATION_UNAVAILABLE' : recommendation.immediateOrder ? 'CRITICAL' : 'SAFE'} />
      </div>

      <div className="section grid grid-2">
        <Panel title="1. Forecast / 확정 수주" description="예측 수요와 확정 수주는 별도 입력으로 보존하고 기준 수요는 DB에서 결정합니다.">
          <div className="trace-grid">
            <div><span className="muted">Forecast</span><strong><NumberValue value={recommendation.forecastQty} reasonCode={reasonCode} /></strong></div>
            <div><span className="muted">확정 수주</span><strong><NumberValue value={recommendation.confirmedOrderQty} reasonCode={reasonCode} /></strong></div>
            <div><span className="muted">기준 수요</span><strong><NumberValue value={recommendation.demandBasisQty} reasonCode={reasonCode} /></strong></div>
            <div><span className="muted">Forecast run / model</span><strong>{recommendation.forecastRunId ?? <EmptyValue reasonCode="NO_FORECAST" />} · {recommendation.modelVersion ?? '—'}</strong></div>
          </div>
        </Panel>
        <Panel title="2. Stockout" description="STEP 9의 기간별 Projection과 동일한 재고·리드타임 결과를 연결합니다.">
          {stockout ? <div className="trace-grid">
            <div><span className="muted">상태</span><strong><Badge status={stockout.status} /></strong></div>
            <div><span className="muted">소진 예정일</span><strong>{stockout.stockoutDate ?? <EmptyValue reasonCode={stockout.reasonCode ?? undefined} />}</strong></div>
            <div><span className="muted">공급 가능 일수</span><strong><NumberValue value={stockout.daysOfSupply} reasonCode={stockout.reasonCode} suffix="일" /></strong></div>
            <div><span className="muted">Effective LT</span><strong><NumberValue value={stockout.effectiveLeadTime} reasonCode={stockout.reasonCode} suffix="일" /></strong></div>
          </div> : <EmptyValue reasonCode="NO_STOCKOUT_DATA" />}
        </Panel>
      </div>

      <Panel className="section" title="3. Inventory Projection" description="기간별 기초 재고·입고·확정 수주·Forecast·기말 재고를 재조회합니다.">
        <DataTable columns={projectionColumns} rows={projectionResult.rows} rowKey={(row, index) => `${row.period}-${index}`} empty="Projection 데이터가 없습니다." />
      </Panel>

      <Panel className="section" title="4. Safety Stock" description="σDLT = √(L × σD² + d² × σL²), Safety Stock = Z × σDLT. 모든 입력 출처와 계산 불가 사유는 DB view 결과입니다.">
        {safetyStock ? <>
          <div className="trace-grid">
            <div><span className="muted">계산 상태</span><strong>{safetyStock.calculationStatus === 'READY' ? <Badge status="SAFE" label="READY" /> : <Badge status="CALCULATION_UNAVAILABLE" />}</strong></div>
            <div><span className="muted">σDLT</span><strong><NumberValue value={safetyStock.sigmaDlt} reasonCode={safetyStock.reasonCode} /></strong></div>
            <div><span className="muted">Safety Stock</span><strong><NumberValue value={safetyStock.safetyStock} reasonCode={safetyStock.reasonCode} /></strong></div>
            <div><span className="muted">사유 코드</span><strong>{safetyStock.reasonCode ?? '—'}</strong></div>
          </div>
          <SafetyStockInputs row={safetyStock} />
        </> : <EmptyValue reasonCode="NO_SAFETY_STOCK_DATA" />}
      </Panel>

      <Panel className="section" title="5. Purchase Recommendation" description="필요 수량이 0 이하이면 미발주, MOQ 미만이면 MOQ, 이후 Pack Size 단위로 올림합니다.">
        <div className="trace-grid">
          <div><span className="muted">가용 재고 / 예정 입고</span><strong><NumberValue value={recommendation.availableInventory} reasonCode={reasonCode} /> / <NumberValue value={recommendation.scheduledReceipt} reasonCode={reasonCode} /></strong></div>
          <div><span className="muted">MOQ / Pack Size</span><strong><NumberValue value={recommendation.moq} reasonCode="NO_ITEM_POLICY" /> / <NumberValue value={recommendation.packSize} reasonCode="NO_ITEM_POLICY" /></strong></div>
          <div><span className="muted">추천 발주일</span><strong>{recommendation.immediateOrder ? <Badge status="CRITICAL" label="즉시 발주" /> : recommendation.recommendedOrderDate ?? <EmptyValue reasonCode={reasonCode ?? undefined} />}</strong></div>
          <div><span className="muted">계산 상태 / 사유</span><strong>{recommendation.calculationStatus} · {recommendation.reasonCode ?? '—'}</strong></div>
        </div>
      </Panel>

      <Panel className="section" title="Calculation Trace" description="같은 view를 다시 조회해 확인할 수 있는 계산 입력·결과 추적값입니다.">
        <TraceTable trace={recommendation.calculationTrace} />
      </Panel>
    </AnalysisFrame>
  );
}
