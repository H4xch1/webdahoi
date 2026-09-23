"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { adminApi, type Jurusan, type Kelas, type Role } from "@/lib/adminApi";
import styles from "./page.module.css";

const ROLES: Role[] = ["MURID", "GURU", "KEPSEK", "KURIKULUM", "ADMIN_UTAMA"];

const REDIRECT: Record<Role, string> = {
  MURID: "/admin/murid",
  GURU: "/admin/guru",
  KEPSEK: "/admin/kepsek",
  KURIKULUM: "/admin/kurikulum",
  ADMIN_UTAMA: "/admin",
};

function RegisterFormInner() {
  const router = useRouter();
  const params = useSearchParams();

  const initialRole = (params.get("role") as Role) ?? "MURID";

  const [role, setRole] = useState<Role>(
    ROLES.includes(initialRole) ? initialRole : "MURID"
  );
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [jurusanId, setJurusanId] = useState("");

  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isMurid = role === "MURID";

  useEffect(() => {
    if (!isMurid) return;
    adminApi.listJurusan().then(setJurusan).catch(() => {});
    adminApi.listKelas().then(setKelas).catch(() => {});
  }, [isMurid]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await adminApi.createUser({
        name,
        nik,
        email: email || null,
        password,
        role,
        kelasId: isMurid && kelasId ? kelasId : null,
      });

      setSuccess(`${name} berhasil didaftarkan.`);
      setNik("");
      setName("");
      setEmail("");
      setPassword("");
      setKelasId("");
      setJurusanId("");

      setTimeout(() => router.push(REDIRECT[role]), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftarkan pengguna");
    } finally {
      setLoading(false);
    }
  }

  const filteredKelas = jurusanId
    ? kelas.filter((k) => k.jurusanId === jurusanId)
    : kelas;

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Register Pengguna</h1>

      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label}>
          Pilih Role
          <select
            className={styles.input}
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.label}>
          NIK
          <input
            className={styles.input}
            value={nik}
            onChange={(e) => setNik(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Nama Lengkap
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Email (opsional)
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {isMurid && (
          <>
            <label className={styles.label}>
              Pilih Jurusan
              <select
                className={styles.input}
                value={jurusanId}
                onChange={(e) => {
                  setJurusanId(e.target.value);
                  setKelasId("");
                }}
              >
                <option value="">—</option>
                {jurusan.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.label}>
              Pilih Kelas
              <select
                className={styles.input}
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
              >
                <option value="">—</option>
                {filteredKelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <div className={styles.actions}>
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Register"}
          </button>
          <button
            className={styles.cancel}
            type="button"
            onClick={() => router.back()}
          >
            Batal
          </button>
        </div>
      </form>
    </main>
  );
}

export default function AdminRegisterPage() {
  return (
    <Suspense fallback={<p style={{ padding: 32 }}>Memuat...</p>}>
      <RegisterFormInner />
    </Suspense>
  );
}
