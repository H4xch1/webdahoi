"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  guruApi,
  errorMessage,
  formatDateTime,
  safeResourceUrl,
  type GuruOptions,
  type GuruOverview,
} from "@/lib/guruApi";

import shared from "./guru-shared.module.css";
import styles from "./guru.module.css";

type Tab = "tugas" | "materi" | "ujian";

export default function GuruPage() {
  const [data, setData] = useState<{
    options: GuruOptions;
    overview: GuruOverview;
  } | null>(null);

  const [tab, setTab] = useState<Tab>("tugas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    Promise.all([
      guruApi.options(controller.signal),
      guruApi.overview(controller.signal),
    ])
      .then(([options, overview]) => {
        if (!controller.signal.aborted) {
          setData({ options, overview });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  if (loading) {
    return (
      <main className={shared.page} aria-busy="true">
        <div className={shared.empty} role="status">
          Memuat ruang guru…
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className={shared.page}>
        <p className={shared.error} role="alert">
          {error || "Data tidak tersedia."}
        </p>
        <button
          className={shared.button}
          onClick={() => setAttempt((value) => value + 1)}
        >
          Coba lagi
        </button>
      </main>
    );
  }

  const { options, overview } = data;

  const stats = [
    ["Kelas diampu", overview.counts.kelas],
    ["Materi", overview.counts.materi],
    ["Tugas", overview.counts.tugas],
    ["Ujian", overview.counts.ujian],
    ["Belum dinilai", overview.counts.belumDinilai],
  ] as const;

  return (
    <main className={shared.page}>
      <section className={styles.hero}>
        <div>
          <p className={shared.eyebrow}>Ruang Guru</p>
          <h1 className={styles.greeting}>
            Selamat datang,
            <br />
            <span>{options.teacher.name}</span>
          </h1>

          <p className={styles.heroText}>
            Kelola kehadiran, bagikan pengetahuan, dan dampingi
            perkembangan belajar murid Anda.
          </p>

          <div className={shared.actions}>
            <Link href="/guru/absen" className={shared.button}>
              Buka absensi
            </Link>
            <a href="#kegiatan" className={shared.secondary}>
              Informasi kegiatan
            </a>
          </div>
        </div>

        <div className={styles.ornament} aria-hidden="true">
          <div className={styles.arch} />
          <div className={styles.orbit} />
          <span>✦</span>
        </div>
      </section>

      <section className={styles.stats} aria-label="Ringkasan guru">
        {stats.map(([label, count]) => (
          <article className={styles.stat} key={label}>
            <p>{label}</p>
            <strong>{count}</strong>
          </article>
        ))}
      </section>

      {options.kelas.length === 0 && (
        <p className={shared.notice}>
          Anda belum memiliki kelas. Hubungi admin untuk mengatur
          kelas yang Anda ajar.
        </p>
      )}

      <section className={styles.columns}>
        <div className={shared.panel}>
          <h2 className={shared.panelTitle}>Mulai kegiatan</h2>

          <div className={styles.shortcuts}>
            <Link href="/guru/materi/buat">
              <span className={styles.shortcutIcon}>M</span>
              <span>
                <strong>Buat materi</strong>
                <small>Bagikan bahan pembelajaran</small>
              </span>
              <span aria-hidden="true">↗</span>
            </Link>

            <Link href="/guru/tugas/buat">
              <span className={styles.shortcutIcon}>T</span>
              <span>
                <strong>Buat tugas</strong>
                <small>Atur instruksi dan tenggat</small>
              </span>
              <span aria-hidden="true">↗</span>
            </Link>

            <Link href="/guru/ujian/buat">
              <span className={styles.shortcutIcon}>U</span>
              <span>
                <strong>Buat ujian</strong>
                <small>Susun soal pilihan ganda</small>
              </span>
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>

        <div className={shared.panel}>
          <h2 className={shared.panelTitle}>Kelas yang diampu</h2>

          {options.kelas.length === 0 ? (
            <p className={shared.muted}>Belum ada kelas.</p>
          ) : (
            <div className={styles.classList}>
              {options.kelas.map((kelas) => (
                <article key={kelas.id} className={styles.classItem}>
                  <strong>{kelas.nama}</strong>
                  <span>{kelas.jurusan.nama}</span>
                  <small>
                    {kelas.mapel.map((mapel) => mapel.nama).join(", ") ||
                      "Mata pelajaran belum ditugaskan"}
                  </small>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={shared.panel} id="kegiatan">
        <div className={styles.sectionHeading}>
          <div>
            <h2 className={shared.panelTitle}>Kegiatan pembelajaran</h2>
            <p className={shared.muted}>
              Maksimal 20 kegiatan terbaru per kategori yang Anda buat.
            </p>
          </div>

          <div className={styles.tabs} aria-label="Kategori kegiatan">
            {(["tugas", "materi", "ujian"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={tab === item}
                className={tab === item ? styles.activeTab : styles.tab}
                onClick={() => setTab(item)}
              >
                {item === "tugas"
                  ? "Tugas"
                  : item === "materi"
                    ? "Materi"
                    : "Ujian"}
              </button>
            ))}
          </div>
        </div>

        {overview[tab].length === 0 && (
          <div className={shared.empty}>
            Belum ada {tab}. Mulai dengan tombol buat di atas.
          </div>
        )}

        <div className={styles.contentGrid}>
          {tab === "tugas" &&
            overview.tugas.map((tugas) => (
              <article key={tugas.id} className={styles.contentCard}>
                <span className={shared.badge}>
                  {tugas.kelas.nama} · {tugas.mapel.nama}
                </span>

                <h3>{tugas.judul}</h3>
                <p className={styles.description}>
                  {tugas.deskripsi || "Tidak ada deskripsi."}
                </p>

                <p className={shared.muted}>
                  Tenggat: {formatDateTime(tugas.deadline)}
                  <br />
                  {tugas._count.submissions} pengumpulan
                </p>

                <Link
                  href={`/guru/tugas/${tugas.id}/nilai`}
                  className={shared.secondary}
                >
                  Lihat & beri nilai
                </Link>
              </article>
            ))}

          {tab === "materi" &&
            overview.materi.map((materi) => {
              const url = safeResourceUrl(materi.fileUrl);

              return (
                <article key={materi.id} className={styles.contentCard}>
                  <span className={shared.badge}>
                    {materi.kelas.nama} · {materi.mapel.nama}
                  </span>

                  <h3>{materi.judul}</h3>

                  <details className={styles.details}>
                    <summary>Lihat deskripsi</summary>
                    <p>{materi.deskripsi || "Tidak ada deskripsi."}</p>
                  </details>

                  <p className={shared.muted}>
                    {formatDateTime(materi.createdAt)}
                  </p>

                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={shared.secondary}
                    >
                      Buka materi ↗
                    </a>
                  )}
                </article>
              );
            })}

          {tab === "ujian" &&
            overview.ujian.map((ujian) => (
              <article key={ujian.id} className={styles.contentCard}>
                <span className={shared.badge}>
                  {ujian.kelas.nama} · {ujian.mapel.nama}
                </span>

                <h3>{ujian.judul}</h3>
                <p className={styles.description}>
                  {ujian.deskripsi || "Tidak ada deskripsi."}
                </p>

                <p className={shared.muted}>
                  {formatDateTime(ujian.tanggal)}
                  <br />
                  {ujian.durasiMenit ?? "—"} menit ·{" "}
                  {ujian._count.soal} soal
                </p>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
