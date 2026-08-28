'use client';

import { useMemo, useState } from 'react';
import Badge from '@/components/ui/badge';
import DataTable, { formatNumber, type Column } from '@/components/ui/data-table';
import EmptyValue from '@/components/ui/empty-value';
import type { DemandProfile, DemandType } from '@/lib/scm-model';

type DemandTypeFilter = 'ALL' | DemandType;
type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';

function demandTypeStatus(type: DemandType) {
  if (type === 'SMOOTH') return 'SAFE' as const;
  if (type === 'INTERMITTENT' || type === 'LUMPY') return 'WARNING' as const;
  return 'CRITICAL' as const;
}

function numberCell(value: number | null, suffix = '') {
  return value === null ? <EmptyValue /> : formatNumber(value, suffix);
}

function percentCell(value: number | null) {
  return value === null ? <EmptyValue /> : new Intl.NumberFormat('ko-KR', { style: 'percent', maximumFractionDigits: 1 }).format(value);
}

const columns: Column<DemandProfile>[] = [
  { key: 'itemId', label: 'SKU', render: (row) => <span className="data-value">{row.itemId}</span> },
  { key: 'itemName', label: '품목명' },
  { key: 'adi', label: 'ADI', align: 'right', render: (row) => numberCell(row.adi) },
  { key: 'cvSquared', label: 'CV²', align: 'right', render: (row) => numberCell(row.cvSquared) },
  { key: 'zeroDemandRate', label: 'Zero-demand Rate', align: 'right', render: (row) => percentCell(row.zeroDemandRate) },
  { key: 'trend', label: 'Trend', align: 'right', render: (row) => numberCell(row.trend) },
  { key: 'demandType', label: 'Demand Type', align: 'center', render: (row) => row.demandType ? <Badge status={demandTypeStatus(row.demandType)} label={row.demandType} /> : <EmptyValue reasonCode={row.reasonCode ?? undefined} /> },
  { key: 'seasonality', label: 'Seasonality', align: 'center', render: (row) => row.seasonality ?? <EmptyValue reasonCode={row.reasonCode ?? undefined} /> },
  { key: 'reasonCode', label: 'Reason', render: (row) => row.reasonCode ? <span className="reason-code">{row.reasonCode}</span> : <EmptyValue reasonCode="NO_REASON" /> },
];

export default function DemandProfileFilters({ rows }: { rows: DemandProfile[] }) {
  const [demandType, setDemandType] = useState<DemandTypeFilter>('ALL');
  const [availability, setAvailability] = useState<AvailabilityFilter>('ALL');
  const [search, setSearch] = useState('');
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const typeMatches = demandType === 'ALL' || row.demandType === demandType;
      const availabilityMatches = availability === 'ALL' || (availability === 'AVAILABLE' ? row.demandType !== null : row.demandType === null);
      const searchMatches = !query || row.itemId.toLowerCase().includes(query) || row.itemName.toLowerCase().includes(query);
      return typeMatches && availabilityMatches && searchMatches;
    });
  }, [availability, demandType, rows, search]);

  return <>
    <div className="demand-profile-filters" aria-label="수요 프로파일 필터">
      <label>Demand Type<select value={demandType} onChange={(event) => setDemandType(event.target.value as DemandTypeFilter)}><option value="ALL">전체</option><option value="SMOOTH">SMOOTH</option><option value="INTERMITTENT">INTERMITTENT</option><option value="ERRATIC">ERRATIC</option><option value="LUMPY">LUMPY</option></select></label>
      <label>계산 상태<select value={availability} onChange={(event) => setAvailability(event.target.value as AvailabilityFilter)}><option value="ALL">전체</option><option value="AVAILABLE">계산 가능</option><option value="UNAVAILABLE">계산 불가</option></select></label>
      <label className="demand-profile-search">SKU 검색<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="SKU 또는 품목명" /></label>
    </div>
    <p className="filter-result-count">저장된 analytics 결과 {filteredRows.length}건</p>
    <DataTable columns={columns} rows={filteredRows} rowKey={(row) => row.itemId} empty="조건에 맞는 SKU가 없습니다." />
  </>;
}
