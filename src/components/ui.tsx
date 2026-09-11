import type { ReactNode } from "react";
import Link from "next/link";
import { Inbox, Plus } from "lucide-react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="page-head__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p className="page-head__description">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div className="section-copy">
        <h2>{title}</h2>
        {description ? <p className="section-description">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, description, actionHref, actionLabel }: { title: string; description: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true"><Inbox size={20} /></span>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {actionHref && actionLabel ? <Link className="button" href={actionHref}><Plus size={16} />{actionLabel}</Link> : null}
    </div>
  );
}

export function PreviewNotice() {
  return (
    <aside className="notice notice--preview" aria-label="Mode pratinjau">
      <div className="notice__body">
        <strong>Mode pratinjau kosong</strong>
        <span>Supabase belum dikonfigurasi. Navigasi dan UI dapat ditinjau, tetapi penyimpanan dinonaktifkan dan tidak ada angka contoh.</span>
      </div>
    </aside>
  );
}

export function SummaryStrip({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="summary-strip">
      {items.map((item) => (
        <div className="summary-item" key={item.label}>
          <span className="summary-label">{item.label}</span>
          <span className="summary-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
