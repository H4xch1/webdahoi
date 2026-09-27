"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  guruApi,
  errorMessage,
  localDateString,
  type AttendanceEntry,
  type AttendanceQuery,
  type AttendanceStatus,
  type AttendanceStudent,
} from "@/lib/guruApi";

import {
  ClassSubjectFields,
  useGuruOptions,
} from "../_components/GuruFields";

import shared from "../guru-shared.module.css";
import styles from "./absen.module.css";

const statuses: AttendanceStatus[] = ["HADIR", "IZIN", "SAKIT", "ALPA"];

export default function GuruAbsenPage() {
  const { options, loading, error: optionsError, retry } = useGuruOptions();

  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [tanggal, setTanggal] = useState("");

  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [loadedQuery, setLoadedQuery] = useState<AttendanceQuery | null>(
    null,
  );

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dirty, setDirty] = useState(false);

  const loadController = useRef<AbortController | null>(null);
  const saveLock = useRef(false);

  useEffect(() => {
    setTanggal(localDateString());

    return () => loadController.current?.abort();
  }, []);

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  function invalidateList() {
    loadController.current?.abort();
    setLoadingStudents(false);
    setLoadedQuery(null);
    setStudents([]);
    setError("");
    setSuccess("");
  }

  function updateStudent(
    id: string,
    patch: Partial<Pick<AttendanceStudent, "status" | "keterangan">>,
  ) {
    setStudents((current) =>
      current.map((student) =>
        student.id === id ? { ...student, ...patch } : student,
      ),
    );

    setDirty(true);
    setSuccess("");
  }

  async function loadStudents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (dirty && !window.confirm("Buang perubahan absensi yang belum disimpan?")) {
      return;
    }

    loadController.current?.abort();
    const controller = new AbortController();
    loadController.current = controller;

    const query = { kelasId, mapelId, tanggal };

    setLoadingStudents(true);
    setLoadedQuery(null);
    setStudents([]);
    setError("");
    setSuccess("");
    setDirty(false);

    try {
      const result = await guruApi.attendance(query, controller.signal);

      if (!controller.signal.aborted) {
        setStudents(result.siswa);
        setLoadedQuery(query);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(errorMessage(err));
      }
    } finally {
      if (!controller.signal.aborted) setLoadingStudents(false);
    }
  }

  async function saveAttendance() {
    if (!loadedQuery || saveLock.current) return;

    const entries: AttendanceEntry[] = [];

    for (const student of students) {
      if (!student.status) {
        setError(`Pilih status kehadiran untuk ${student.name}.`);
        return;
      }

      entries.push({
        siswaId: student.id,
        status: student.status,
        keterangan: student.keterangan,
      });
    }

    saveLock.current = true;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await guruApi.saveAttendance({
        ...loadedQuery,
        entries,
      });

      setSuccess(result.message);
      setDirty(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }

  return (
    <main className={shared.page}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Kehadiran / Kelas</p>
          <h1 className={shared.title}>Absensi Murid</h1>
          <p className={shared.subtitle}>
            Catat kehadiran berdasarkan kelas, mata pelajaran, dan tanggal.
          </p>
        </div>

        <Link
          href="/guru"
          className={shared.secondary}
          onClick={(event) => {
            if (
              saving ||
              (dirty &&
                !window.confirm("Tinggalkan perubahan yang belum disimpan?"))
            ) {
              event.preventDefault();
            }
          }}
        >
          ← Dashboard
        </Link>
      </header>

      {error && (
        <p className={shared.error} role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className={shared.success} role="status">
          {success}
        </p>
      )}

      {loading ? (
        <div className={shared.empty} role="status">
          Memuat kelas…
        </div>
      ) : optionsError || !options ? (
        <>
          <p className={shared.error} role="alert">
            {optionsError || "Data tidak tersedia."}
          </p>
          <button className={shared.button} onClick={retry}>
            Coba lagi
          </button>
        </>
      ) : options.kelas.length === 0 ? (
        <div className={shared.empty}>
          Anda belum memiliki kelas. Hubungi admin.
        </div>
      ) : (
        <>
          <form
            className={`${shared.panel} ${styles.filters}`}
            onSubmit={loadStudents}
          >
            <fieldset
              className={shared.fieldset}
              disabled={saving || dirty}
            >
              <div className={shared.formGrid}>
                <ClassSubjectFields
                  options={options}
                  kelasId={kelasId}
                  mapelId={mapelId}
                  onClassChange={(value) => {
                    setKelasId(value);
                    invalidateList();
                  }}
                  onSubjectChange={(value) => {
                    setMapelId(value);
                    invalidateList();
                  }}
                />

                <label className={shared.field}>
                  Tanggal
                  <input
                    className={shared.input}
                    type="date"
                    required
                    value={tanggal}
                    onChange={(event) => {
                      setTanggal(event.target.value);
                      invalidateList();
                    }}
                  />
                </label>

                <div className={styles.loadButton}>
                  <button
                    type="submit"
                    className={shared.button}
                    disabled={
                      loadingStudents || !kelasId || !mapelId || !tanggal
                    }
                  >
                    {loadingStudents ? "Memuat…" : "Tampilkan murid"}
                  </button>
                </div>
              </div>
            </fieldset>

            {dirty && (
              <div className={styles.dirtyNotice}>
                <p className={shared.hint}>
                  Simpan atau buang perubahan sebelum mengganti filter.
                </p>

                <button
                  className={shared.secondary}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (window.confirm("Buang perubahan absensi?")) {
                      setDirty(false);
                      invalidateList();
                    }
                  }}
                >
                  Buang perubahan
                </button>
              </div>
            )}
          </form>

          {loadingStudents && (
            <div className={shared.empty} role="status">
              Memuat daftar murid…
            </div>
          )}

          {loadedQuery && (
            <section className={shared.panel}>
              <div className={styles.registerHeader}>
                <div>
                  <h2 className={shared.panelTitle}>Daftar kehadiran</h2>
                  <p className={shared.hint}>
                    {students.length} murid · {loadedQuery.tanggal}
                  </p>
                </div>

                <button
                  className={shared.secondary}
                  type="button"
                  disabled={saving || students.length === 0}
                  onClick={() => {
                    setStudents((current) =>
                      current.map((student) => ({
                        ...student,
                        status: student.status ?? "HADIR",
                      })),
                    );
                    setDirty(true);
                    setSuccess("");
                  }}
                >
                  Isi yang kosong: Hadir
                </button>
              </div>

              <div className={styles.summary}>
                {statuses.map((status) => (
                  <span className={shared.badge} key={status}>
                    {status}:{" "}
                    {students.filter((student) => student.status === status).length}
                  </span>
                ))}
                <span className={shared.badge}>
                  Belum diisi:{" "}
                  {students.filter((student) => !student.status).length}
                </span>
              </div>

              {students.length === 0 ? (
                <div className={shared.empty}>
                  Belum ada murid dalam kelas ini.
                </div>
              ) : (
                <>
                  <fieldset className={shared.fieldset} disabled={saving}>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th scope="col">Murid</th>
                            <th scope="col">Status</th>
                            <th scope="col">Keterangan</th>
                          </tr>
                        </thead>

                        <tbody>
                          {students.map((student, index) => (
                            <tr key={student.id}>
                              <td>
                                <div className={styles.student}>
                                  <span className={styles.number}>
                                    {index + 1}
                                  </span>
                                  <div>
                                    <strong>{student.name}</strong>
                                    <small>NIS: {student.nis || "—"}</small>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <select
                                  className={shared.select}
                                  aria-label={`Status ${student.name}`}
                                  value={student.status ?? ""}
                                  onChange={(event) =>
                                    updateStudent(student.id, {
                                      status:
                                        (event.target.value as AttendanceStatus) ||
                                        null,
                                    })
                                  }
                                >
                                  <option value="">Pilih status</option>
                                  {statuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              <td>
                                <input
                                  className={shared.input}
                                  aria-label={`Keterangan ${student.name}`}
                                  placeholder="Opsional"
                                  maxLength={500}
                                  value={student.keterangan}
                                  onChange={(event) =>
                                    updateStudent(student.id, {
                                      keterangan: event.target.value,
                                    })
                                  }
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </fieldset>

                  <div className={styles.saveRow}>
                    <p className={shared.hint}>
                      {dirty
                        ? "Ada perubahan yang belum disimpan."
                        : "Tidak ada perubahan yang belum disimpan."}
                    </p>

                    <button
                      className={shared.button}
                      type="button"
                      disabled={saving || !dirty}
                      onClick={saveAttendance}
                    >
                      {saving ? "Menyimpan…" : "Simpan absensi"}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
