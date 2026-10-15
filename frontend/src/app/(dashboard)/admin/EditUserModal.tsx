"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  adminApi,
  type AdminUser,
  type Kelas,
  type Mapel,
  type Role,
  type UpdateUserInput,
} from "@/lib/adminApi";

import styles from "./AdminUsersPage.module.css";
import formStyles from "./register/page.module.css";

interface Props {
  userId: string;
  onClose: () => void;
  onSaved: (user: AdminUser) => void;
}

const ROLE_LABELS: Record<Role, string> = {
  MURID: "Murid",
  GURU: "Guru",
  KEPSEK: "Kepala Sekolah",
  KURIKULUM: "Kurikulum",
  ADMIN_UTAMA: "Admin Utama",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

export default function EditUserModal({
  userId,
  onClose,
  onSaved,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);

  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>(
    []
  );
  const [selectedMapelIds, setSelectedMapelIds] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Open the native dialog and restore focus when it unmounts.
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";

    return () => {
      if (dialog?.open) {
        dialog.close();
      }

      document.body.style.overflow = previousOverflow;

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus();
      }
    };
  }, []);

  // Load account details and the options required by its role.
  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError("");
      setError("");
      setUser(null);
      setKelasList([]);
      setMapelList([]);
      setSelectedKelasIds([]);
      setSelectedMapelIds([]);

      try {
        const account = await adminApi.getUser(userId);

        if (!active) return;

        if (!account) {
          throw new Error("Data pengguna tidak ditemukan.");
        }

        // Missing assignment data must not be treated as an empty
        // selection, because that could clear existing assignments.
        if (account.role === "GURU") {
          if (!Array.isArray(account.kelasDiajar)) {
            throw new Error(
              "Data kelas guru belum lengkap. Respons detail pengguna harus menyertakan kelasDiajar."
            );
          }

          if (!Array.isArray(account.mapelDiajar)) {
            throw new Error(
              "Data mata pelajaran guru belum lengkap. Respons detail pengguna harus menyertakan mapelDiajar."
            );
          }
        }

        const needsClasses =
          account.role === "MURID" || account.role === "GURU";

        const [classes, subjects] = await Promise.all([
          needsClasses
            ? adminApi.listKelas()
            : Promise.resolve([] as Kelas[]),

          account.role === "GURU"
            ? adminApi.listMapel()
            : Promise.resolve([] as Mapel[]),
        ]);

        if (!active) return;

        setUser(account);
        setKelasList(classes);
        setMapelList(subjects);

        if (account.role === "GURU") {
          setSelectedKelasIds(
            Array.from(
              new Set(account.kelasDiajar.map((kelas) => kelas.id))
            )
          );

          setSelectedMapelIds(
            Array.from(
              new Set(
                (account.mapelDiajar ?? []).map((mapel) => mapel.id)
              )
            )
          );
        }
      } catch (err) {
        if (active) {
          setLoadError(
            getErrorMessage(err, "Gagal memuat data pengguna.")
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [userId, reloadKey]);

  function close() {
    if (submittingRef.current) return;
    onClose();
  }

  function toggleKelas(id: string) {
    setSelectedKelasIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  function toggleMapel(id: string) {
    setSelectedMapelIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !user ||
      user.id !== userId ||
      loading ||
      loadError ||
      submittingRef.current
    ) {
      return;
    }

    const form = new FormData(event.currentTarget);

    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const nik = String(form.get("nik") ?? "").trim();
    const nis = String(form.get("nis") ?? "").trim();
    const nip = String(form.get("nip") ?? "").trim();
    const kelasId = String(form.get("kelasId") ?? "").trim();

    // Preserve password whitespace exactly as entered.
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(
      form.get("confirmPassword") ?? ""
    );

    setError("");

    if (!name || !email || !nik) {
      setError("Nama, email, dan NIK wajib diisi.");
      return;
    }

    if (user.role === "MURID" && !nis) {
      setError("NIS wajib diisi untuk murid.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    const payload: UpdateUserInput = {
      name,
      email,
      nik,
      ...(password ? { password } : {}),
      ...(user.role === "MURID"
        ? {
            nis,
            kelasId: kelasId || null,
          }
        : { nip }),
      ...(user.role === "GURU"
        ? {
            kelasIds: selectedKelasIds,
            mapelIds: selectedMapelIds,
          }
        : {}),
    };

    submittingRef.current = true;
    setSaving(true);

    let updated: AdminUser;

    try {
      updated = await adminApi.updateUser(user.id, payload);
    } catch (err) {
      setError(
        getErrorMessage(err, "Gagal menyimpan perubahan.")
      );
      return;
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }

    // Keep the existing parent callback responsible for updating
    // the user list and closing the modal.
    onSaved(updated);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.modal}
      aria-labelledby="edit-user-title"
      aria-describedby="edit-user-description"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className={`${formStyles.card} ${styles.modalCard}`}>
        <header className={formStyles.header}>
          <h1 id="edit-user-title">Edit Pengguna</h1>
          <p id="edit-user-description">
            Perbarui data akun, lalu simpan perubahan.
          </p>
        </header>

        {loading ? (
          <>
            <p role="status" className={formStyles.hint}>
              Memuat data pengguna...
            </p>

            <div className={formStyles.actions}>
              <button
                type="button"
                className={formStyles.secondaryButton}
                onClick={close}
              >
                Batal
              </button>
            </div>
          </>
        ) : loadError ? (
          <>
            <p role="alert" className={formStyles.error}>
              {loadError}
            </p>

            <div className={styles.loadActions}>
              <button
                type="button"
                className={formStyles.secondaryButton}
                onClick={close}
              >
                Batal
              </button>

              <button
                type="button"
                className={formStyles.primaryButton}
                onClick={() => {
                  setReloadKey((current) => current + 1);
                }}
              >
                Coba Lagi
              </button>
            </div>
          </>
        ) : user ? (
          <form
            key={user.id}
            onSubmit={handleSubmit}
            aria-busy={saving}
          >
            <fieldset
              className={formStyles.formFields}
              disabled={saving}
            >
              <div className={formStyles.grid}>
                <div className={formStyles.field}>
                  <label htmlFor="edit-name">Nama Lengkap</label>
                  <input
                    id="edit-name"
                    name="name"
                    defaultValue={user.name}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <label htmlFor="edit-role">Role</label>
                  <input
                    id="edit-role"
                    value={ROLE_LABELS[user.role]}
                    readOnly
                  />
                </div>

                <div className={formStyles.field}>
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={user.email ?? ""}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className={formStyles.field}>
                  <label htmlFor="edit-nik">NIK</label>
                  <input
                    id="edit-nik"
                    name="nik"
                    inputMode="numeric"
                    defaultValue={user.nik ?? ""}
                    required
                  />
                </div>

                {user.role === "MURID" ? (
                  <div className={formStyles.field}>
                    <label htmlFor="edit-nis">NIS</label>
                    <input
                      id="edit-nis"
                      name="nis"
                      inputMode="numeric"
                      defaultValue={user.nis ?? ""}
                      required
                    />
                  </div>
                ) : (
                  <div className={formStyles.field}>
                    <label htmlFor="edit-nip">
                      NIP (opsional)
                    </label>
                    <input
                      id="edit-nip"
                      name="nip"
                      inputMode="numeric"
                      defaultValue={user.nip ?? ""}
                    />
                  </div>
                )}

                <div className={formStyles.field}>
                  <label htmlFor="edit-password">
                    Password Baru (opsional)
                  </label>
                  <input
                    id="edit-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Password baru"
                    aria-describedby="edit-password-hint"
                  />
                </div>

                <div className={formStyles.field}>
                  <label htmlFor="edit-confirm-password">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    id="edit-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ulangi password baru"
                    aria-describedby="edit-password-hint"
                  />
                </div>
              </div>

              <p
                id="edit-password-hint"
                className={formStyles.hint}
              >
                Kosongkan kedua kolom password jika tidak ingin
                mengganti password.
              </p>

              {user.role === "MURID" && (
                <div className={formStyles.field}>
                  <label htmlFor="edit-kelas">
                    Kelas (opsional)
                  </label>

                  <select
                    id="edit-kelas"
                    name="kelasId"
                    defaultValue={user.kelasId ?? ""}
                  >
                    <option value="">Belum ditentukan</option>

                    {/* Preserve an existing class even if the
                        options endpoint does not include it. */}
                    {user.kelasId &&
                      !kelasList.some(
                        (kelas) => kelas.id === user.kelasId
                      ) && (
                        <option value={user.kelasId}>
                          Kelas saat ini (tidak tersedia di daftar)
                        </option>
                      )}

                    {kelasList.map((kelas) => (
                      <option key={kelas.id} value={kelas.id}>
                        {kelas.nama}
                        {kelas.jurusan
                          ? ` - ${kelas.jurusan.nama}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {user.role === "GURU" && (
                <>
                  <fieldset className={formStyles.classSection}>
                    <legend>Kelas yang Diajar</legend>

                    <p className={formStyles.hint}>
                      Pilih kelas yang diajar. Hapus centang untuk
                      membatalkan penugasan kelas.
                    </p>

                    {kelasList.length === 0 ? (
                      <p className={formStyles.hint}>
                        Belum ada kelas yang tersedia di daftar.
                      </p>
                    ) : (
                      <div className={formStyles.classList}>
                        {kelasList.map((kelas) => (
                          <label
                            key={kelas.id}
                            className={formStyles.classOption}
                          >
                            <input
                              type="checkbox"
                              value={kelas.id}
                              checked={selectedKelasIds.includes(
                                kelas.id
                              )}
                              onChange={() =>
                                toggleKelas(kelas.id)
                              }
                            />

                            <span>
                              {kelas.nama}
                              {kelas.jurusan
                                ? ` - ${kelas.jurusan.nama}`
                                : ""}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedKelasIds.some(
                      (id) =>
                        !kelasList.some((kelas) => kelas.id === id)
                    ) && (
                      <p className={formStyles.hint}>
                        Ada penugasan kelas yang tidak tersedia di
                        daftar. Penugasan tersebut tetap
                        dipertahankan saat menyimpan.
                      </p>
                    )}

                    <p
                      className={formStyles.hint}
                      aria-live="polite"
                    >
                      {selectedKelasIds.length} kelas dipilih.
                    </p>
                  </fieldset>

                  <fieldset className={formStyles.classSection}>
                    <legend>Mata Pelajaran yang Diajar</legend>

                    <p className={formStyles.hint}>
                      Pilih mata pelajaran yang diajar. Hapus
                      centang untuk membatalkan penugasan mata
                      pelajaran.
                    </p>

                    {mapelList.length === 0 ? (
                      <p className={formStyles.hint}>
                        Belum ada mata pelajaran yang tersedia di
                        daftar.
                      </p>
                    ) : (
                      <div className={formStyles.classList}>
                        {mapelList.map((mapel) => (
                          <label
                            key={mapel.id}
                            className={formStyles.classOption}
                          >
                            <input
                              type="checkbox"
                              value={mapel.id}
                              checked={selectedMapelIds.includes(
                                mapel.id
                              )}
                              onChange={() =>
                                toggleMapel(mapel.id)
                              }
                            />

                            <span>{mapel.nama}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {selectedMapelIds.some(
                      (id) =>
                        !mapelList.some((mapel) => mapel.id === id)
                    ) && (
                      <p className={formStyles.hint}>
                        Ada penugasan mata pelajaran yang tidak
                        tersedia di daftar. Penugasan tersebut
                        tetap dipertahankan saat menyimpan.
                      </p>
                    )}

                    <p
                      className={formStyles.hint}
                      aria-live="polite"
                    >
                      {selectedMapelIds.length} mata pelajaran
                      dipilih.
                    </p>
                  </fieldset>
                </>
              )}

              {error && (
                <p role="alert" className={formStyles.error}>
                  {error}
                </p>
              )}

              <div className={formStyles.actions}>
                <button
                  type="button"
                  className={formStyles.secondaryButton}
                  onClick={close}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className={formStyles.primaryButton}
                  disabled={saving}
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </fieldset>
          </form>
        ) : null}
      </div>
    </dialog>
  );
}
