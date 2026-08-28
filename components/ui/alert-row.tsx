import type { ReactNode } from 'react';
import Badge, { type Status } from './badge';

export default function AlertRow({ status, title, description, meta }: { status: Status; title: string; description?: string; meta?: ReactNode }) {
  return <div className="alert-row"><Badge status={status} /><div><p className="alert-row__title">{title}</p>{description ? <p className="alert-row__description">{description}</p> : null}</div>{meta ? <span className="alert-row__meta">{meta}</span> : null}</div>;
}
