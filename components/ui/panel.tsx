import type { ReactNode } from 'react';

export default function Panel({ title, description, actions, children, className = '' }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {title || description || actions ? (
        <header className="panel-header">
          <div>{title ? <h3 className="panel-title">{title}</h3> : null}{description ? <p className="panel-description">{description}</p> : null}</div>
          {actions ? <div>{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
