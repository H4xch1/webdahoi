"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, BookOpen, ShieldCheck } from "lucide-react";
import { kurikulumApi, type Overview } from "@/lib/kurikulumApi";
import { Card, Errors, Hero, Notice, Stats, message, styles } from "./DashboardKit";
export default function CurriculumDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError("");
    kurikulumApi.overview(controller.signal).then((value) => {
      if (!controller.signal.aborted) setData(value);
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) { setData(null); setError(message(err)); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const c = data?.counts;
  return <main className={styles.page} aria-busy={loading}>
    <Hero area="Ruang Kurikulum" title="Akademik tertata, pembelajaran terpantau" description="Atur akun, penempatan kelas, dan penugasan guru tanpa kehilangan gambaran pembelajaran."
      loading={loading} refresh={() => setRevision((n) => n + 1)}><Link className={styles.badge} href="/kurikulum/monitoring">Buka Aktivitas Guru</Link></Hero>
    <Errors errors={error ? [error] : []} />
    <Stats loading={loading} items={[
      { label: "Guru", value: c?.guru ?? null }, { label: "Siswa", value: c?.siswa ?? null },
      { label: "Kelas tersedia", value: c?.kelas ?? null }, { label: "Mata pelajaran", value: c?.mapel ?? null },
      { label: "Siswa tanpa kelas", value: c?.tanpaKelas ?? null },
    ]} />
    {!loading && c && c.tanpaKelas > 0 && <p className={styles.attention}>Ada {c.tanpaKelas} siswa tanpa kelas. <Link href="/kurikulum/siswa">Periksa penempatan siswa</Link>.</p>}
    <section className={styles.grid} aria-label="Pengelolaan Kurikulum">
      <Card title="Data dan Penugasan Guru" description="Kelola identitas, NIP, kelas yang diajar, dan mata pelajaran guru." href="/kurikulum/guru" label="Kelola Guru" icon={<Users size={22} />}>
        <Link className={styles.secondary} href="/kurikulum/guru/buat">Tambah Guru</Link></Card>
      <Card title="Data dan Kelas Siswa" description="Perbarui identitas, NIS/NISN, dan penempatan kelas siswa." href="/kurikulum/siswa" label="Kelola Siswa" icon={<Users size={22} />}>
        <Link className={styles.secondary} href="/kurikulum/siswa/buat">Tambah Siswa</Link></Card>
      <Card title="Aktivitas Guru" description="Tinjau materi, tugas, ujian, dan pengumpulan melalui area pengawasan hanya-baca." href="/kurikulum/monitoring" label="Pantau Pembelajaran" icon={<BookOpen size={22} />} />
    </section>
    <Notice title="Batas kewenangan tetap sama"><ShieldCheck size={24} aria-hidden="true" /><p>Kurikulum mengelola akun Guru dan Siswa. Pembuatan kelas, jurusan, mata pelajaran, dan akun staf tetap berada di area Admin.</p>
      <p>Monitoring tidak masuk sebagai guru atau mengubah nilai. Akun dengan riwayat akademik tetap mengikuti perlindungan penghapusan yang sudah ada.</p></Notice>
  </main>;
}
