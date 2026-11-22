"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  kurikulumApi, managementError, managementDate, type ManagedRole,
  type ManagedUser, type UserInput, type ManagementOptions,
} from "@/lib/kurikulumApi";
import styles from "../management.module.css";

function blank(): UserInput {
  return { name: "", email: "", nik: "", nis: "", nisn: "", nip: "", avatarUrl: "", password: "",
    kelasId: null, kelasIds: [], mapelIds: [] };
}
function toInput(user: ManagedUser): UserInput {
  return { name: user.name, email: user.email, nik: user.nik, nis: user.nis ?? "", nisn: user.nisn ?? "",
    nip: user.nip ?? "", avatarUrl: user.avatarUrl ?? "", password: "", kelasId: user.kelasId,
    kelasIds: user.kelasDiajar.map((v) => v.id), mapelIds: user.mapelDiajar.map((v) => v.id) };
}
export default function UserForm({ role, userId }: { role: ManagedRole; userId?: string }) {
  const label = role === "GURU" ? "Guru" : "Siswa";
  const base = role === "GURU" ? "/kurikulum/guru" : "/kurikulum/siswa";
  const [options, setOptions] = useState<ManagementOptions | null>(null);
  const [existing, setExisting] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserInput>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<ManagedUser | null>(null);
  const [reload, setReload] = useState(0);
  const lock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setSaved(null); setExisting(null); setDirty(false);
    Promise.all([
      kurikulumApi.options(controller.signal),
      userId ? kurikulumApi.get(userId, controller.signal) : Promise.resolve(null),
    ]).then(([opts, result]) => {
      if (controller.signal.aborted) return;
      if (result && result.user.role !== role) throw new Error(`Akun ini bukan ${label}. Buka daftar yang sesuai.`);
      setOptions(opts); setExisting(result?.user ?? null); setForm(result ? toInput(result.user) : blank());
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(managementError(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [role, userId, label, reload]);

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault(); event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function patch<K extends keyof UserInput>(key: K, value: UserInput[K]) {
    setForm((current) => ({ ...current, [key]: value })); setDirty(true);
  }
  function toggle(key: "kelasIds" | "mapelIds", id: string, checked: boolean) {
    setForm((current) => ({ ...current, [key]: checked ? [...current[key], id] : current[key].filter((v) => v !== id) }));
    setDirty(true);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || !options || (userId && !existing)) return;
    if (form.password && (form.password.length < 8 || new TextEncoder().encode(form.password).length > 72)) {
      setError("Password minimal 8 karakter dan maksimal 72 byte."); return;
    }
    if (userId && !window.confirm(`Simpan perubahan akun ${label} ini? Perubahan kelas/penugasan memengaruhi akses pembelajaran.`)) return;
    lock.current = true; setSaving(true); setError("");
    try {
      const result = userId && existing
        ? await kurikulumApi.update(userId, form, existing.updatedAt)
        : await kurikulumApi.create(role, form);
      setSaved(result.user); setExisting(result.user); setForm(toInput(result.user)); setDirty(false);
    } catch (err: unknown) { setError(managementError(err)); }
    finally { lock.current = false; setSaving(false); }
  }

  const unavailable = role === "GURU" ? options?.kelas.filter((kelas) =>
    form.kelasIds.includes(kelas.id) && !kelas.mapel.some((mapel) => form.mapelIds.includes(mapel.id))) ?? [] : [];
  const staleClasses = form.kelasIds.filter((id) => !options?.kelas.some((k) => k.id === id));
  const staleSubjects = form.mapelIds.filter((id) => !options?.mapel.some((m) => m.id === id));

  return <main className={styles.page} aria-busy={loading || saving}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Ruang Kurikulum / {label}</p><h1>{userId ? "Detail / Edit" : "Tambah"} {label}</h1>
        <p className={styles.muted}>Role akun dikunci sebagai {label}; tidak dapat diubah melalui form ini.</p></div>
      <Link href={base} className={styles.secondary} onClick={(event) => {
        if (saving || (dirty && !window.confirm("Tinggalkan perubahan yang belum disimpan?"))) event.preventDefault();
      }}>Kembali ke daftar</Link>
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <p className={styles.empty} role="status">Memuat form...</p> : saved ?
      <section className={styles.panel}>
        <p className={styles.success} role="status">Akun {saved.name} berhasil {userId ? "diperbarui" : "dibuat"}.</p>
        <p className={styles.muted}>Email: {saved.email}. Role: {label}. Password tidak ditampilkan kembali.</p>
        <div className={styles.actions}><Link href={base} className={styles.primary}>Lihat daftar {label}</Link>
          <button className={styles.secondary} onClick={() => {
            if (userId) setSaved(null); else { setSaved(null); setForm(blank()); setExisting(null); }
          }}>{userId ? "Edit lagi" : `Tambah ${label} lagi`}</button></div>
      </section> : !options || (userId && !existing) ?
      <button className={styles.primary} onClick={() => setReload((v) => v + 1)}>Coba lagi</button>
      : <form onSubmit={submit} className={styles.form}>
        <fieldset className={styles.fieldset} disabled={saving}>
          <section className={styles.panel}>
            <h2>Identitas {label}</h2>
            {existing && <p className={styles.muted}>Dibuat {managementDate(existing.createdAt)} · Diperbarui {managementDate(existing.updatedAt)}</p>}
            <div className={styles.formGrid}>
              <label className={styles.field}>Nama lengkap
                <input required maxLength={150} value={form.name} onChange={(e) => patch("name", e.target.value)} autoComplete="name" />
              </label>
              <label className={styles.field}>Email
                <input type="email" required maxLength={254} value={form.email} onChange={(e) => patch("email", e.target.value)} autoComplete="email" />
              </label>
              <label className={styles.field}>NIK
                <input required inputMode="numeric" pattern="[0-9]+" maxLength={40} value={form.nik} onChange={(e) => patch("nik", e.target.value)} />
              </label>
              {role === "GURU" ? <label className={styles.field}>NIP
                <input required inputMode="numeric" pattern="[0-9]+" maxLength={40} value={form.nip} onChange={(e) => patch("nip", e.target.value)} />
              </label> : <>
                <label className={styles.field}>NIS
                  <input required inputMode="numeric" pattern="[0-9]+" maxLength={40} value={form.nis} onChange={(e) => patch("nis", e.target.value)} />
                </label>
                <label className={styles.field}>NISN (opsional, 10 digit)
                  <input inputMode="numeric" pattern="[0-9]{10}" maxLength={10} value={form.nisn} onChange={(e) => patch("nisn", e.target.value)} />
                </label>
              </>}
              <label className={styles.field}>Tautan avatar HTTPS (opsional)
                <input type="url" maxLength={2048} value={form.avatarUrl} onChange={(e) => patch("avatarUrl", e.target.value)} placeholder="https://..." />
              </label>
              <label className={styles.field}>{userId ? "Password baru (kosongkan untuk mempertahankan)" : "Password awal"}
                <input type="password" required={!userId} minLength={8} maxLength={128} autoComplete="new-password"
                  value={form.password} onChange={(e) => patch("password", e.target.value)} />
                <span className={styles.hint}>Minimal 8 karakter, maksimal 72 byte. Jangan bagikan melalui tautan publik.</span>
              </label>
            </div>
          </section>
          <section className={styles.panel}>
            <h2>{role === "GURU" ? "Penugasan mengajar" : "Penempatan kelas"}</h2>
            {role === "MURID" ? <>
              <label className={styles.field}>Kelas siswa
                <select value={form.kelasId ?? ""} onChange={(e) => patch("kelasId", e.target.value || null)}>
                  <option value="">Belum ditempatkan / lepas dari kelas</option>
                  {options.kelas.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama} · {kelas.jurusan.nama}</option>)}
                </select>
              </label>
              <p className={styles.notice}>Pemindahan kelas mengubah materi, tugas, dan ujian yang dapat diakses siswa.
                Riwayat akademik sebelumnya tidak dipindahkan atau dihapus otomatis.</p>
            </> : <>
              <p className={styles.muted}>Pilih beberapa kelas dan beberapa mata pelajaran. Pilihan kosong berarti belum ditugaskan.</p>
              <div className={styles.assignmentGrid}>
                <fieldset className={styles.selection}><legend>Kelas yang diajar ({form.kelasIds.length})</legend>
                  {options.kelas.length === 0 && <p className={styles.muted}>Admin belum menambahkan kelas.</p>}
                  {options.kelas.map((kelas) => <label className={styles.check} key={kelas.id}>
                    <input type="checkbox" checked={form.kelasIds.includes(kelas.id)} onChange={(e) => toggle("kelasIds", kelas.id, e.target.checked)} />
                    <span>{kelas.nama} · {kelas.jurusan.nama}<small>Mapel kelas: {kelas.mapel.map((m) => m.nama).join(", ") || "Belum diatur Admin"}</small></span>
                  </label>)}
                </fieldset>
                <fieldset className={styles.selection}><legend>Mata pelajaran ({form.mapelIds.length})</legend>
                  {options.mapel.length === 0 && <p className={styles.muted}>Admin belum menambahkan mata pelajaran.</p>}
                  {options.mapel.map((mapel) => <label className={styles.check} key={mapel.id}>
                    <input type="checkbox" checked={form.mapelIds.includes(mapel.id)} onChange={(e) => toggle("mapelIds", mapel.id, e.target.checked)} />
                    <span>{mapel.nama}</span>
                  </label>)}
                </fieldset>
              </div>
              {unavailable.length > 0 && <p className={styles.notice}>
                Kelas berikut belum memiliki irisan dengan mata pelajaran guru: {unavailable.map((k) => k.nama).join(", ")}.
                Penugasan dapat disimpan, tetapi guru belum dapat membuat pembelajaran pada kelas tersebut.
                Hubungi Admin bila relasi mata pelajaran kelas belum sesuai.
              </p>}
              {(staleClasses.length > 0 || staleSubjects.length > 0) && <p className={styles.error} role="alert">
                Opsi penugasan berubah. Muat ulang form sebelum menyimpan.
              </p>}
              <p className={styles.hint}>Form ini tidak mengubah daftar mata pelajaran milik kelas. Relasi kelas–mapel tetap dikelola Admin.</p>
            </>}
          </section>
        </fieldset>
        <div className={styles.actions}>
          <button className={styles.primary} type="submit" disabled={saving || staleClasses.length > 0 || staleSubjects.length > 0}>
            {saving ? "Menyimpan..." : userId ? "Simpan perubahan" : `Buat akun ${label}`}</button>
          <button type="button" className={styles.secondary} disabled={saving} onClick={() => {
            if (!dirty || window.confirm("Buang perubahan dan muat ulang data?")) setReload((v) => v + 1);
          }}>Muat ulang form</button>
        </div>
      </form>}
  </main>;
}
