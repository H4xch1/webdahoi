"use client";

import { useEffect, useState } from "react";
import { adminApi, type Jurusan, type Role } from "@/lib/adminApi";
import styles from "./RegisterForm.module.css";

type Props = {
  roles: Role[];
  withJurusan?: boolean;
  onCreated: () => void;
};

export default function RegisterForm({ roles, withJurusan = false, onCreated }: Props) {
  const [nik, setNik] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(roles[0]);
  const [jurusanId, setJurusanId] = useState("");
  const [jurusan, setJurusan] = useState<Jurusan[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (withJurusan) adminApi.listJurusan().then(setJurusan).catch(() => {});
  }, [withJurusan]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminApi.createUser({ nik, name, password, role });
      setNik("");
      setName("");
      setPassword("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftarkan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.label}>
        NIK
        <input className={styles.input} value={nik} onChange={(e) => setNik(e.target.value)} required />
      </label>

      <label className={styles.label}>
        Nama Lengkap
        <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} required />
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

      <label className={styles.label}>
        Pilih Role
        <select className={styles.input} value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

      {withJurusan && (
        <label className={styles.label}>
          Pilih Jurusan
          <select className={styles.input} value={jurusanId} onChange={(e) => setJurusanId(e.target.value)}>
            <option value="">—</option>
            {jurusan.map((j) => (
              <option key={j.id} value={j.id}>{j.nama}</option>
            ))}
          </select>
        </label>
      )}

      {error && <p className={styles.error}>{error}</p>}

      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : "Register"}
      </button>
    </form>
  );
}
