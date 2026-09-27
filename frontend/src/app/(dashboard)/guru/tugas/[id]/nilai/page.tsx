"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  guruApi,
  errorMessage,
  formatDateTime,
  safeResourceUrl,
  type GradeUpdate,
  type Submission,
  type SubmissionsResponse,
} from "@/lib/guruApi";

import shared from "../../../guru-shared.module.css";
import styles from "./nilai.module.css";

interface SubmissionCardProps {
  submission: Submission;
  deadline: string;
  onSaved: (updated: GradeUpdate) => void;
}

function SubmissionCard({
  submission,
  deadline,
  onSaved,
}: SubmissionCardProps) {
  const [nilai, setNilai] = useState(
    submission.nilai === null ? "" : String(submission.nilai),
  );
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const lock = useRef(false);

  const url = safeResourceUrl(submission.fileUrl);
  const late =
    new Date(submission.createdAt).getTime() >
    new Date(deadline).getTime();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (lock.current) return;

    setError("");
    setSuccess("");

    const numericGrade = Number(nilai);

    if (
      nilai.trim() === "" ||
      !Number.isFinite(numericGrade) ||
      numericGrade < 0 ||
      numericGrade > 100
    ) {
      setError("Nilai harus berupa angka antara 0–100.");
      return;
    }

    lock.current = true;
    setSaving(true);

    try {
      const result = await guruApi.grade(submission.id, {
        nilai: numericGrade,
        feedback: feedback.trim(),
        updatedAt: submission.updatedAt,
      });

      onSaved(result.updated);
      setSuccess("Nilai berhasil disimpan.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return (
    <article className={styles.submission}>
      <div className={styles.studentHeader}>
        <div className={styles.avatar} aria-hidden="true">
          {submission.siswa.name.trim().charAt(0).toUpperCase() || "M"}
        </div>

        <div className={styles.studentInfo}>
          <h2>{submission.siswa.name}</h2>
          <p>NIS: {submission.siswa.nis || "—"}</p>
        </div>

        <span className={shared.badge}>
          {submission.nilai === null
            ? "Belum dinilai"
            : `Nilai: ${submission.nilai}`}
        </span>
      </div>

      <div className={styles.submissionMeta}>
        <p>
          Dikumpulkan: {formatDateTime(submission.createdAt)}
        </p>
        {late && <span className={styles.late}>Terlambat</span>}
      </div>

      <div className={styles.answer}>
        <h3>Jawaban murid</h3>
        <p>{submission.catatan || "Tidak ada catatan tambahan."}</p>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={shared.secondary}
          >
            Buka hasil pengumpulan ↗
          </a>
        ) : (
          <span className={shared.muted}>
            {submission.fileUrl
              ? "Tautan tidak valid."
              : "Tidak ada tautan pengumpulan."}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <p className={shared.error} role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className={shared.success} role="status">
            {success}
          </p>
        )}

        <fieldset className={shared.fieldset} disabled={saving}>
          <div className={styles.gradeGrid}>
            <label className={shared.field}>
              Nilai
              <input
                className={shared.input}
                type="number"
                min={0}
                max={100}
                step="any"
                required
                value={nilai}
                placeholder="0–100"
                onChange={(event) => {
                  setNilai(event.target.value);
                  setSuccess("");
                }}
              />
            </label>

            <label className={shared.field}>
              Umpan balik — opsional
              <textarea
                className={`${shared.textarea} ${styles.feedback}`}
                value={feedback}
                maxLength={5000}
                placeholder="Berikan masukan untuk murid…"
                onChange={(event) => {
                  setFeedback(event.target.value);
                  setSuccess("");
                }}
              />
            </label>
          </div>

          <div className={styles.cardFooter}>
            <span className={shared.hint}>
              {submission.gradedAt
                ? `Dinilai: ${formatDateTime(submission.gradedAt)}`
                : "Nilai belum disimpan."}
            </span>

            <button type="submit" className={shared.button}>
              {saving ? "Menyimpan…" : "Simpan nilai"}
            </button>
          </div>
        </fieldset>
      </form>
    </article>
  );
}

export default function GuruNilaiPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<SubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setData(null);
    setLoading(true);
    setError("");

    guruApi
      .submissions(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id, attempt]);

  function updateSubmission(updated: GradeUpdate) {
    setData((current) =>
      current
        ? {
            ...current,
            submissions: current.submissions.map((submission) =>
              submission.id === updated.id
                ? { ...submission, ...updated }
                : submission,
            ),
          }
        : current,
    );
  }

  const query = search.trim().toLocaleLowerCase("id-ID");

  const filtered = data?.submissions.filter((submission) => {
    const searchable =
      `${submission.siswa.name} ${submission.siswa.nis ?? ""}`.toLocaleLowerCase(
        "id-ID",
      );

    return searchable.includes(query);
  });

  const gradedCount =
    data?.submissions.filter((submission) => submission.nilai !== null)
      .length ?? 0;

  return (
    <main className={shared.page}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Tugas / Penilaian</p>
          <h1 className={shared.title}>Penilaian Tugas</h1>
          <p className={shared.subtitle}>
            Tinjau pengumpulan murid dan berikan umpan balik.
          </p>
        </div>

        <Link href="/guru" className={shared.secondary}>
          ← Dashboard
        </Link>
      </header>

      {loading ? (
        <div className={shared.empty} role="status">
          Memuat pengumpulan…
        </div>
      ) : error || !data ? (
        <>
          <p className={shared.error} role="alert">
            {error || "Tugas tidak tersedia."}
          </p>
          <button
            className={shared.button}
            onClick={() => setAttempt((value) => value + 1)}
          >
            Coba lagi
          </button>
        </>
      ) : (
        <>
          <section className={`${shared.panel} ${styles.assignment}`}>
            <span className={shared.badge}>
              {data.tugas.kelas.nama} · {data.tugas.mapel.nama}
            </span>

            <h2>{data.tugas.judul}</h2>
            <p className={styles.description}>
              {data.tugas.deskripsi || "Tidak ada deskripsi."}
            </p>

            <p className={shared.muted}>
              Tenggat: {formatDateTime(data.tugas.deadline)}
            </p>

            <div className={styles.counts}>
              <span>{data.submissions.length} pengumpulan</span>
              <span>{gradedCount} sudah dinilai</span>
              <span>
                {data.submissions.length - gradedCount} belum dinilai
              </span>
            </div>
          </section>

          <div className={styles.toolbar}>
            <label className={shared.field}>
              Cari murid
              <input
                type="search"
                className={shared.input}
                value={search}
                placeholder="Nama atau NIS…"
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <button
              className={shared.secondary}
              onClick={() => {
                if (
                  window.confirm(
                    "Muat ulang pengumpulan? Nilai yang belum disimpan akan dibuang.",
                  )
                ) {
                  setAttempt((value) => value + 1);
                }
              }}
            >
              Muat ulang
            </button>
          </div>

          {filtered?.length === 0 ? (
            <div className={shared.empty}>
              {data.submissions.length === 0
                ? "Belum ada murid yang mengumpulkan tugas."
                : "Tidak ada murid yang sesuai dengan pencarian."}
            </div>
          ) : (
            <div className={styles.list}>
              {data.submissions.map((submission) => (
                <div
                  key={submission.id}
                  hidden={
                    !filtered?.some((item) => item.id === submission.id)
                  }
                >
                  <SubmissionCard
                    submission={submission}
                    deadline={data.tugas.deadline}
                    onSaved={updateSubmission}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
