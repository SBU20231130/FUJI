import Badge, { type Status } from '@/components/ui/badge';
import Panel from '@/components/ui/panel';
import PageHeader from '@/components/shell/page-header';
import ImportWizard from '@/components/admin/import-wizard';
import RollbackForm from '@/components/admin/rollback-form';
import { requireAdmin } from '@/lib/auth';
import { getImportHistory, type HistoryRow } from '@/lib/import/repository';
import type { ImportType } from '@/lib/import/types';

export const dynamic = 'force-dynamic';

const typeLabels: Record<ImportType, string> = {
  usage_history: '사용 이력', inventory: '재고', item_master: '품목 마스터', supplier_master: '공급업체 마스터', purchase_order: '발주', goods_receipt: '입고', sales_order: '판매 주문', business_event: '업무 이벤트', item_substitute: '대체 품목',
};

function statusBadge(status: string) {
  const mapping: Record<string, { status: Status; label: string }> = {
    IMPORTED: { status: 'SAFE', label: '적재 완료' },
    FAILED: { status: 'CRITICAL', label: '실패' },
    ROLLED_BACK: { status: 'CALCULATION_UNAVAILABLE', label: '롤백' },
    VALIDATED_WITH_ERRORS: { status: 'WARNING', label: '검증 오류' },
    VALIDATED: { status: 'SAFE', label: '검증 완료' },
  };
  const item = mapping[status] ?? { status: 'WARNING' as Status, label: status };
  return <Badge status={item.status} label={item.label} />;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

async function HistoryPanel() {
  let history: HistoryRow[] = [];
  let error: string | null = null;
  try {
    history = await getImportHistory();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : '적재 이력을 불러오지 못했습니다.';
  }
  return <Panel className="section" title="적재 이력" description="최근 50개 배치 · 검증 오류 CSV와 롤백은 서버 권한으로 처리됩니다.">
    {error ? <p className="text-danger">적재 이력을 불러오지 못했습니다: {error}</p> : history.length === 0 ? <p className="empty-state">아직 적재 이력이 없습니다.</p> : <div className="data-table-wrap"><table className="data-table import-history-table"><thead><tr><th>파일</th><th>유형</th><th>모드</th><th>건수</th><th>상태</th><th>업로드 사용자</th><th>시각</th><th>작업</th></tr></thead><tbody>{history.map((batch) => <tr key={batch.batch_id}><td><strong>{batch.file_name}</strong><span className="table-subtext">{batch.batch_id.slice(0, 8)}</span></td><td>{typeLabels[batch.import_type]}</td><td>{batch.import_mode}</td><td>{batch.success_rows + batch.warning_rows}/{batch.total_rows}<span className="table-subtext">오류 {batch.error_rows}</span></td><td>{statusBadge(batch.status)}</td><td>{batch.uploadedByLabel}</td><td>{formatDate(batch.uploaded_at)}</td><td><div className="history-actions">{batch.error_rows + batch.warning_rows > 0 ? <a className="button ghost" href={`/api/admin/import-errors?batch_id=${batch.batch_id}`}>오류 CSV</a> : null}{batch.status === 'IMPORTED' ? <RollbackForm batchId={batch.batch_id} /> : null}</div></td></tr>)}</tbody></table></div>}
  </Panel>;
}

export default async function DataManagementPage() {
  await requireAdmin('/admin/data-management');
  return <section><PageHeader eyebrow="ADMIN / DATA" title="데이터 적재" description="CSV/Excel을 staging에서 미리보기·매핑·검증한 뒤, 정상 행만 RAW에 반영합니다." actions={<span className="local-badge">ADMIN ONLY</span>} /><ImportWizard /><HistoryPanel /></section>;
}
