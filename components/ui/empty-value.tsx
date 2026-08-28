export default function EmptyValue({ reasonCode = 'CALCULATION_UNAVAILABLE' }: { reasonCode?: string }) {
  return <span className="empty-value" title={reasonCode}><span>—</span><span className="empty-value__reason">+ {reasonCode}</span></span>;
}
