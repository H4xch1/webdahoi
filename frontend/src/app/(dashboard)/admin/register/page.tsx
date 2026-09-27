"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import styles from "./page.module.css";

type Role =
  | "MURID"
  | "GURU"
  | "KEPSEK"
  | "KURIKULUM"
  | "ADMIN_UTAMA";

type Kelas = {
  id: string;
  nama: string;
  jurusanId: string;
  jurusan?: {
    id: string;
    nama: string;
  };
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "MURID", label: "Murid" },
  { value: "GURU", label: "Guru" },
  { value: "KEPSEK", label: "Kepala Sekolah" },
  { value: "KURIKULUM", label: "Kurikulum" },
  { value: "ADMIN_UTAMA", label: "Admin Utama" },
];

const REDIRECT_BY_ROLE: Record<Role, string> = {
  MURID: "/admin/murid",
  GURU: "/admin/guru",
  KEPSEK: "/admin/admin",
  KURIKULUM: "/admin/admin",
  ADMIN_UTAMA: "/admin/admin",
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function RegisterPage() {
  const router = useRouter();
  const submittingRef = useRef(false);

  const [role, setRole] = useState<Role>("MURID");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [kelasLoading, setKelasLoading] = useState(true);
  const [kelasError, setKelasError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;

    async function loadKelas() {
      setKelasLoading(true);
      setKelasError(null);

      try {
        const result = await adminApi.listKelas();

        if (active) {
          setKelasList(result);
        }
      } catch (err) {
        if (active) {
          setKelasList([]);
          setKelasError(
            errorMessage(err, "Gagal memuat daftar kelas.")
          );
        }
      } finally {
        if (active) {
          setKelasLoading(false);
        }
      }
    }

    void loadKelas();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    setSelectedKelasIds([]);
    setError(null);
  }

  function toggleKelas(id: string) {
    setSelectedKelasIds((current) =>
      current.includes(id)
        ? current.filter((kelasId) => kelasId !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    const data = new FormData(event.currentTarget);
    const nama = String(data.get("nama") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const nik = String(data.get("nik") ?? "").trim();
    const nis = String(data.get("nis") ?? "").trim();
    const nip = String(data.get("nip") ?? "").trim();
    const kelasId = String(data.get("kelasId") ?? "").trim();

    // Do not trim passwords.
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    setError(null);

    if (!nama) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    const payload: Record<string, unknown> = {
      nama,
      role,
      password,
      ...(email ? { email } : {}),
      ...(nik ? { nik } : {}),
      ...(role === "MURID"
        ? {
            ...(nis ? { nis } : {}),
            ...(kelasId ? { kelasId } : {}),
          }
        : {
            ...(nip ? { nip } : {}),
          }),
      ...(role === "GURU"
        ? { kelasIds: selectedKelasIds }
        : {}),
    };

    submittingRef.current = true;
    setSaving(true);

    try {
      await adminApi.createUser(payload);
    } catch (err) {
      setError(errorMessage(err, "Registrasi gagal. Silakan coba lagi."));
      submittingRef.current = false;
      setSaving(false);
      return;
    }

    // Keep submission locked while navigating after success.
    router.push(REDIRECT_BY_ROLE[role]);
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1>Register Pengguna</h1>
          <p>
            Buat akun baru dan tentukan role pengguna.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset className={styles.formFields} disabled={saving}>
            <div className={styles.field}>
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(event) =>
                  changeRole(event.target.value as Role)
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="nama">Nama Lengkap</label>
                <input
                  id="nama"
                  name="nama"
                  autoComplete="name"
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email (opsional)</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@sekolah.sch.id"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="nik">NIK (opsional)</label>
                <input
                  id="nik"
                  name="nik"
                  inputMode="numeric"
                  placeholder="Nomor Induk Kependudukan"
                />
              </div>

              {role === "MURID" ? (
                <div className={styles.field} key="nis">
                  <label htmlFor="nis">NIS</label>
                  <input
                    id="nis"
                    name="nis"
                    inputMode="numeric"
                    placeholder="Nomor Induk Siswa"
                    required
                  />
                </div>
              ) : (
                <div className={styles.field} key="nip">
                  <label htmlFor="nip">NIP (opsional)</label>
                  <input
                    id="nip"
                    name="nip"
                    inputMode="numeric"
                    placeholder="Nomor Induk Pegawai"
                  />
                </div>
              )}
            </div>

            {role === "MURID" && (
              <div className={styles.field}>
                <label htmlFor="kelasId">Kelas (opsional)</label>
                <input
                  id="kelasId"
                  name="kelasId"
                  placeholder="Masukkan ID kelas"
                />
              </div>
            )}

            {role === "GURU" && (
              <fieldset className={styles.classSection}>
                <legend>Kelas yang Diajar</legend>

                <p className={styles.hint}>
                  Pilih satu atau beberapa kelas. Boleh dikosongkan
                  jika belum ada penugasan.
                </p>

                {kelasLoading ? (
                  <p role="status" className={styles.hint}>
                    Memuat daftar kelas...
                  </p>
                ) : kelasError ? (
                  <div role="alert" className={styles.error}>
                    <p>{kelasError}</p>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setReloadKey((value) => value + 1)}
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : kelasList.length === 0 ? (
                  <p className={styles.hint}>
                    Belum ada kelas. Tambahkan kelas melalui halaman
                    pengelolaan kelas.
                  </p>
                ) : (
                  <>
                    <div className={styles.classList}>
                      {kelasList.map((kelas) => (
                        <label
                          key={kelas.id}
                          className={styles.classOption}
                        >
                          <input
                            type="checkbox"
                            name="kelasIds"
                            value={kelas.id}
                            checked={selectedKelasIds.includes(kelas.id)}
                            onChange={() => toggleKelas(kelas.id)}
                          />

                          <span>
                            <strong>{kelas.nama}</strong>
                            {kelas.jurusan && (
                              <small>{kelas.jurusan.nama}</small>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>

                    <p className={styles.hint} aria-live="polite">
                      {selectedKelasIds.length} kelas dipilih.
                    </p>
                  </>
                )}
              </fieldset>
            )}

            <div className={styles.grid}>
              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password akun"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  required
                />
              </div>
            </div>

            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => router.back()}
              >
                Batal
              </button>

              <button
                type="submit"
                className={styles.primaryButton}
                disabled={
                  saving ||
                  (role === "GURU" &&
                    (kelasLoading || Boolean(kelasError)))
                }
              >
                {saving ? "Menyimpan..." : "Daftarkan Pengguna"}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
