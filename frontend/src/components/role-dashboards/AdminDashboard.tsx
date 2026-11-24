"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, School, ShieldCheck } from "lucide-react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { exportExcel } from "@/lib/exportExcel";
import { Card, Errors, Hero, Notice, Stats, message, styles } from "./DashboardKit";
export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [kelas, setKelas] = useState<number | null>(null);
  const [mapel, setMapel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setErrors([]);
    void Promise.allSettled([adminApi.listUsers(), adminApi.listKelas(), adminApi.listMapel()]).then(([u, k, m]) => {
      if (!active) return;
      setUsers(u.status === "fulfilled" ? u.value : null);
      setKelas(k.status === "fulfilled" ? k.value.length : null);
      setMapel(m.status === "fulfilled" ? m.value.length : null);
      const next: string[] = [];
      if (u.status === "rejected") next.push(`Akun: ${message(u.reason)}`);
      if (k.status === "rejected") next.push(`Kelas: ${message(k.reason)}`);
      if (m.status === "rejected") next.push(`Mapel: ${message(m.reason)}`);
      setErrors(next); setLoading(false);
    }); return () => { active = false; };
  }, [revision]);
  const count = (role: AdminUser["role"]) => users ? users.filter((u) => u.role === role).length : null;
  function download(role: AdminUser["role"], filename: string) {
    if (!users) return;
    exportExcel(filename, users.filter((u) => u.role === role).map((u) => ({ NIK: u.nik ?? u.nis ?? u.nip ?? "", Nama: u.name, Role: u.role })));
  }
  return <main className={styles.page} aria-busy={loading}>
    <Hero area="Ruang Administrator" title="Pusat kendali sekolah" description="Kelola akun dan struktur akademik melalui satu ruang kerja."
      loading={loading} refresh={() => setRevision((n) => n + 1)}><span className={styles.badge}>Administrasi sekolah</span></Hero>
    <Errors errors={errors} />
    <Stats loading={loading} items={[
      { label: "Akun dalam daftar", value: users?.length ?? null }, { label: "Guru", value: count("GURU") },
      { label: "Siswa", value: count("MURID") }, { label: "Admin", value: count("ADMIN_UTAMA") },
      { label: "Kelas", value: kelas }, { label: "Mata pelajaran", value: mapel },
    ]} />
    <section className={styles.grid} aria-label="Pengelolaan utama">
      <Card title="Data Guru" description="Perbarui identitas, kelas mengajar, dan penugasan mata pelajaran." href="/admin/guru" label="Kelola Guru" icon={<Users size={22} />}>
        <button className={styles.secondary} disabled={loading || !users} onClick={() => download("GURU", "data-guru")}>Export Excel</button></Card>
      <Card title="Data Siswa" description="Kelola akun siswa dan penempatan kelas." href="/admin/murid" label="Kelola Siswa" icon={<Users size={22} />}>
        <button className={styles.secondary} disabled={loading || !users} onClick={() => download("MURID", "data-siswa")}>Export Excel</button></Card>
      <Card title="Struktur akademik" description="Buka pengelolaan kelas, jurusan, dan mata pelajaran." href="/admin/akademik" label="Kelola Akademik" icon={<School size={22} />} />
    </section>
    <section className={styles.columns}>
      <article className={styles.panel}><h2>Akun dan kewenangan</h2><nav className={styles.shortcuts} aria-label="Pengelolaan staf">
        <Link href="/admin/admin">Administrator <span>{loading ? "—" : count("ADMIN_UTAMA") ?? "—"}</span></Link>
        <Link href="/admin/kepsek">Kepala Sekolah <span>{loading ? "—" : count("KEPSEK") ?? "—"}</span></Link>
        <Link href="/admin/kurikulum">Kurikulum <span>{loading ? "—" : count("KURIKULUM") ?? "—"}</span></Link>
      </nav><div className={styles.actions}><button className={styles.secondary} disabled={loading || !users} onClick={() => download("ADMIN_UTAMA", "data-admin")}>Export Admin</button></div></article>
      <Notice title="Administrasi tetap terjaga"><ShieldCheck size={24} aria-hidden="true" /><p>Ringkasan akun dihitung dari daftar yang dikembalikan API, bukan angka contoh. Data yang gagal dimuat ditandai “—”, bukan nol.</p>
        <p>Perubahan akun dan akademik tetap dilakukan melalui halaman pengelolaan yang sudah ada.</p></Notice>
    </section>
  </main>;
}
