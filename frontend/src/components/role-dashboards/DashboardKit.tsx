import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import styles from "./dashboards.module.css";
export { styles };
export function Hero({ area, title, description, loading, refresh, children }: {
  area: string; title: string; description: string; loading?: boolean; refresh?: () => void; children?: ReactNode;
}) {
  return <header className={styles.hero}><div><p className={styles.eyebrow}>{area}</p><h1>{title}</h1>
    <p className={styles.subtitle}>{description}</p>{children}</div>
    {refresh && <button type="button" className={styles.secondary} disabled={loading} onClick={refresh}>
      <RefreshCw size={16} aria-hidden="true" />{loading ? "Memuat..." : "Muat ulang"}</button>}
  </header>;
}
export function Stats({ items, loading }: { items: { label: string; value: number | null; hint?: string }[]; loading: boolean }) {
  return <section className={styles.stats} aria-label="Ringkasan dashboard">
    {items.map((item) => <article className={styles.stat} key={item.label}><p>{item.label}</p>
      <strong>{loading || item.value === null ? "—" : item.value.toLocaleString("id-ID")}</strong>
      {item.hint && <small>{item.hint}</small>}</article>)}
  </section>;
}
export function Card({ title, description, href, label, icon, children }: {
  title: string; description: string; href: string; label: string; icon: ReactNode; children?: ReactNode;
}) {
  return <article className={styles.card}><span className={styles.icon}>{icon}</span><h2>{title}</h2>
    <p className={styles.muted}>{description}</p><div className={styles.actions}>
      <Link className={styles.primary} href={href}>{label}<ArrowUpRight size={16} aria-hidden="true" /></Link>{children}</div></article>;
}
export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return <aside className={styles.notice}><h2>{title}</h2><div>{children}</div></aside>;
}
export function Errors({ errors }: { errors: string[] }) {
  return errors.length ? <div className={styles.error} role="alert"><p>Sebagian data belum dapat dimuat.</p>
    <ul>{errors.map((text, i) => <li key={i}>{text}</li>)}</ul></div> : null;
}
export function message(error: unknown) { return error instanceof Error ? error.message : "Permintaan gagal."; }
