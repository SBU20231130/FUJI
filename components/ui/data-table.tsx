import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
};

export function formatNumber(value: number | null, suffix = '') {
  if (value === null) return '—';
  return `${Number.isInteger(value) ? String(value) : value.toFixed(1)}${suffix}`;
}

export default function DataTable<T extends Record<string, unknown>>({ columns, rows, empty = '표시할 데이터가 없습니다.', rowKey }: { columns: Column<T>[]; rows: T[]; empty?: ReactNode; rowKey?: (row: T, index: number) => string }) {
  if (rows.length === 0) return <p className="data-table__empty">{empty}</p>;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr>{columns.map((column) => <th key={column.key} style={{ textAlign: column.align }}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={rowKey ? rowKey(row, index) : String(index)}>{columns.map((column) => <td key={column.key} style={{ textAlign: column.align }}>{column.render ? column.render(row) : String(row[column.key] ?? '—')}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
