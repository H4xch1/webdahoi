"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";

import {
  guruApi,
  errorMessage,
  type QuestionInput,
} from "@/lib/guruApi";

import {
  ClassSubjectFields,
  useGuruOptions,
} from "./GuruFields";

import shared from "../guru-shared.module.css";
import styles from "./CreateLearningForm.module.css";

type Kind = "materi" | "tugas" | "ujian";

interface Props {
  kind: Kind;
}

interface DraftQuestion {
  key: number;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  jawabanBenar: QuestionInput["jawabanBenar"];
  bobot: string;
}

function newQuestion(key: number): DraftQuestion {
  return {
    key,
    pertanyaan: "",
    opsiA: "",
    opsiB: "",
    opsiC: "",
    opsiD: "",
    jawabanBenar: "A",
    bobot: "1",
  };
}

const optionFields = [
  ["opsiA", "A"],
  ["opsiB", "B"],
  ["opsiC", "C"],
  ["opsiD", "D"],
] as const;

export default function CreateLearningForm({ kind }: Props) {
  const { options, loading, error: optionsError, retry } = useGuruOptions();

  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [schedule, setSchedule] = useState("");
  const [duration, setDuration] = useState("90");
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    newQuestion(0),
  ]);

  const nextQuestionKey = useRef(1);
  const saveLock = useRef(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");

  const selectedClass = options?.kelas.find(
    (kelas) => kelas.id === kelasId,
  );

  const validAssignment = Boolean(
    selectedClass?.mapel.some((mapel) => mapel.id === mapelId),
  );

  const totalWeight = questions.reduce(
    (sum, question) => sum + (Number(question.bobot) || 0),
    0,
  );

  function updateQuestion(
    key: number,
    patch: Partial<Omit<DraftQuestion, "key">>,
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.key === key ? { ...question, ...patch } : question,
      ),
    );
  }

  function resetForNext() {
    setCreatedId("");
    setError("");
    setJudul("");
    setDeskripsi("");
    setFileUrl("");
    setSchedule("");
    setDuration("90");
    setQuestions([newQuestion(nextQuestionKey.current++)]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saveLock.current || !validAssignment) return;

    saveLock.current = true;
    setSaving(true);
    setError("");

    try {
      const base = {
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        kelasId,
        mapelId,
      };

      if (!base.judul) {
        throw new Error("Judul wajib diisi.");
      }

      if (kind === "materi") {
        const result = await guruApi.createMateri({
          ...base,
          fileUrl: fileUrl.trim(),
        });

        setCreatedId(result.materi.id);
        return;
      }

      const date = new Date(schedule);

      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        throw new Error("Pilih tanggal dan waktu di masa depan.");
      }

      if (kind === "tugas") {
        const result = await guruApi.createTugas({
          ...base,
          deadline: date.toISOString(),
        });

        setCreatedId(result.tugas.id);
        return;
      }

      const durasiMenit = Number(duration);

      if (
        !Number.isInteger(durasiMenit) ||
        durasiMenit < 1 ||
        durasiMenit > 600
      ) {
        throw new Error("Durasi harus antara 1–600 menit.");
      }

      const soal: QuestionInput[] = questions.map((question, index) => {
        const bobot = Number(question.bobot);

        if (!Number.isInteger(bobot) || bobot < 1 || bobot > 100) {
          throw new Error(`Bobot soal ${index + 1} harus antara 1–100.`);
        }

        return {
          pertanyaan: question.pertanyaan.trim(),
          opsiA: question.opsiA.trim(),
          opsiB: question.opsiB.trim(),
          opsiC: question.opsiC.trim(),
          opsiD: question.opsiD.trim(),
          jawabanBenar: question.jawabanBenar,
          bobot,
        };
      });

      const result = await guruApi.createUjian({
        ...base,
        tanggal: date.toISOString(),
        durasiMenit,
        soal,
      });

      setCreatedId(result.ujian.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={shared.empty} role="status">
        Memuat kelas dan mata pelajaran…
      </div>
    );
  }

  if (optionsError || !options) {
    return (
      <>
        <p className={shared.error} role="alert">
          {optionsError || "Data kelas tidak tersedia."}
        </p>
        <button className={shared.button} onClick={retry}>
          Coba lagi
        </button>
      </>
    );
  }

  if (options.kelas.length === 0) {
    return (
      <div className={shared.empty}>
        Anda belum ditugaskan ke kelas mana pun. Hubungi admin
        sebelum membuat {kind}.
      </div>
    );
  }

  if (createdId) {
    return (
      <section className={shared.panel}>
        <p className={shared.success} role="status">
          {kind === "materi"
            ? "Materi"
            : kind === "tugas"
              ? "Tugas"
              : "Ujian"}{" "}
          berhasil diterbitkan.
        </p>

        <h2 className={shared.panelTitle}>{judul}</h2>

        <div className={shared.actions}>
          <Link href="/guru" className={shared.button}>
            Kembali ke dashboard
          </Link>

          {kind === "tugas" && (
            <Link
              href={`/guru/tugas/${createdId}/nilai`}
              className={shared.secondary}
            >
              Lihat pengumpulan
            </Link>
          )}

          <button
            type="button"
            className={shared.secondary}
            onClick={resetForNext}
          >
            Buat {kind} lagi
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <p className={shared.error} role="alert">
          {error}
        </p>
      )}

      <fieldset
        disabled={saving}
        className={shared.fieldset}
        aria-busy={saving}
      >
        <section className={shared.panel}>
          <div className={styles.sectionHeader}>
            <span className={styles.step}>01</span>
            <div>
              <h2 className={shared.panelTitle}>Informasi pembelajaran</h2>
              <p className={shared.hint}>
                Pilih kelas dan mata pelajaran yang Anda ampu.
              </p>
            </div>
          </div>

          <div className={shared.formGrid}>
            <ClassSubjectFields
              options={options}
              kelasId={kelasId}
              mapelId={mapelId}
              onClassChange={setKelasId}
              onSubjectChange={setMapelId}
            />

            <label className={`${shared.field} ${shared.full}`}>
              Judul
              <input
                className={shared.input}
                value={judul}
                maxLength={200}
                required
                placeholder={
                  kind === "materi"
                    ? "Contoh: Pengenalan Logaritma"
                    : kind === "tugas"
                      ? "Contoh: Latihan Persamaan Logaritma"
                      : "Contoh: Ujian Matematika Bab 1"
                }
                onChange={(event) => setJudul(event.target.value)}
              />
            </label>

            <label className={`${shared.field} ${shared.full}`}>
              {kind === "tugas" ? "Deskripsi dan instruksi" : "Deskripsi"}
              <textarea
                className={shared.textarea}
                value={deskripsi}
                maxLength={20000}
                placeholder="Tuliskan penjelasan untuk murid…"
                onChange={(event) => setDeskripsi(event.target.value)}
              />
            </label>

            {kind === "materi" && (
              <label className={`${shared.field} ${shared.full}`}>
                Tautan materi — opsional
                <input
                  className={shared.input}
                  type="url"
                  value={fileUrl}
                  maxLength={2048}
                  placeholder="https://..."
                  onChange={(event) => setFileUrl(event.target.value)}
                />
                <span className={shared.hint}>
                  Gunakan tautan dokumen, video, atau bahan belajar.
                  Pastikan murid memiliki izin untuk membukanya.
                </span>
              </label>
            )}

            {kind !== "materi" && (
              <label className={shared.field}>
                {kind === "tugas" ? "Tenggat pengumpulan" : "Jadwal ujian"}
                <input
                  className={shared.input}
                  type="datetime-local"
                  value={schedule}
                  required
                  onChange={(event) => setSchedule(event.target.value)}
                />
                <span className={shared.hint}>
                  Waktu mengikuti zona waktu perangkat Anda.
                </span>
              </label>
            )}

            {kind === "ujian" && (
              <label className={shared.field}>
                Durasi — menit
                <input
                  className={shared.input}
                  type="number"
                  min={1}
                  max={600}
                  step={1}
                  value={duration}
                  required
                  onChange={(event) => setDuration(event.target.value)}
                />
              </label>
            )}
          </div>
        </section>

        {kind === "ujian" && (
          <section className={`${shared.panel} ${styles.questionSection}`}>
            <div className={styles.questionHeading}>
              <div className={styles.sectionHeader}>
                <span className={styles.step}>02</span>
                <div>
                  <h2 className={shared.panelTitle}>Susun soal</h2>
                  <p className={shared.hint}>
                    {questions.length} soal · total bobot {totalWeight}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={shared.secondary}
                disabled={questions.length >= 100}
                onClick={() =>
                  setQuestions((current) => [
                    ...current,
                    newQuestion(nextQuestionKey.current++),
                  ])
                }
              >
                + Tambah soal
              </button>
            </div>

            <div className={styles.questions}>
              {questions.map((question, index) => (
                <article className={styles.question} key={question.key}>
                  <div className={styles.questionTop}>
                    <h3>Soal {index + 1}</h3>

                    <button
                      type="button"
                      className={shared.danger}
                      disabled={questions.length === 1}
                      aria-label={`Hapus soal ${index + 1}`}
                      onClick={() =>
                        setQuestions((current) =>
                          current.filter(
                            (item) => item.key !== question.key,
                          ),
                        )
                      }
                    >
                      Hapus
                    </button>
                  </div>

                  <div className={shared.formGrid}>
                    <label className={`${shared.field} ${shared.full}`}>
                      Pertanyaan
                      <textarea
                        className={shared.textarea}
                        value={question.pertanyaan}
                        required
                        maxLength={10000}
                        onChange={(event) =>
                          updateQuestion(question.key, {
                            pertanyaan: event.target.value,
                          })
                        }
                      />
                    </label>

                    {optionFields.map(([field, letter]) => (
                      <label className={shared.field} key={field}>
                        Pilihan {letter}
                        <input
                          className={shared.input}
                          value={question[field]}
                          required
                          maxLength={2000}
                          onChange={(event) =>
                            updateQuestion(question.key, {
                              [field]: event.target.value,
                            })
                          }
                        />
                      </label>
                    ))}

                    <label className={shared.field}>
                      Jawaban benar
                      <select
                        className={shared.select}
                        value={question.jawabanBenar}
                        onChange={(event) =>
                          updateQuestion(question.key, {
                            jawabanBenar: event.target
                              .value as QuestionInput["jawabanBenar"],
                          })
                        }
                      >
                        {(["A", "B", "C", "D"] as const).map((letter) => (
                          <option value={letter} key={letter}>
                            Pilihan {letter}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={shared.field}>
                      Bobot soal
                      <input
                        className={shared.input}
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        required
                        value={question.bobot}
                        onChange={(event) =>
                          updateQuestion(question.key, {
                            bobot: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </fieldset>

      <div className={styles.footer}>
        <p className={shared.hint}>
          Periksa kembali data sebelum menerbitkan.
          {kind === "ujian" && " Kunci jawaban wajib sesuai dengan soal."}
        </p>

        <div className={shared.actions}>
          {!saving && (
            <Link href="/guru" className={shared.secondary}>
              Batal
            </Link>
          )}

          <button
            type="submit"
            className={shared.button}
            disabled={saving || !validAssignment}
          >
            {saving ? "Menyimpan…" : `Terbitkan ${kind}`}
          </button>
        </div>
      </div>
    </form>
  );
}
