"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  muridLearningApi, learningDate, learningError, resourceUrl,
  type LearningList as LearningListResponse,
} from "@/lib/muridLearningApi";
import styles from "../learning.module.css";

export default function LearningList({ kind }: { kind: "materi" | "ujian" }) {
  const title = kind === "materi" ? "Materi Pembelajaran" : "Ujian Saya";
  const [data, setData] = useState<LearningListResponse | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    muridLearningApi.list(kind, page, search, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(learningError(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [kind, page, search, reload]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(input.trim());
    setReload((value) => value + 1);
  }

  return (
    <main className={styles.page} aria-busy={loading}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Ruang Murid / Pembelajaran</p>
          <h1>{title}</h1>
          <p>{kind === "materi"
            ? "Pelajari materi dari guru untuk kelas Anda."
            : "Lihat jadwal, kerjakan ujian, dan periksa hasil Anda."}</p>
        </div>
        <Link href="/murid" className={styles.secondary}>Dashboard</Link>
      </header>

      <section className={styles.panel}>
        <form onSubmit={submitSearch} className={styles.toolbar}>
          <label className={styles.field} htmlFor={`search-${kind}`}>
            Cari {kind}
            <input id={`search-${kind}`} type="search" value={input} maxLength={200}
              placeholder="Judul, deskripsi, atau mata pelajaran..."
              onChange={(event) => setInput(event.target.value)} />
          </label>
          <button className={styles.primary} disabled={loading}>Cari</button>
          <button type="button" className={styles.secondary} disabled={loading}
            onClick={() => { setInput(""); setSearch(""); setPage(1); setReload((v) => v + 1); }}>
            Reset / Muat ulang
          </button>
        </form>
      </section>

      {loading && <p className={styles.empty} role="status">Memuat {kind}...</p>}
      {error && <section className={styles.error} role="alert">
        <p>{error}</p>
        <button className={styles.secondary} onClick={() => setReload((v) => v + 1)}>Coba lagi</button>
      </section>}

      {!loading && !error && data && <>
        <p className={styles.muted} role="status">{data.pagination.total} {kind} ditemukan.</p>
        {data.items.length === 0 ? <section className={styles.empty}>
          <h2>{search ? "Tidak ada hasil pencarian" : `Belum ada ${kind}`}</h2>
          <p>{search ? "Coba kata kunci lain." : `Guru belum menambahkan ${kind} untuk kelas Anda.`}</p>
        </section> : <section className={styles.grid} aria-label={`Daftar ${kind}`}>
          {data.items.map((item) => {
            const url = resourceUrl(item.fileUrl);
            return <article className={styles.card} key={item.id}>
              <div className={styles.badges}>
                <span className={styles.badge}>{item.mapel.nama}</span>
                <span className={styles.badge}>{item.kelas.nama}</span>
              </div>
              <h2>{item.judul}</h2>
              <p className={styles.muted}>Guru: {item.createdBy.name}</p>
              <details className={styles.description}>
                <summary>Deskripsi pembelajaran</summary>
                <p>{item.deskripsi || "Tidak ada deskripsi."}</p>
              </details>
              {kind === "materi" ? <>
                <p className={styles.muted}>Diterbitkan: {learningDate(item.createdAt)}</p>
                {url ? <a href={url} target="_blank" rel="noopener noreferrer" className={styles.primary}>
                  Buka materi
                </a> : <p className={styles.muted}>Tidak ada tautan lampiran. Baca deskripsi di atas.</p>}
              </> : <>
                <p className={styles.muted}>Jadwal: {item.tanggal ? learningDate(item.tanggal) : "—"}</p>
                <p className={styles.muted}>{item.durasiMenit ?? "—"} menit · {item.questionCount ?? 0} soal</p>
                {item.result && <p className={styles.success}>Selesai · Nilai {item.result.nilai}</p>}
                <Link href={`/murid/ujian/${encodeURIComponent(item.id)}`} className={styles.primary}>
                  {item.result ? "Lihat hasil" : "Lihat ujian"}
                </Link>
              </>}
            </article>;
          })}
        </section>}
        <nav className={styles.actions} aria-label="Halaman daftar">
          <button className={styles.secondary} disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            Sebelumnya
          </button>
          <span className={styles.muted}>Halaman {page} dari {data.pagination.totalPages}</span>
          <button className={styles.secondary} disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((v) => v + 1)}>Berikutnya</button>
        </nav>
      </>}
    </main>
  );
}
