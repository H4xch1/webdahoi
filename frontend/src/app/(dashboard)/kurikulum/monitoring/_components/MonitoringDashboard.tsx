"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  monitoringApi, monitorError, monitorDate, type ActivityKind, type Filters,
  type MonitoringOptions, type Overview, type Activity, type PageData,
} from "@/lib/kurikulumMonitoringApi";
import styles from "../monitoring.module.css";

const categories: { kind: ActivityKind; label: string }[] = [
  { kind: "materi", label: "Materi" }, { kind: "tugas", label: "Tugas" }, { kind: "ujian", label: "Ujian" },
];
const emptyFilters = (): Filters => ({ guruId: "", kelasId: "", mapelId: "", q: "" });

export default function MonitoringDashboard() {
  const searchParams = useSearchParams();
  const guruIdFromUrl = searchParams.get("guruId") ?? "";
  const [filters, setFilters] = useState<Filters>(() => ({ ...emptyFilters(), guruId: guruIdFromUrl }));
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ActivityKind>("materi");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [options, setOptions] = useState<MonitoringOptions | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [data, setData] = useState<PageData<Activity> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    setFilters((current) => ({ ...current, guruId: guruIdFromUrl })); setPage(1);
  }, [guruIdFromUrl]);
  useEffect(() => {
    const controller = new AbortController();
    setOptionsError("");
    monitoringApi.options(controller.signal).then((value) => {
      if (!controller.signal.aborted) setOptions(value);
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setOptionsError(monitorError(err));
    });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null); setOverview(null);
    Promise.all([
      monitoringApi.overview(filters, controller.signal),
      monitoringApi.list(kind, filters, page, controller.signal),
    ]).then(([summary, list]) => {
      if (!controller.signal.aborted) { setOverview(summary); setData(list); }
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(monitorError(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [filters, kind, page, reload]);

  function filter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value })); setPage(1);
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); filter("q", query.trim()); setReload((value) => value + 1);
  }
  const teacher = options?.guru.find((item) => item.id === filters.guruId);

  return <main className={styles.page} aria-busy={loading}>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>Ruang Kurikulum / Monitoring</p><h1>Aktivitas Guru</h1>
        <p>Tinjau materi, tugas, ujian, dan pengumpulan tanpa masuk sebagai guru.</p></div>
      <div className={styles.actions}><Link href="/kurikulum" className={styles.secondary}>Dashboard</Link>
        <Link href="/kurikulum/guru" className={styles.secondary}>Kelola Guru</Link>
        <Link href="/kurikulum/siswa" className={styles.secondary}>Kelola Siswa</Link></div>
    </header>
    <p className={styles.notice}>Mode pengawasan hanya-baca. Pengeditan identitas, kelas, dan penugasan Guru/Siswa tetap tersedia di menu pengelolaan akun.
      Area ini tidak mengubah materi, tugas, ujian, atau nilai.</p>
    {optionsError && <p className={styles.error} role="alert">Opsi filter: {optionsError}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <section className={styles.panel} aria-label="Filter aktivitas">
      <div className={styles.filters}>
        <label className={styles.field}>Guru
          <select value={filters.guruId} onChange={(e) => filter("guruId", e.target.value)}>
            <option value="">Semua guru</option>
            {options?.guru.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className={styles.field}>Kelas
          <select value={filters.kelasId} onChange={(e) => filter("kelasId", e.target.value)}>
            <option value="">Semua kelas</option>
            {options?.kelas.map((item) => <option key={item.id} value={item.id}>{item.nama} · {item.jurusan.nama}</option>)}
          </select>
        </label>
        <label className={styles.field}>Mata pelajaran
          <select value={filters.mapelId} onChange={(e) => filter("mapelId", e.target.value)}>
            <option value="">Semua mata pelajaran</option>
            {options?.mapel.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
          </select>
        </label>
      </div>
      <form onSubmit={search} className={styles.toolbar}>
        <label className={styles.field}>Cari judul atau deskripsi
          <input type="search" maxLength={200} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari aktivitas pembelajaran..." />
        </label>
        <button className={styles.primary} disabled={loading}>Cari</button>
        <button type="button" className={styles.secondary} disabled={loading} onClick={() => {
          setFilters(emptyFilters()); setQuery(""); setPage(1); setReload((v) => v + 1);
        }}>Reset</button>
        <button type="button" className={styles.secondary} disabled={loading} onClick={() => setReload((v) => v + 1)}>Muat ulang</button>
      </form>
    </section>
    {teacher && <section className={styles.teacher}>
      <div><h2>{teacher.name}</h2>
        <p className={styles.muted}>Kelas saat ini: {teacher.kelasDiajar.map((v) => v.nama).join(", ") || "Belum ditugaskan"}</p>
        <p className={styles.muted}>Mapel saat ini: {teacher.mapelDiajar.map((v) => v.nama).join(", ") || "Belum ditugaskan"}</p>
        <p className={styles.hint}>Daftar aktivitas juga mencakup karya sebelumnya, meskipun penugasan guru telah berubah.</p>
      </div>
      <Link href={`/kurikulum/guru/${encodeURIComponent(teacher.id)}`} className={styles.secondary}>Edit akun / penugasan</Link>
    </section>}
    {overview && <section className={styles.stats} aria-label="Ringkasan sesuai filter">
      {[["Materi", overview.counts.materi], ["Tugas", overview.counts.tugas], ["Ujian", overview.counts.ujian],
        ["Pengumpulan tugas", overview.counts.pengumpulan], ["Belum dinilai", overview.counts.belumDinilai]]
        .map(([label, value]) => <article key={label} className={styles.stat}><p>{label}</p><strong>{value}</strong></article>)}
    </section>}
    <div className={styles.actions} role="group" aria-label="Kategori aktivitas">
      {categories.map((item) => <button key={item.kind} className={kind === item.kind ? styles.primary : styles.secondary}
        aria-pressed={kind === item.kind} onClick={() => { setKind(item.kind); setPage(1); }}>{item.label}</button>)}
    </div>
    {loading && <p className={styles.empty} role="status">Memuat aktivitas guru...</p>}
    {!loading && !error && data && <>
      <p className={styles.muted} role="status">{data.pagination.total} {kind} ditemukan. Urutan berdasarkan waktu pembuatan terbaru.</p>
      {data.items.length === 0 ? <section className={styles.empty}><h2>Belum ada hasil</h2>
        <p>Tidak ada {kind} yang sesuai dengan filter. Coba ubah filter atau pilih kategori lain.</p></section>
        : <section className={styles.grid} aria-label={`Daftar ${kind}`}>
          {data.items.map((item) => <article key={item.id} className={styles.card}>
            <div className={styles.badges}><span>{item.kelas.nama}</span><span>{item.mapel.nama}</span></div>
            <h2>{item.judul}</h2><p className={styles.muted}>Guru: {item.createdBy.name}</p>
            <p className={styles.excerpt}>{item.deskripsi || "Tidak ada deskripsi."}</p>
            <p className={styles.hint}>Dibuat: {monitorDate(item.createdAt)}</p>
            {kind === "tugas" && <p className={styles.muted}>Tenggat: {monitorDate(item.deadline)}<br />
              {item._count?.submissions ?? 0} pengumpulan</p>}
            {kind === "ujian" && <p className={styles.muted}>Jadwal: {monitorDate(item.tanggal)}<br />
              {item.durasiMenit ?? "—"} menit · {item._count?.soal ?? 0} soal · {item._count?.nilai ?? 0} rekaman nilai</p>}
            <Link href={`/kurikulum/monitoring/${kind}/${encodeURIComponent(item.id)}`} className={styles.primary}>Lihat detail</Link>
            <Link href={`/kurikulum/guru/${encodeURIComponent(item.createdBy.id)}`} className={styles.textLink}>Edit akun guru</Link>
          </article>)}
        </section>}
      <nav className={styles.actions} aria-label="Halaman aktivitas">
        <button className={styles.secondary} disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Sebelumnya</button>
        <span className={styles.muted}>Halaman {page} dari {data.pagination.totalPages}</span>
        <button className={styles.secondary} disabled={page >= data.pagination.totalPages} onClick={() => setPage((v) => v + 1)}>Berikutnya</button>
      </nav>
    </>}
  </main>;
}
