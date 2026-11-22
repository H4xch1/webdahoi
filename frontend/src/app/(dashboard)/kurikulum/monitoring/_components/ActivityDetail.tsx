"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  monitoringApi, monitorDate, monitorError, monitorUrl,
  type ActivityKind, type Detail, type Question, type Submission, type PageData,
} from "@/lib/kurikulumMonitoringApi";
import styles from "../monitoring.module.css";

function RelatedRecords({ kind, id }: { kind: "tugas" | "ujian"; id: string }) {
  const [submissions, setSubmissions] = useState<PageData<Submission> | null>(null);
  const [questions, setQuestions] = useState<PageData<Question> | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setSubmissions(null); setQuestions(null);
    async function load() {
      try {
        if (kind === "tugas") {
          const result = await monitoringApi.submissions(id, page, search, controller.signal);
          if (!controller.signal.aborted) setSubmissions(result);
        } else {
          const result = await monitoringApi.questions(id, page, search, controller.signal);
          if (!controller.signal.aborted) setQuestions(result);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) setError(monitorError(err));
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [kind, id, page, search, reload]);
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSearch(query.trim()); setPage(1); setReload((v) => v + 1);
  }
  const data = submissions ?? questions;
  return <section className={styles.panel} aria-busy={loading}>
    <h2>{kind === "tugas" ? "Pengumpulan siswa (hanya-baca)" : "Pratinjau soal (tanpa kunci jawaban)"}</h2>
    <form className={styles.toolbar} onSubmit={submitSearch}>
      <label className={styles.field}>{kind === "tugas" ? "Cari nama / NIS siswa" : "Cari teks pertanyaan"}
        <input type="search" value={query} maxLength={200} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <button className={styles.primary} disabled={loading}>Cari</button>
      <button type="button" className={styles.secondary} disabled={loading} onClick={() => {
        setQuery(""); setSearch(""); setPage(1); setReload((v) => v + 1);
      }}>Reset / Muat ulang</button>
    </form>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading && <p className={styles.empty} role="status">Memuat data...</p>}
    {!loading && !error && data?.items.length === 0 && <p className={styles.empty}>Tidak ada data yang sesuai.</p>}
    {submissions && <div className={styles.recordList}>
      {submissions.items.map((item) => {
        const url = monitorUrl(item.fileUrl);
        return <article key={item.id} className={styles.record}>
          <h3>{item.siswa.name}</h3><p className={styles.muted}>NIS: {item.siswa.nis || "—"}</p>
          <p className={styles.muted}>Dikumpulkan: {monitorDate(item.createdAt)} · Diperbarui: {monitorDate(item.updatedAt)}</p>
          <p className={styles.prose}>{item.catatan || "Tanpa catatan siswa."}</p>
          <p className={styles.badge}>Nilai: {item.nilai === null ? "Belum dinilai" : item.nilai}</p>
          <p className={styles.prose}>Umpan balik: {item.feedback || "Belum ada."}</p>
          {item.gradedAt && <p className={styles.hint}>Dinilai: {monitorDate(item.gradedAt)}</p>}
          {url && <a href={url} className={styles.secondary} target="_blank" rel="noopener noreferrer">Buka lampiran siswa</a>}
        </article>;
      })}
    </div>}
    {questions && <div className={styles.recordList}>
      {questions.items.map((item) => <article key={item.id} className={styles.record}>
        <h3>Soal {item.urutan + 1} · Bobot {item.bobot}</h3><p className={styles.prose}>{item.pertanyaan}</p>
        <ol className={styles.answers} type="A">{(["A", "B", "C", "D"] as const).map((letter) =>
          <li key={letter}>{item[`opsi${letter}`]}</li>)}</ol>
      </article>)}
    </div>}
    {data && <nav className={styles.actions} aria-label="Halaman data terkait">
      <button className={styles.secondary} disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>Sebelumnya</button>
      <span className={styles.muted}>Halaman {page} dari {data.pagination.totalPages} · {data.pagination.total} hasil</span>
      <button className={styles.secondary} disabled={page >= data.pagination.totalPages} onClick={() => setPage((v) => v + 1)}>Berikutnya</button>
    </nav>}
    {kind === "tugas" && <p className={styles.hint}>Daftar ini berisi pengumpulan, bukan daftar seluruh siswa kelas. Tidak ada tombol untuk mengubah nilai.</p>}
  </section>;
}

export default function ActivityDetail({ kind, id }: { kind: ActivityKind; id: string }) {
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    monitoringApi.detail(kind, id, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(monitorError(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [kind, id, reload]);
  const item = data?.item;
  const url = monitorUrl(item?.fileUrl);
  return <main className={styles.page} aria-busy={loading}>
    <header className={styles.header}><div><p className={styles.eyebrow}>Kurikulum / Aktivitas Guru / {kind}</p>
      <h1>{item?.judul ?? "Detail aktivitas"}</h1></div>
      <Link className={styles.secondary} href="/kurikulum/monitoring">Daftar aktivitas</Link>
    </header>
    <p className={styles.notice}>Pratinjau hanya-baca. Anda tetap menggunakan akun Kurikulum, bukan akun pembuat aktivitas.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <button className={styles.reload} disabled={loading} onClick={() => setReload((v) => v + 1)}>
      {loading ? "Memuat..." : "Muat ulang detail"}</button>
    {item && <>
      <section className={styles.panel}>
        <div className={styles.badges}><span>{item.kelas.nama}</span><span>{item.mapel.nama}</span></div>
        <p className={styles.muted}>Dibuat oleh {item.createdBy.name} · {monitorDate(item.createdAt)}</p>
        <h2>Deskripsi / instruksi</h2><p className={styles.prose}>{item.deskripsi || "Tidak ada deskripsi."}</p>
        {kind === "materi" && (url ? <a href={url} target="_blank" rel="noopener noreferrer" className={styles.primary}>Buka materi</a>
          : <p className={styles.muted}>Tidak ada tautan lampiran yang valid.</p>)}
        {kind === "tugas" && <p className={styles.muted}>Tenggat: {monitorDate(item.deadline)}<br />
          {item._count?.submissions ?? 0} pengumpulan · {data?.belumDinilai ?? 0} belum dinilai</p>}
        {kind === "ujian" && <>
          <p className={styles.muted}>Jadwal: {monitorDate(item.tanggal)}<br />Durasi: {item.durasiMenit ?? "—"} menit<br />
            {item._count?.soal ?? 0} soal · {item._count?.nilai ?? 0} rekaman nilai</p>
          <p className={styles.hint}>Jumlah rekaman nilai tidak selalu berarti jumlah peserta unik pada data lama.
            Pratinjau ini bukan sesi pengerjaan ujian dan tidak menampilkan kunci jawaban.</p>
        </>}
        <div className={styles.actions}>
          <Link href={`/kurikulum/monitoring?guruId=${encodeURIComponent(item.createdBy.id)}`} className={styles.secondary}>Semua aktivitas guru ini</Link>
          <Link href={`/kurikulum/guru/${encodeURIComponent(item.createdBy.id)}`} className={styles.secondary}>Edit akun / penugasan guru</Link>
        </div>
      </section>
      {kind !== "materi" && <RelatedRecords kind={kind} id={id} />}
    </>}
  </main>;
}
