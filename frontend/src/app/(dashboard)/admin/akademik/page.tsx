"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  adminAkademikApi,
  type AcademicClass,
  type AcademicData,
  type AcademicEntity,
  type AcademicOption,
} from "@/lib/admin-akademik-api";
import styles from "./page.module.css";

const LABELS: Record<AcademicEntity, string> = {
  jurusan: "Jurusan",
  tingkat: "Tingkat",
  kelas: "Kelas",
};

const EMPTY_DATA: AcademicData = {
  jurusan: [],
  tingkat: [],
  kelas: [],
};

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan.";
}

export default function AdminAkademikPage() {
  const [data, setData] = useState<AcademicData>(EMPTY_DATA);
  const [entity, setEntity] = useState<AcademicEntity>("jurusan");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [jurusanId, setJurusanId] = useState("");
  const [tingkatId, setTingkatId] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function reload() {
    setLoading(true);

    try {
      const next = await adminAkademikApi.list();
      setData(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    adminAkademikApi
      .list()
      .then((next) => {
        if (active) setData(next);
      })
      .catch((err: unknown) => {
        if (active) setError(messageOf(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setNama("");
    setJurusanId("");
    setTingkatId("");
  }

  function changeEntity(next: AcademicEntity) {
    setEntity(next);
    resetForm();
    setError("");
    setSuccess("");
  }

  function editRow(row: AcademicOption | AcademicClass) {
    setEditingId(row.id);
    setNama(row.nama);
    setError("");
    setSuccess("");

    if ("jurusanId" in row) {
      setJurusanId(row.jurusanId);
      setTingkatId(row.tingkatId ?? "");
    } else {
      setJurusanId("");
      setTingkatId("");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || loading) return;

    const trimmedName = nama.trim();

    if (!trimmedName) {
      setError("Nama wajib diisi.");
      return;
    }

    if (entity === "kelas" && (!jurusanId || !tingkatId)) {
      setError("Pilih jurusan dan tingkat.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    const input =
      entity === "kelas"
        ? { nama: trimmedName, jurusanId, tingkatId }
        : { nama: trimmedName };

    try {
      if (editingId) {
        await adminAkademikApi.update(entity, editingId, input);
      } else {
        await adminAkademikApi.create(entity, input);
      }

      resetForm();

      try {
        await reload();
        setSuccess(`${LABELS[entity]} berhasil disimpan.`);
      } catch {
        setError(
          "Data berhasil disimpan, tetapi daftar gagal dimuat ulang. Klik Muat ulang.",
        );
      }
    } catch (err: unknown) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: AcademicOption) {
    if (busy || loading) return;

    const confirmed = window.confirm(
      `Hapus ${LABELS[entity].toLowerCase()} "${row.nama}"?\n\nData yang masih digunakan tidak dapat dihapus.`,
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await adminAkademikApi.remove(entity, row.id);

      if (editingId === row.id) resetForm();

      try {
        await reload();
        setSuccess(`${LABELS[entity]} berhasil dihapus.`);
      } catch {
        setError(
          "Data berhasil dihapus, tetapi daftar gagal dimuat ulang. Klik Muat ulang.",
        );
      }
    } catch (err: unknown) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setError("");
    setSuccess("");

    try {
      await reload();
    } catch (err: unknown) {
      setError(messageOf(err));
    }
  }

  const rows: Array<AcademicOption | AcademicClass> = data[entity];
  const disabled = loading || busy;

  const missingOptions =
    entity === "kelas" &&
    (data.jurusan.length === 0 || data.tingkat.length === 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Kelola Data Akademik</h1>
        <p className={styles.subtitle}>
          Tambah dan kelola jurusan, tingkat, serta kelas.
        </p>
      </header>

      <nav
        aria-label="Jenis data akademik"
        className={styles.tabs}
      >
        {(["jurusan", "tingkat", "kelas"] as const).map((item) => (
          <button
            key={item}
            type="button"
            disabled={disabled}
            aria-pressed={entity === item}
            onClick={() => changeEntity(item)}
            className={`${styles.button} ${styles.tab} ${
              entity === item ? styles.activeTab : ""
            }`}
          >
            {LABELS[item]} ({data[item].length})
          </button>
        ))}
      </nav>

      {error && (
        <p
          role="alert"
          className={`${styles.message} ${styles.error}`}
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className={`${styles.message} ${styles.success}`}
        >
          {success}
        </p>
      )}

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>
          {editingId ? "Edit" : "Tambah"} {LABELS[entity]}
        </h2>

        {missingOptions && !loading && (
          <p className={styles.notice}>
            Tambahkan jurusan dan tingkat terlebih dahulu.
          </p>
        )}

        <form onSubmit={save}>
          <fieldset
            disabled={disabled}
            className={styles.fieldset}
          >
            <label className={styles.field}>
              <span className={styles.label}>
                Nama {LABELS[entity]}
              </span>

              <input
                required
                maxLength={120}
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                className={styles.input}
                placeholder={
                  entity === "jurusan"
                    ? "Contoh: PPLG"
                    : entity === "tingkat"
                      ? "Contoh: X, XI, XII"
                      : "Contoh: X PPLG 1"
                }
              />
            </label>

            {entity === "kelas" && (
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Jurusan</span>

                  <select
                    required
                    value={jurusanId}
                    onChange={(event) =>
                      setJurusanId(event.target.value)
                    }
                    className={styles.input}
                  >
                    <option value="">Pilih jurusan</option>
                    {data.jurusan.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Tingkat</span>

                  <select
                    required
                    value={tingkatId}
                    onChange={(event) =>
                      setTingkatId(event.target.value)
                    }
                    className={styles.input}
                  >
                    <option value="">Pilih tingkat</option>
                    {data.tingkat.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="submit"
                disabled={disabled || missingOptions}
                className={`${styles.button} ${styles.primaryButton}`}
              >
                {busy ? "Memproses..." : "Simpan"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={styles.button}
                >
                  Batal edit
                </button>
              )}
            </div>
          </fieldset>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.listTitle}>
            Daftar {LABELS[entity]}
          </h2>

          <button
            type="button"
            disabled={disabled}
            onClick={() => void refresh()}
            className={styles.button}
          >
            Muat ulang
          </button>
        </div>

        {loading ? (
          <p className={styles.emptyState}>Memuat data...</p>
        ) : rows.length === 0 ? (
          <p className={styles.emptyState}>Belum ada data.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  {entity === "kelas" && (
                    <>
                      <th scope="col">Jurusan</th>
                      <th scope="col">Tingkat</th>
                      <th scope="col">Siswa/anggota</th>
                    </>
                  )}
                  <th scope="col">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.nama}</td>

                    {"jurusanId" in row && (
                      <>
                        <td>{row.jurusan.nama}</td>
                        <td>
                          {row.tingkat?.nama ?? "Belum diatur"}
                        </td>
                        <td>{row._count.siswa}</td>
                      </>
                    )}

                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => editRow(row)}
                          className={styles.button}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => void removeRow(row)}
                          className={`${styles.button} ${styles.dangerButton}`}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
