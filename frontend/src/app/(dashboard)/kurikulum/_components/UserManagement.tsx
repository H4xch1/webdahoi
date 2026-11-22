"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  kurikulumApi, managementError, type ManagedRole, type ManagedUser,
  type ManagementOptions, type UserList,
} from "@/lib/kurikulumApi";
import styles from "../management.module.css";

export default function UserManagement({ role }: { role: ManagedRole }) {
  const label = role === "GURU" ? "Guru" : "Siswa";
  const base = role === "GURU" ? "/kurikulum/guru" : "/kurikulum/siswa";
  const [data, setData] = useState<UserList | null>(null);
  const [options, setOptions] = useState<ManagementOptions | null>(null);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const deleteLock = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setData(null);
    Promise.all([
      kurikulumApi.list(role, page, search, kelasId, controller.signal),
      kurikulumApi.options(controller.signal),
    ]).then(([list, opts]) => {
      if (!controller.signal.aborted) { setData(list); setOptions(opts); }
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) setError(managementError(err));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [role, page, search, kelasId, reload]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPage(1); setSearch(input.trim()); setReload((v) => v + 1);
  }
  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteTarget || confirmation !== "DELETE" || deleteLock.current) return;
    deleteLock.current = true; setDeleting(true); setError(""); setSuccess("");
    try {
      const result = await kurikulumApi.remove(deleteTarget);
      setDeleteTarget(null); setConfirmation(""); setSuccess(result.message);
      if (data?.users.length === 1 && page > 1) setPage((v) => v - 1);
      else setReload((v) => v + 1);
    } catch (err: unknown) { setError(managementError(err)); }
    finally { deleteLock.current = false; setDeleting(false); }
  }
  return <main className={styles.page} aria-busy={loading || deleting}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Ruang Kurikulum / Akun</p><h1>Kelola {label}</h1>
        <p className={styles.muted}>Identitas dan {role === "GURU" ? "penugasan mengajar" : "penempatan kelas"}.</p></div>
      <div className={styles.actions}><Link href="/kurikulum" className={styles.secondary}>Dashboard</Link>
        <Link href={`${base}/buat`} className={styles.primary}>+ Tambah {label}</Link></div>
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {success && <p className={styles.success} role="status">{success}</p>}
    {deleteTarget && <section className={styles.deletePanel} aria-labelledby="delete-title">
      <h2 id="delete-title">Hapus akun {deleteTarget.name}?</h2>
      <p>Email: {deleteTarget.email}. Tindakan ini tidak dapat dibatalkan.</p>
      <p>Akun yang memiliki riwayat akademik akan ditolak oleh server. Tidak ada penghapusan riwayat secara otomatis.</p>
      <form onSubmit={remove} className={styles.toolbar}>
        <label className={styles.field}>Ketik DELETE untuk mengonfirmasi
          <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" disabled={deleting} />
        </label>
        <button className={styles.danger} disabled={deleting || confirmation !== "DELETE"}>
          {deleting ? "Menghapus..." : "Hapus permanen"}</button>
        <button type="button" className={styles.secondary} disabled={deleting}
          onClick={() => { setDeleteTarget(null); setConfirmation(""); }}>Batal</button>
      </form>
    </section>}
    <section className={styles.panel}>
      <form className={styles.toolbar} onSubmit={submitSearch}>
        <label className={styles.field} htmlFor="user-search">Cari {label}
          <input id="user-search" type="search" maxLength={200} value={input}
            placeholder="Nama, email, NIK, NIS, NISN, atau NIP..." onChange={(e) => setInput(e.target.value)} />
        </label>
        <label className={styles.field} htmlFor="class-filter">Filter kelas
          <select id="class-filter" value={kelasId} disabled={deleting}
            onChange={(e) => { setKelasId(e.target.value); setPage(1); }}>
            <option value="">Semua kelas</option>
            {options?.kelas.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.nama} · {kelas.jurusan.nama}</option>)}
          </select>
        </label>
        <button className={styles.primary} disabled={loading || deleting}>Cari</button>
        <button type="button" className={styles.secondary} disabled={loading || deleting} onClick={() => {
          setInput(""); setSearch(""); setKelasId(""); setPage(1); setReload((v) => v + 1);
        }}>Reset</button>
        <button type="button" className={styles.secondary} disabled={loading || deleting}
          onClick={() => { setDeleteTarget(null); setReload((v) => v + 1); }}>Muat ulang</button>
      </form>
      <p className={styles.count} role="status">{loading ? "Memuat data..." : `${data?.pagination.total ?? 0} akun ditemukan`}</p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>Daftar akun {label}</caption>
          <thead><tr><th scope="col">Identitas</th><th scope="col">Nomor induk</th>
            <th scope="col">{role === "GURU" ? "Penugasan" : "Kelas"}</th><th scope="col">Aksi</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={4}>Memuat...</td></tr>
            : !data || data.users.length === 0 ? <tr><td colSpan={4}>{error ? "Data belum tersedia. Coba muat ulang." : "Tidak ada akun pada halaman ini."}</td></tr>
            : data.users.map((user) => <tr key={user.id}>
              <td><strong>{user.name}</strong><span className={styles.cellLine}>{user.email}</span>
                <span className={styles.cellLine}>NIK: {user.nik}</span></td>
              <td>{role === "GURU" ? <>NIP: {user.nip || "—"}</> : <>NIS: {user.nis || "—"}
                <span className={styles.cellLine}>NISN: {user.nisn || "—"}</span></>}</td>
              <td>{role === "GURU" ? <>
                <p className={styles.cellText}>{user.kelasDiajar.map((v) => v.nama).join(", ") || "Belum ada kelas"}</p>
                <span className={styles.cellLine}>{user.mapelDiajar.map((v) => v.nama).join(", ") || "Belum ada mata pelajaran"}</span>
              </> : user.kelas ? `${user.kelas.nama} · ${user.kelas.jurusan.nama}` : "Belum ditempatkan"}</td>
              <td><div className={styles.actions}>
                <Link className={styles.secondary} href={`${base}/${encodeURIComponent(user.id)}`}>Detail / Edit</Link>
                <button className={styles.danger} disabled={deleting} onClick={() => {
                  setError(""); setSuccess(""); setConfirmation(""); setDeleteTarget(user);
                  window.scrollTo({ top: 0, behavior: "auto" });
                }}>Hapus</button>
              </div></td>
            </tr>)}</tbody>
        </table>
      </div>
    </section>
    {data && <nav className={styles.actions} aria-label="Halaman akun">
      <button className={styles.secondary} disabled={loading || deleting || page <= 1} onClick={() => setPage((v) => v - 1)}>Sebelumnya</button>
      <span className={styles.muted}>Halaman {page} dari {data.pagination.totalPages}</span>
      <button className={styles.secondary} disabled={loading || deleting || page >= data.pagination.totalPages}
        onClick={() => setPage((v) => v + 1)}>Berikutnya</button>
    </nav>}
  </main>;
}
