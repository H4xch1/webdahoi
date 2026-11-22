"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  errorMessage,
  formatDateTime,
  safeResourceUrl,
} from "@/lib/guruApi";

import shared from "../guru-shared.module.css";
import styles from "./page.module.css";

interface MateriItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  fileUrl: string | null;
  createdAt: string;

  kelas: {
    id: string;
    nama: string;
  };

  mapel: {
    id: string;
    nama: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface MateriResponse {
  materi: MateriItem[];
  pagination: Pagination;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasMessage(
  value: unknown,
): value is { message: string } {
  return (
    isRecord(value) &&
    typeof value.message === "string"
  );
}

function isNamedRelation(
  value: unknown,
): value is { id: string; nama: string } {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.nama === "string"
  );
}

function isMateriItem(value: unknown): value is MateriItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.judul === "string" &&
    (value.deskripsi === null ||
      typeof value.deskripsi === "string") &&
    (value.fileUrl === null ||
      typeof value.fileUrl === "string") &&
    typeof value.createdAt === "string" &&
    isNamedRelation(value.kelas) &&
    isNamedRelation(value.mapel)
  );
}

function isPagination(value: unknown): value is Pagination {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.page === "number" &&
    Number.isInteger(value.page) &&
    value.page >= 1 &&
    typeof value.limit === "number" &&
    Number.isInteger(value.limit) &&
    value.limit >= 1 &&
    typeof value.total === "number" &&
    Number.isInteger(value.total) &&
    value.total >= 0 &&
    typeof value.totalPages === "number" &&
    Number.isInteger(value.totalPages) &&
    value.totalPages >= 1
  );
}

function isMateriResponse(
  value: unknown,
): value is MateriResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.materi) &&
    value.materi.every(isMateriItem) &&
    isPagination(value.pagination)
  );
}

export default function MateriPage() {
  const [data, setData] = useState<MateriResponse | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setData(null);

    async function loadMateri() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "12",
        });

        if (search) {
          params.set("search", search);
        }

        const response = await fetch(
          `/backend-api/guru/materi?${params.toString()}`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",

            headers: {
              Accept: "application/json",
            },

            signal: controller.signal,
          },
        );

        const body: unknown = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          let fallback =
            `Gagal mengambil data materi (${response.status}).`;

          if (response.status === 401) {
            fallback =
              "Sesi berakhir. Silakan masuk kembali.";
          } else if (response.status === 403) {
            fallback =
              "Anda tidak memiliki izin untuk melihat materi ini.";
          } else if (response.status === 404) {
            fallback =
              "Endpoint daftar materi belum tersedia. Pastikan backend terbaru sudah dideploy.";
          } else if (response.status >= 500) {
            fallback =
              "Server mengalami gangguan. Silakan coba lagi.";
          }

          throw new Error(
            hasMessage(body) ? body.message : fallback,
          );
        }

        if (!isMateriResponse(body)) {
          throw new Error(
            "Format respons materi tidak sesuai. Pastikan frontend dan backend menggunakan pembaruan yang sama.",
          );
        }

        if (!controller.signal.aborted) {
          setData(body);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof TypeError
              ? "Tidak dapat terhubung ke server. Periksa koneksi internet dan coba lagi."
              : errorMessage(err),
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadMateri();

    return () => controller.abort();
  }, [page, search, attempt]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
    setAttempt((value) => value + 1);
  }

  function resetSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
    setAttempt((value) => value + 1);
  }

  const items = data?.materi ?? [];
  const pagination = data?.pagination;

  return (
    <main
      className={`${shared.page} ${styles.page}`}
      aria-busy={loading}
    >
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Pembelajaran</p>

          <h1 className={shared.title}>Materi</h1>

          <p className={shared.subtitle}>
            Kelola materi pembelajaran untuk kelas Anda.
          </p>
        </div>

        <div className={styles.actions}>
          <Link
            href="/guru"
            className={shared.secondary}
          >
            Kembali ke dashboard
          </Link>

          <Link
            href="/guru/materi/buat"
            className={shared.button}
          >
            + Buat Materi
          </Link>
        </div>
      </header>

      <section
        className={shared.panel}
        aria-label="Pencarian materi"
      >
        <form onSubmit={handleSearch}>
          <label
            className={shared.field}
            htmlFor="search-materi"
          >
            Cari materi

            <input
              id="search-materi"
              type="search"
              value={searchInput}
              maxLength={200}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Judul, deskripsi, kelas, atau mata pelajaran..."
              className={styles.search}
            />
          </label>

          <div className={shared.actions}>
            <button
              type="submit"
              className={shared.button}
              disabled={loading}
            >
              Cari
            </button>

            {(searchInput || search) && (
              <button
                type="button"
                className={shared.secondary}
                onClick={resetSearch}
                disabled={loading}
              >
                Reset
              </button>
            )}

            <button
              type="button"
              className={shared.secondary}
              onClick={() =>
                setAttempt((value) => value + 1)
              }
              disabled={loading}
            >
              {loading ? "Memuat..." : "Muat ulang"}
            </button>
          </div>
        </form>
      </section>

      {loading && (
        <p
          className={styles.message}
          role="status"
        >
          Memuat materi...
        </p>
      )}

      {!loading && error && (
        <section className={shared.panel}>
          <p
            className={styles.error}
            role="alert"
          >
            {error}
          </p>

          <div className={shared.actions}>
            <button
              type="button"
              className={shared.button}
              onClick={() =>
                setAttempt((value) => value + 1)
              }
            >
              Coba lagi
            </button>

            <Link
              href="/login"
              className={shared.secondary}
            >
              Masuk kembali
            </Link>
          </div>
        </section>
      )}

      {!loading && !error && data && (
        <>
          <p
            className={shared.hint}
            role="status"
          >
            {pagination?.total ?? 0} materi ditemukan
            {search ? ` untuk "${search}"` : ""}.
          </p>

          {items.length === 0 ? (
            <section className={styles.empty}>
              <h2>
                {search
                  ? "Materi tidak ditemukan"
                  : page > 1
                    ? "Halaman ini kosong"
                    : "Belum ada materi"}
              </h2>

              <p>
                {search
                  ? "Coba kata kunci lain atau reset pencarian."
                  : page > 1
                    ? "Kembali ke halaman pertama untuk melihat materi yang tersedia."
                    : "Buat materi pertama untuk kelas Anda."}
              </p>

              {search ? (
                <button
                  type="button"
                  className={shared.secondary}
                  onClick={resetSearch}
                >
                  Reset pencarian
                </button>
              ) : page > 1 ? (
                <button
                  type="button"
                  className={shared.secondary}
                  onClick={() => setPage(1)}
                >
                  Halaman pertama
                </button>
              ) : (
                <Link
                  href="/guru/materi/buat"
                  className={shared.button}
                >
                  Buat Materi
                </Link>
              )}
            </section>
          ) : (
            <section
              className={styles.grid}
              aria-label="Daftar materi"
            >
              {items.map((item) => {
                const resourceUrl = safeResourceUrl(
                  item.fileUrl,
                );

                return (
                  <article
                    key={item.id}
                    className={styles.card}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.badge}>
                        {item.mapel.nama}
                      </span>

                      <time dateTime={item.createdAt}>
                        {formatDateTime(item.createdAt)}
                      </time>
                    </div>

                    <h2>{item.judul}</h2>

                    <p className={styles.description}>
                      {item.deskripsi ||
                        "Tidak ada deskripsi materi."}
                    </p>

                    <div className={styles.cardFooter}>
                      <span>{item.kelas.nama}</span>

                      {resourceUrl ? (
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={shared.secondary}
                        >
                          Buka materi
                        </a>
                      ) : (
                        <span className={shared.hint}>
                          {item.fileUrl
                            ? "Tautan materi tidak valid."
                            : "Tanpa tautan lampiran."}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {pagination && (
            <nav
              className={shared.actions}
              aria-label="Halaman materi"
            >
              <button
                type="button"
                className={shared.secondary}
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
              >
                Sebelumnya
              </button>

              <span className={shared.hint}>
                Halaman {pagination.page} dari{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                className={shared.secondary}
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((current) => current + 1)
                }
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
