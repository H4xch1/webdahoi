"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { kurikulumApi, managementError, type Overview } from "@/lib/kurikulumApi";
import styles from "./management.module.css";

export default function KurikulumPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    kurikulumApi.overview(controller.signal).then((value) => {
      if (!controller.signal.aborted) setData(value);
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(managementError(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [reload]);
  return <main className={styles.page} aria-busy={loading}>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>Ruang Kurikulum</p><h1>Kelola Guru dan Siswa</h1>
        <p>Atur identitas akun, penempatan kelas, dan penugasan mengajar.</p></div>
      <button className={styles.secondary} disabled={loading} onClick={() => setReload((v) => v + 1)}>
        {loading ? "Memuat..." : "Muat ulang"}</button>
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading && <p className={styles.empty} role="status">Memuat ringkasan...</p>}
    {data && !loading && !error && <section className={styles.stats} aria-label="Ringkasan akun">
      {[["Guru", data.counts.guru], ["Siswa", data.counts.siswa], ["Kelas tersedia", data.counts.kelas],
        ["Mata pelajaran", data.counts.mapel], ["Siswa tanpa kelas", data.counts.tanpaKelas]].map(([label, value]) =>
        <article className={styles.stat} key={label}><p>{label}</p><strong>{value}</strong></article>)}
    </section>}
    <section className={styles.cards} aria-label="Pengelolaan akun">
      <article className={styles.panel}><span className={styles.badge}>Guru</span><h2>Data dan penugasan guru</h2>
        <p className={styles.muted}>Tambah dan perbarui identitas, NIP, kelas yang diajar, serta mata pelajaran guru.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/kurikulum/guru">Kelola Guru</Link>
          <Link className={styles.secondary} href="/kurikulum/guru/buat">Tambah Guru</Link></div>
      </article>
      <article className={styles.panel}><span className={styles.badge}>Siswa</span><h2>Data dan kelas siswa</h2>
        <p className={styles.muted}>Kelola identitas siswa, NIS, NISN, dan penempatan atau perpindahan kelas.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/kurikulum/siswa">Kelola Siswa</Link>
          <Link className={styles.secondary} href="/kurikulum/siswa/buat">Tambah Siswa</Link></div>
      </article>
    </section>
    <section className={styles.notice}><h2>Batas kewenangan</h2>
      <p>Hanya akun Guru dan Siswa yang dapat dikelola. Pembuatan kelas, jurusan, mata pelajaran, dan akun staf tetap milik Admin.</p>
      <p>Akun dengan riwayat akademik tidak dapat dihapus melalui area ini untuk menjaga data sekolah.</p>
    </section>
  </main>;
}
