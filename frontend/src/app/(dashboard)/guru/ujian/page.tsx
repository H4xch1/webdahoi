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

export default function GuruUjianPage() {
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
    const items = data?.ujian ?? [];

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
          <h1 className={styles.title}>Ujian Murid</h1>
          <p className={styles.subtitle}>
            Lihat jadwal, durasi, dan jumlah soal ujian untuk kelas Anda.
          </p>
        </div>

        <Link href="/guru/ujian/buat" className={styles.button}>
          + Buat Ujian
        </Link>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <section
        className={styles.panel}
        aria-labelledby="ujian-list-title"
        aria-busy={loading}
      >
        <div className={styles.header}>
          <div>
            <h2 id="ujian-list-title" className={styles.panelTitle}>
              Daftar Ujian
            </h2>
            <p className={styles.hint}>
              {data
                ? `${data.counts.ujian} ujian total · ${data.ujian.length} dimuat`
                : "Ujian yang tersedia untuk akun guru Anda."}
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

        <label className={styles.field} htmlFor="search-ujian">
          Cari ujian
          <input
            id="search-ujian"
            type="search"
            className={styles.input}
            placeholder="Judul, kelas, atau mata pelajaran..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <hr className={styles.divider} />

        {data && data.counts.ujian > data.ujian.length && (
          <div className={styles.notice}>
            Ringkasan API mengembalikan {data.ujian.length} dari{" "}
            {data.counts.ujian} ujian. Pencarian hanya mencakup ujian yang
            sudah dimuat.
          </div>
        )}

        {loading ? (
          <div className={styles.empty} role="status">
            Memuat daftar ujian...
          </div>
        ) : error ? (
          <div className={styles.empty}>
            Daftar ujian belum dapat ditampilkan. Tekan Muat Ulang untuk
            mencoba kembali.
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {search.trim()
              ? "Tidak ada ujian yang cocok dengan pencarian."
              : "Belum ada ujian yang ditampilkan. Gunakan tombol Buat Ujian untuk menambahkan ujian."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filtered.map((ujian) => (
              <article key={ujian.id} className={styles.panel}>
                <div className={styles.actions} style={{ marginBottom: 14 }}>
                  <span className={styles.badge}>{ujian.kelas.nama}</span>
                  <span className={styles.badge}>{ujian.mapel.nama}</span>
                  <span className={styles.badge}>
                    {ujian._count.soal} soal
                  </span>
                </div>

                <h3 className={styles.panelTitle}>{ujian.judul}</h3>

                {ujian.deskripsi && (
                  <p
                    className={styles.muted}
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {ujian.deskripsi}
                  </p>
                )}

                <hr className={styles.divider} />

                <div className={styles.formGrid}>
                  <div>
                    <h3 className={styles.panelTitle}>Jadwal Ujian</h3>
                    <p className={styles.hint}>
                      {formatDateTime(ujian.tanggal)}
                    </p>
                  </div>

                  <div>
                    <h3 className={styles.panelTitle}>Durasi</h3>
                    <p className={styles.hint}>
                      {ujian.durasiMenit === null
                        ? "Belum ditentukan"
                        : `${ujian.durasiMenit} menit`}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
