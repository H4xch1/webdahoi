"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  errorMessage,
  formatDateTime,
  guruApi,
  safeResourceUrl,
  type SubmissionsResponse,
} from "@/lib/guruApi";
import styles from "../../guru-shared.module.css";

export default function GuruTugasDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<SubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    setData(null);

    async function load() {
      try {
        const result = await guruApi.submissions(id, controller.signal);

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
  }, [id, reload]);

  const gradedCount =
    data?.submissions.filter((submission) => submission.nilai !== null)
      .length ?? 0;

  const pendingCount = (data?.submissions.length ?? 0) - gradedCount;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Ruang Guru / Tugas</p>
          <h1 className={styles.title}>Detail Tugas</h1>
          <p className={styles.subtitle}>
            Informasi tugas dan hasil pengumpulan murid.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/guru/tugas" className={styles.secondary}>
            Kembali
          </Link>

          <button
            type="button"
            className={styles.secondary}
            disabled={loading}
            onClick={() => setReload((value) => value + 1)}
          >
            {loading ? "Memuat..." : "Muat Ulang"}
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.empty} role="status">
          Memuat detail tugas...
        </div>
      ) : error ? (
        <div className={styles.empty}>
          Detail tugas belum dapat ditampilkan. Tekan Muat Ulang untuk
          mencoba kembali.
        </div>
      ) : data ? (
        <div style={{ display: "grid", gap: 24 }}>
          <section
            className={styles.panel}
            aria-labelledby="tugas-detail-title"
          >
            <div className={styles.actions} style={{ marginBottom: 16 }}>
              <span className={styles.badge}>{data.tugas.kelas.nama}</span>
              <span className={styles.badge}>{data.tugas.mapel.nama}</span>
            </div>

            <h2 id="tugas-detail-title" className={styles.panelTitle}>
              {data.tugas.judul}
            </h2>

            <p
              className={styles.subtitle}
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {data.tugas.deskripsi || "Tidak ada deskripsi tugas."}
            </p>

            <hr className={styles.divider} />

            <div className={styles.formGrid}>
              <div>
                <h3 className={styles.panelTitle}>Batas Pengumpulan</h3>
                <p className={styles.hint}>
                  {formatDateTime(data.tugas.deadline)}
                </p>
              </div>

              <div>
                <h3 className={styles.panelTitle}>Ringkasan Pengumpulan</h3>
                <p className={styles.hint}>
                  {data.submissions.length} pengumpulan dimuat
                </p>
                <p className={styles.hint}>
                  {gradedCount} sudah dinilai · {pendingCount} belum dinilai
                </p>
              </div>
            </div>

            <div className={styles.actions} style={{ marginTop: 24 }}>
              <Link
                href={`/guru/tugas/${encodeURIComponent(id)}/nilai`}
                className={styles.button}
              >
                Buka Penilaian
              </Link>
            </div>
          </section>

          <section
            className={styles.panel}
            aria-labelledby="submissions-title"
          >
            <h2 id="submissions-title" className={styles.panelTitle}>
              Pengumpulan Murid
            </h2>

            <p className={styles.muted}>
              Daftar ini menampilkan pengumpulan yang dikembalikan oleh
              server, bukan daftar seluruh murid di kelas.
            </p>

            {data.submissions.length === 0 ? (
              <div className={styles.empty}>
                Belum ada pengumpulan untuk tugas ini.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {data.submissions.map((submission) => {
                  const resourceUrl = safeResourceUrl(submission.fileUrl);
                  const hasGrade = submission.nilai !== null;

                  const submittedTime = new Date(
                    submission.createdAt,
                  ).getTime();

                  const deadlineTime = new Date(
                    data.tugas.deadline,
                  ).getTime();

                  const isLate =
                    Number.isFinite(submittedTime) &&
                    Number.isFinite(deadlineTime) &&
                    submittedTime > deadlineTime;

                  return (
                    <article
                      key={submission.id}
                      className={styles.panel}
                    >
                      <div className={styles.header}>
                        <div>
                          <h3 className={styles.panelTitle}>
                            {submission.siswa.name}
                          </h3>
                          <p className={styles.hint}>
                            NIS: {submission.siswa.nis || "—"}
                          </p>
                        </div>

                        <div className={styles.actions}>
                          <span className={styles.badge}>
                            {hasGrade
                              ? `Nilai: ${submission.nilai}`
                              : "Belum dinilai"}
                          </span>

                          {isLate && (
                            <span className={styles.badge}>
                              Dikumpulkan setelah deadline
                            </span>
                          )}
                        </div>
                      </div>

                      <p className={styles.hint}>
                        Dikumpulkan:{" "}
                        {formatDateTime(submission.createdAt)}
                      </p>

                      <p className={styles.hint}>
                        Terakhir diperbarui:{" "}
                        {formatDateTime(submission.updatedAt)}
                      </p>

                      {submission.gradedAt && (
                        <p className={styles.hint}>
                          Dinilai: {formatDateTime(submission.gradedAt)}
                        </p>
                      )}

                      <hr className={styles.divider} />

                      <h3 className={styles.panelTitle}>Catatan Murid</h3>
                      <p
                        className={styles.muted}
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {submission.catatan || "Tidak ada catatan."}
                      </p>

                      {resourceUrl ? (
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.secondary}
                        >
                          Buka Berkas / Tautan
                        </a>
                      ) : (
                        <p className={styles.hint}>
                          {submission.fileUrl
                            ? "Tautan berkas tidak valid atau menggunakan protokol yang tidak didukung."
                            : "Tidak ada berkas atau tautan terlampir."}
                        </p>
                      )}

                      {submission.feedback && (
                        <>
                          <hr className={styles.divider} />

                          <h3 className={styles.panelTitle}>
                            Umpan Balik Guru
                          </h3>

                          <p
                            className={styles.muted}
                            style={{
                              whiteSpace: "pre-wrap",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {submission.feedback}
                          </p>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className={styles.empty}>
          Data tugas tidak tersedia.
        </div>
      )}
    </main>
  );
}
