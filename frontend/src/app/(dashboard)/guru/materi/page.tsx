"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import shared from "../guru-shared.module.css";
import styles from "./page.module.css";

type Materi = {
  id: string;
  judul?: string;
  title?: string;
  deskripsi?: string;
  description?: string;
  isi?: string;
  kelas?: { nama?: string } | string | null;
  mapel?: { nama?: string } | string | null;
  createdAt?: string;
};

export default function MateriPage() {
  const [materi, setMateri] = useState<Materi[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMateri() {
      try {
        const response = await fetch("/backend-api/guru/materi", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil data materi.");
        }

        const result = await response.json();

        setMateri(
          Array.isArray(result)
            ? result
            : result.data ?? result.materi ?? [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil materi.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMateri();
  }, []);

  const filteredMateri = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return materi;

    return materi.filter((item) => {
      const title = item.judul ?? item.title ?? "";
      const description =
        item.deskripsi ?? item.description ?? item.isi ?? "";

      return `${title} ${description}`.toLowerCase().includes(keyword);
    });
  }, [materi, search]);

  function getName(value: Materi["kelas"]) {
    if (!value) return "Kelas belum ditentukan";
    return typeof value === "string"
      ? value
      : value.nama ?? "Kelas belum ditentukan";
  }

  return (
    <main className={`${shared.page} ${styles.page}`}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Pembelajaran</p>
          <h1 className={shared.title}>Materi</h1>
          <p className={shared.subtitle}>
            Kelola materi pembelajaran untuk kelas Anda.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/guru" className={shared.secondary}>
            ← Dashboard
          </Link>

          <Link href="/guru/materi/buat" className={shared.primary}>
            + Buat Materi
          </Link>
        </div>
      </header>

      <section className={styles.toolbar}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari materi..."
          className={styles.search}
        />
      </section>

      {loading && <p className={styles.message}>Memuat materi...</p>}

      {!loading && error && <p className={styles.error}>{error}</p>}

      {!loading && !error && filteredMateri.length === 0 && (
        <section className={styles.empty}>
          <h2>Belum ada materi</h2>
          <p>Buat materi pertama untuk kelas Anda.</p>
          <Link href="/guru/materi/buat" className={shared.primary}>
            Buat Materi
          </Link>
        </section>
      )}

      {!loading && !error && filteredMateri.length > 0 && (
        <section className={styles.grid}>
          {filteredMateri.map((item) => {
            const title = item.judul ?? item.title ?? "Materi tanpa judul";
            const description =
              item.deskripsi ?? item.description ?? item.isi ?? "";

            return (
              <article key={item.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.badge}>
                    {getName(item.mapel)}
                  </span>

                  {item.createdAt && (
                    <time>
                      {new Date(item.createdAt).toLocaleDateString("id-ID")}
                    </time>
                  )}
                </div>

                <h2>{title}</h2>

                <p className={styles.description}>
                  {description || "Tidak ada deskripsi materi."}
                </p>

                <div className={styles.cardFooter}>
                  <span>{getName(item.kelas)}</span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
