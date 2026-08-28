import type { ReactNode } from 'react';

export default function InsightBanner({ title, children }: { title: string; children: ReactNode }) {
  return <div className="insight-banner"><div><strong>{title}</strong><span>{children}</span></div></div>;
}
