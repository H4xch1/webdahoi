"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  muridLearningApi, learningDate, learningError,
  type Choice, type ExamDetail,
} from "@/lib/muridLearningApi";
import styles from "../../learning.module.css";

const choices = ["A", "B", "C", "D"] as const;

export default function MuridExamPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ExamDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, Choice>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draftNotice, setDraftNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [now, setNow] = useState(0);
  const [offset, setOffset] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(null);
    setAnswers({});
    setError("");
    setDraftNotice("");
    muridLearningApi.exam(id, controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      const localNow = Date.now();
      const delta = new Date(result.serverNow).getTime() - localNow;
      setOffset(delta);
      setNow(localNow + delta);
      const restored: Record<string, Choice> = {};
      if (result.state === "OPEN") {
        try {
          const raw = localStorage.getItem(`webdahoi:exam:${result.studentId}:${id}`);
          const parsed: unknown = raw ? JSON.parse(raw) : null;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            for (const question of result.questions) {
              const value = (parsed as Record<string, unknown>)[question.id];
              if (value === "A" || value === "B" || value === "C" || value === "D") {
                restored[question.id] = value;
              }
            }
          }
        } catch {
          setDraftNotice("Penyimpanan lokal tidak tersedia. Jangan tutup halaman sebelum mengumpulkan.");
        }
      }
      setAnswers(restored);
      setData(result);
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(learningError(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [id, reload]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now() + offset), 1000);
    return () => window.clearInterval(timer);
  }, [offset]);

  const isCurrent = data?.exam.id === id;
  const isOpen = Boolean(isCurrent && data?.state === "OPEN" && data.endsAt &&
    now < new Date(data.endsAt).getTime());

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!isOpen || Object.keys(answers).length === 0) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isOpen, answers]);

  function selectAnswer(questionId: string, value: Choice) {
    if (!data || !isOpen || saving) return;
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    try {
      localStorage.setItem(`webdahoi:exam:${data.studentId}:${id}`, JSON.stringify(next));
    } catch {
      setDraftNotice("Draft tidak dapat disimpan di perangkat. Jangan tutup halaman sebelum mengumpulkan.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !isOpen || !data) return;
    const unanswered = data.questions.length - Object.keys(answers).length;
    if (!window.confirm(unanswered > 0
      ? `${unanswered} soal belum dijawab dan akan bernilai 0. Kumpulkan sekarang?`
      : "Kumpulkan jawaban? Jawaban tidak dapat diubah setelah dikumpulkan.")) return;
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await muridLearningApi.submit(id, Object.entries(answers)
        .map(([soalId, pilihan]) => ({ soalId, pilihan })));
      setData((current) => current ? {
        ...current, state: "COMPLETED", result: result.result, questions: [],
      } : current);
      try { localStorage.removeItem(`webdahoi:exam:${data.studentId}:${id}`); } catch { /* Optional storage. */ }
    } catch (err: unknown) {
      setError(learningError(err));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  const seconds = data?.endsAt ? Math.max(0, Math.ceil((new Date(data.endsAt).getTime() - now) / 1000)) : 0;
  const timeLeft = `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${Math.floor(seconds / 60 % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return <main className={styles.page} aria-busy={loading || saving}>
    <header className={styles.hero}>
      <div><p className={styles.eyebrow}>Ruang Murid / Ujian</p><h1>{data?.exam.judul ?? "Detail Ujian"}</h1></div>
      <Link href="/murid/ujian" className={styles.secondary} onClick={(event) => {
        if (saving || (isOpen && !window.confirm("Kembali ke daftar? Draft hanya tersimpan di perangkat ini, bukan di server."))) {
          event.preventDefault();
        }
      }}>Daftar ujian</Link>
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <p className={styles.empty} role="status">Memuat ujian...</p> : !data ?
      <button className={styles.primary} onClick={() => setReload((v) => v + 1)}>Coba lagi</button> : <>
      <section className={styles.panel}>
        <div className={styles.badges}><span className={styles.badge}>{data.exam.mapel.nama}</span>
          <span className={styles.badge}>{data.exam.kelas.nama}</span></div>
        <p className={styles.prose}>{data.exam.deskripsi || "Tidak ada deskripsi."}</p>
        <p className={styles.muted}>Guru: {data.exam.createdBy.name}</p>
        <p className={styles.muted}>Mulai: {learningDate(data.exam.tanggal)}</p>
        <p className={styles.muted}>Berakhir: {data.endsAt ? learningDate(data.endsAt) : "Belum ditentukan"}</p>
        <p className={styles.muted}>{data.exam.questionCount} soal · {data.exam.durasiMenit ?? "—"} menit</p>
        <p className={styles.notice}>Waktu ujian mengikuti jadwal bersama, bukan dihitung sejak halaman dibuka.
          Kumpulkan sebelum batas waktu. Draft lokal bukan pengumpulan dan halaman ini tidak mengumpulkan otomatis.</p>
      </section>

      {data.state === "COMPLETED" && data.result ? <section className={styles.result}>
        <p className={styles.eyebrow}>Ujian selesai</p><h2>Nilai Anda</h2>
        <p className={styles.score}>{data.result.nilai}<small> / 100</small></p>
        <p>Dikumpulkan: {learningDate(data.result.createdAt)}</p>
        <p>Jawaban sudah terkunci.</p>
      </section> : data.state === "UPCOMING" ? <section className={styles.empty}>
        <h2>Ujian belum dimulai</h2><p>Soal tersedia setelah jadwal dimulai.</p>
        <button className={styles.primary} onClick={() => setReload((v) => v + 1)}>Periksa jadwal</button>
      </section> : data.state === "UNAVAILABLE" ? <section className={styles.empty}>
        <h2>Ujian belum siap</h2><p>Durasi atau soal belum lengkap. Hubungi guru.</p>
      </section> : !isOpen ? <section className={styles.empty}>
        <h2>Waktu ujian telah berakhir</h2><p>Jawaban yang belum dikumpulkan tidak tersimpan sebagai hasil ujian.</p>
        <button className={styles.secondary} onClick={() => setReload((v) => v + 1)}>Periksa hasil di server</button>
      </section> : <form onSubmit={submit} className={styles.examForm}>
        <aside className={styles.timer} aria-label="Informasi waktu dan jawaban">
          <span>Sisa waktu <strong>{timeLeft}</strong></span>
          <span>{Object.keys(answers).length} / {data.questions.length} dijawab</span>
        </aside>
        {draftNotice && <p className={styles.notice} role="status">{draftNotice}</p>}
        <p className={styles.muted}>Draft disimpan pada browser ini bila penyimpanan tersedia. Soal kosong bernilai 0.</p>
        {data.questions.map((question, index) => <fieldset key={question.id} className={styles.question} disabled={saving}>
          <legend>Soal {index + 1} · Bobot {question.bobot}</legend>
          <p className={styles.prose}>{question.pertanyaan}</p>
          {choices.map((choice) => <label key={choice} className={styles.option}>
            <input type="radio" name={`soal-${question.id}`} value={choice}
              checked={answers[question.id] === choice} onChange={() => selectAnswer(question.id, choice)} />
            <span><strong>{choice}.</strong> {question[`opsi${choice}`]}</span>
          </label>)}
        </fieldset>)}
        <button type="submit" className={styles.primary} disabled={saving || !isOpen}>
          {saving ? "Mengumpulkan..." : "Kumpulkan jawaban"}
        </button>
      </form>}
    </>}
  </main>;
}
