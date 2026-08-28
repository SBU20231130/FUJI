export type Status = 'SAFE' | 'WARNING' | 'CRITICAL' | 'CALCULATION_UNAVAILABLE';

const labels: Record<Status, string> = {
  SAFE: 'SAFE',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  CALCULATION_UNAVAILABLE: '계산 불가',
};

export default function Badge({ status, label }: { status: Status; label?: string }) {
  return <span className={`badge badge--${status.toLowerCase().replaceAll('_', '-')}`}>{label ?? labels[status]}</span>;
}
