"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  errorMessage,
  formatDateTime,
  guruApi,
  type GuruOverview,
} from "@/lib/guruApi";
import styles from "../guru-shared.module.css";

export default function GuruTugasPage() {
  const [data, setData] = useState<GuruOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setData(null);

    async function load() {
      try {
        const result = await guruApi.overview(controller.signal);

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(errorMessage(err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [reload]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");
    const items = data?.tugas ?? [];

    if (!query) return items;

    return items.filter((item) =>
      [
        item.judul,
        item.deskripsi ?? "",
        item.kelas.nama,
        item.mapel.nama,
      ]
        .join(" ")
        .toLocaleLowerCase("id-ID")
        .includes(query),
    );
  }, [data, search]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Ruang Guru</p>
          <h1 className={styles.title}>Tugas Murid</h1>
          <p className={styles.subtitle}>
            Kelola tugas, pantau pengumpulan, dan buka penilaian murid.
          </p>
        </div>

        <Link href="/guru/tugas/buat" className={styles.button}>
          + Buat Tugas
        </Link>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <section
        className={styles.panel}
        aria-labelledby="tugas-list-title"
        aria-busy={loading}
      >
        <div className={styles.header}>
          <div>
            <h2 id="tugas-list-title" className={styles.panelTitle}>
              Daftar Tugas
            </h2>
            <p className={styles.hint}>
              {data
                ? `${data.counts.tugas} tugas total · ${data.tugas.length} dimuat`
                : "Tugas yang tersedia untuk akun guru Anda."}
            </p>
          </div>

          <button
            type="button"
            className={styles.secondary}
            disabled={loading}
            onClick={() => setReload((value) => value + 1)}
          >
            {loading ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>

        <label className={styles.field} htmlFor="search-tugas">
          Cari tugas
          <input
            id="search-tugas"
            type="search"
            className={styles.input}
            placeholder="Judul, kelas, atau mata pelajaran..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <hr className={styles.divider} />

        {data && data.counts.tugas > data.tugas.length && (
          <div className={styles.notice}>
            Ringkasan API mengembalikan {data.tugas.length} dari{" "}
            {data.counts.tugas} tugas. Pencarian hanya mencakup tugas yang
            sudah dimuat.
          </div>
        )}

        {loading ? (
          <div className={styles.empty} role="status">
            Memuat daftar tugas...
          </div>
        ) : error ? (
          <div className={styles.empty}>
            Daftar tugas belum dapat ditampilkan. Tekan Muat Ulang untuk
            mencoba kembali.
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {search.trim()
              ? "Tidak ada tugas yang cocok dengan pencarian."
              : "Belum ada tugas yang ditampilkan. Gunakan tombol Buat Tugas untuk menambahkan tugas."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filtered.map((tugas) => (
              <article key={tugas.id} className={styles.panel}>
                <div className={styles.actions} style={{ marginBottom: 14 }}>
                  <span className={styles.badge}>{tugas.kelas.nama}</span>
                  <span className={styles.badge}>{tugas.mapel.nama}</span>
                </div>

                <h3 className={styles.panelTitle}>{tugas.judul}</h3>

                {tugas.deskripsi && (
                  <p
                    className={styles.muted}
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {tugas.deskripsi}
                  </p>
                )}

                <p className={styles.hint}>
                  Batas pengumpulan: {formatDateTime(tugas.deadline)}
                </p>
                <p className={styles.hint}>
                  Pengumpulan: {tugas._count.submissions}
                </p>

                <div className={styles.actions} style={{ marginTop: 18 }}>
                  <Link
                    href={`/guru/tugas/${encodeURIComponent(tugas.id)}`}
                    className={styles.secondary}
                  >
                    Lihat Detail
                  </Link>

                  <Link
                    href={`/guru/tugas/${encodeURIComponent(tugas.id)}/nilai`}
                    className={styles.button}
                  >
                    Nilai Tugas
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
