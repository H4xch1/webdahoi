"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, FileText, UserRound } from "lucide-react";
import { muridLearningApi, learningDate, type LearningList } from "@/lib/muridLearningApi";
import { Card, Errors, Hero, Notice, Stats, message, styles } from "./DashboardKit";
export default function StudentDashboard() {
  const [materi, setMateri] = useState<LearningList | null>(null);
  const [ujian, setUjian] = useState<LearningList | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setErrors([]);
    void Promise.allSettled([
      muridLearningApi.list("materi", 1, "", controller.signal),
      muridLearningApi.list("ujian", 1, "", controller.signal),
    ]).then(([m, u]) => {
      if (controller.signal.aborted) return;
      setMateri(m.status === "fulfilled" ? m.value : null);
      setUjian(u.status === "fulfilled" ? u.value : null);
      const next: string[] = [];
      if (m.status === "rejected") next.push(`Materi: ${message(m.reason)}`);
      if (u.status === "rejected") next.push(`Ujian: ${message(u.reason)}`);
      setErrors(next); setLoading(false);
    }); return () => controller.abort();
  }, [revision]);
  return <main className={styles.page} aria-busy={loading}>
    <Hero area="Ruang Siswa" title="Ruang belajar, langkah baru" description="Temukan materi kelas, buka tugas, dan persiapkan ujianmu."
      loading={loading} refresh={() => setRevision((n) => n + 1)}><Link className={styles.badge} href="/murid/profile"><UserRound size={14} /> Profil saya</Link></Hero>
    <Errors errors={errors} />
    <Stats loading={loading} items={[
      { label: "Materi tersedia", value: materi?.pagination.total ?? null, hint: "Sesuai akses akunmu" },
      { label: "Ujian dalam daftar", value: ujian?.pagination.total ?? null, hint: "Bukan jumlah ujian yang sedang dibuka" },
    ]} />
    <section className={styles.grid} aria-label="Menu belajar">
      <Card title="Perpustakaan Materi" description="Baca penjelasan dan akses lampiran yang dibagikan guru." href="/murid/materi" label="Buka Materi" icon={<BookOpen size={22} />} />
      <Card title="Ruang Tugas" description="Buka daftar tugas dan ikuti instruksi pengumpulan guru." href="/murid/tugas" label="Lihat Tugas" icon={<ClipboardList size={22} />} />
      <Card title="Ruang Ujian" description="Periksa jadwal dan ketentuan sebelum mulai mengerjakan." href="/murid/ujian" label="Lihat Ujian" icon={<FileText size={22} />} />
    </section>
    <section className={styles.columns}>
      <article className={styles.panel}><div className={styles.sectionHeading}><h2>Materi dari kelasmu</h2><Link href="/murid/materi">Lihat semua</Link></div>
        {loading ? <p role="status" className={styles.muted}>Memuat materi...</p> : !materi ? <p className={styles.muted}>Data belum tersedia. Coba muat ulang.</p>
          : materi.items.length === 0 ? <p className={styles.muted}>Belum ada materi yang dapat ditampilkan.</p> : <ul className={styles.list}>
            {materi.items.slice(0, 4).map((item) => <li key={item.id}><span className={styles.badge}>{item.mapel.nama}</span><h3>{item.judul}</h3>
              <p className={styles.muted}>{item.createdBy.name} · {item.kelas.nama}</p><Link href="/murid/materi">Buka daftar materi</Link></li>)}</ul>}
      </article>
      <article className={styles.panel}><div className={styles.sectionHeading}><h2>Jadwal dalam daftar ujian</h2><Link href="/murid/ujian">Lihat semua</Link></div>
        {loading ? <p role="status" className={styles.muted}>Memuat ujian...</p> : !ujian ? <p className={styles.muted}>Data belum tersedia. Coba muat ulang.</p>
          : ujian.items.length === 0 ? <p className={styles.muted}>Belum ada ujian yang dapat ditampilkan.</p> : <ul className={styles.list}>
            {ujian.items.slice(0, 4).map((item) => <li key={item.id}><span className={styles.badge}>{item.result ? "Hasil tersedia" : "Lihat ketentuan ujian"}</span>
              <h3>{item.judul}</h3><p className={styles.muted}>{item.tanggal ? learningDate(item.tanggal) : "Jadwal belum tersedia"} · {item.mapel.nama}</p>
              <Link href="/murid/ujian">Buka daftar ujian</Link></li>)}</ul>}
      </article>
    </section>
    <Notice title="Belajar dengan tenang"><p>Ringkasan menampilkan maksimal empat item dari halaman pertama setiap daftar. Buka daftar lengkap untuk melihat seluruh materi dan ujian.</p>
      <p>Dashboard tidak memulai ujian secara otomatis dan tidak mengubah jawaban atau pengumpulanmu.</p></Notice>
  </main>;
}
