import type { ReactNode } from 'react';
import type { Status } from './badge';

export default function KpiCard({ label, value, foot, status }: { label: string; value: ReactNode; foot?: ReactNode; status?: Status }) {
  return (
    <article className={`kpi-card${status ? ` kpi-card--${status.toLowerCase().replaceAll('_', '-')}` : ''}`}>
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value data-value">{value}</div>
      {foot ? <div className="kpi-card__foot">{foot}</div> : null}
    </article>
  );
}
