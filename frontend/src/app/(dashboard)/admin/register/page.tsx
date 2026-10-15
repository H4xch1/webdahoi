"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { adminApi, Kelas, Mapel, Role } from "@/lib/adminApi";
import styles from "./page.module.css";

const roles: { value: Role; label: string }[] = [
  { value: "MURID", label: "Murid" },
  { value: "GURU", label: "Guru" },
  { value: "KEPSEK", label: "Kepala Sekolah" },
  { value: "KURIKULUM", label: "Kurikulum" },
  { value: "ADMIN_UTAMA", label: "Admin Utama" },
];

export default function RegisterPage() {
  const router = useRouter();
  const submittingRef = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nik, setNik] = useState("");
  const [nis, setNis] = useState("");
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");
  const [role, setRole] = useState<Role>("MURID");

  const [kelasId, setKelasId] = useState("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>(
    []
  );
  const [selectedMapelIds, setSelectedMapelIds] = useState<string[]>(
    []
  );

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);

  const [kelasLoading, setKelasLoading] = useState(true);
  const [mapelLoading, setMapelLoading] = useState(false);

  const [kelasError, setKelasError] = useState("");
  const [mapelError, setMapelError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadKelas() {
      setKelasLoading(true);
      setKelasError("");

      try {
        const data = await adminApi.listKelas();

        if (active) {
          setKelasList(data);
        }
      } catch (err) {
        if (active) {
          setKelasError(
            err instanceof Error
              ? err.message
              : "Gagal memuat data kelas."
          );
        }
      } finally {
        if (active) {
          setKelasLoading(false);
        }
      }
    }

    loadKelas();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (role !== "GURU") {
      setMapelList([]);
      setSelectedMapelIds([]);
      return;
    }

    let active = true;

    async function loadMapel() {
      setMapelLoading(true);
      setMapelError("");

      try {
        const data = await adminApi.listMapel();

        if (active) {
          setMapelList(data);
        }
      } catch (err) {
        if (active) {
          setMapelError(
            err instanceof Error
              ? err.message
              : "Gagal memuat data mata pelajaran."
          );
        }
      } finally {
        if (active) {
          setMapelLoading(false);
        }
      }
    }

    loadMapel();

    return () => {
      active = false;
    };
  }, [role]);

  function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRole = event.target.value as Role;

    setRole(nextRole);
    setKelasId("");
    setSelectedKelasIds([]);
    setSelectedMapelIds([]);
    setError("");
  }

  function toggleKelas(id: string) {
    setSelectedKelasIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleMapel(id: string) {
    setSelectedMapelIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function validateForm(): string | null {
    if (!name.trim()) {
      return "Nama wajib diisi.";
    }

    if (!nik.trim()) {
      return "NIK wajib diisi.";
    }

    if (role === "MURID" && !nis.trim()) {
      return "NIS wajib diisi untuk murid.";
    }

    if (role === "GURU" && !nip.trim()) {
      return "NIP wajib diisi untuk guru.";
    }

    if (role === "MURID" && !kelasId) {
      return "Kelas wajib dipilih untuk murid.";
    }

    if (role === "GURU" && selectedKelasIds.length === 0) {
      return "Pilih minimal satu kelas untuk guru.";
    }

    if (role === "GURU" && selectedMapelIds.length === 0) {
      return "Pilih minimal satu mata pelajaran untuk guru.";
    }

    if (!password) {
      return "Password wajib diisi.";
    }

    if (password.length < 6) {
      return "Password minimal 6 karakter.";
    }

    if (password !== passwordConfirmation) {
      return "Konfirmasi password tidak cocok.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (kelasLoading || kelasError) {
      setError("Data kelas belum siap.");
      return;
    }

    if (role === "GURU" && (mapelLoading || mapelError)) {
      setError("Data mata pelajaran belum siap.");
      return;
    }

    submittingRef.current = true;

    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || undefined,
        nik: nik.trim() || undefined,
        nis: role === "MURID" ? nis.trim() : undefined,
        nip: role === "GURU" ? nip.trim() : undefined,
        password,
        role,
        ...(role === "MURID"
          ? {
              kelasId,
            }
          : {}),
        ...(role === "GURU"
          ? {
              kelasIds: selectedKelasIds,
              mapelIds: selectedMapelIds,
            }
          : {}),
      };

      await adminApi.createUser(payload);

      setSuccess("Pengguna berhasil didaftarkan.");

      if (role === "MURID") {
        router.push("/admin/murid");
      } else if (role === "GURU") {
        router.push("/admin/guru");
      } else {
        router.push("/admin/admin");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan pengguna."
      );

      submittingRef.current = false;
    }
  }

  const submitDisabled =
    submittingRef.current ||
    kelasLoading ||
    Boolean(kelasError) ||
    (role === "GURU" &&
      (mapelLoading || Boolean(mapelError)));

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Daftar Pengguna</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.success}>{success}</p>}

          <div className={styles.grid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Nama Lengkap
              </label>

              <input
                id="name"
                className={styles.input}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="role">
                Role
              </label>

              <select
                id="role"
                className={styles.select}
                value={role}
                onChange={handleRoleChange}
              >
                {roles.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>

              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contoh@email.com"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="nik">
                NIK
              </label>

              <input
                id="nik"
                className={styles.input}
                value={nik}
                onChange={(event) => setNik(event.target.value)}
                placeholder="Masukkan NIK"
              />
            </div>

            {role === "MURID" && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="nis">
                  NIS
                </label>

                <input
                  id="nis"
                  className={styles.input}
                  value={nis}
                  onChange={(event) => setNis(event.target.value)}
                  placeholder="Masukkan NIS"
                />
              </div>
            )}

            {role === "GURU" && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="nip">
                  NIP
                </label>

                <input
                  id="nip"
                  className={styles.input}
                  value={nip}
                  onChange={(event) => setNip(event.target.value)}
                  placeholder="Masukkan NIP"
                />
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor="passwordConfirmation"
              >
                Konfirmasi Password
              </label>

              <input
                id="passwordConfirmation"
                type="password"
                className={styles.input}
                value={passwordConfirmation}
                onChange={(event) =>
                  setPasswordConfirmation(event.target.value)
                }
                placeholder="Ulangi password"
              />
            </div>
          </div>

          {role === "MURID" && (
            <div className={styles.classSection}>
              <label className={styles.label} htmlFor="kelasId">
                Kelas
              </label>

              {kelasLoading ? (
                <p className={styles.hint}>Memuat kelas...</p>
              ) : kelasError ? (
                <>
                  <p className={styles.error}>{kelasError}</p>

                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setReloadKey((key) => key + 1)}
                  >
                    Coba Lagi
                  </button>
                </>
              ) : (
                <select
                  id="kelasId"
                  className={styles.select}
                  value={kelasId}
                  onChange={(event) => setKelasId(event.target.value)}
                >
                  <option value="">Pilih kelas</option>

                  {kelasList.map((kelas) => (
                    <option key={kelas.id} value={kelas.id}>
                      {kelas.nama}
                      {kelas.jurusan?.nama
                        ? ` - ${kelas.jurusan.nama}`
                        : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {role === "GURU" && (
            <>
              <fieldset className={styles.classSection}>
                <legend className={styles.label}>
                  Kelas yang Diajar
                </legend>

                {kelasLoading ? (
                  <p className={styles.hint}>Memuat kelas...</p>
                ) : kelasError ? (
                  <>
                    <p className={styles.error}>{kelasError}</p>

                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() =>
                        setReloadKey((key) => key + 1)
                      }
                    >
                      Coba Lagi
                    </button>
                  </>
                ) : kelasList.length === 0 ? (
                  <p className={styles.hint}>
                    Belum ada data kelas.
                  </p>
                ) : (
                  <div className={styles.classList}>
                    {kelasList.map((kelas) => (
                      <label
                        key={kelas.id}
                        className={styles.classOption}
                      >
                        <input
                          type="checkbox"
                          checked={selectedKelasIds.includes(kelas.id)}
                          onChange={() => toggleKelas(kelas.id)}
                        />

                        <span>
                          {kelas.nama}
                          {kelas.jurusan?.nama
                            ? ` - ${kelas.jurusan.nama}`
                            : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <fieldset className={styles.classSection}>
                <legend className={styles.label}>
                  Mata Pelajaran yang Diajar
                </legend>

                {mapelLoading ? (
                  <p className={styles.hint}>
                    Memuat mata pelajaran...
                  </p>
                ) : mapelError ? (
                  <p className={styles.error}>{mapelError}</p>
                ) : mapelList.length === 0 ? (
                  <p className={styles.hint}>
                    Belum ada data mata pelajaran.
                  </p>
                ) : (
                  <div className={styles.classList}>
                    {mapelList.map((mapel) => (
                      <label
                        key={mapel.id}
                        className={styles.classOption}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMapelIds.includes(mapel.id)}
                          onChange={() => toggleMapel(mapel.id)}
                        />

                        <span>{mapel.nama}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
            </>
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
              disabled={submitDisabled}
            >
              {submittingRef.current
                ? "Mendaftarkan..."
                : "Daftarkan Pengguna"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
