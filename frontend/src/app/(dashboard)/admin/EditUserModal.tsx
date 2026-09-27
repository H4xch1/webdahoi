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

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
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
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    document.body.style.overflow = "hidden";

    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError("");
      setError("");

      try {
        const account = await adminApi.getUser(userId);

        const classes =
          account.role === "MURID" || account.role === "GURU"
            ? await adminApi.listKelas()
            : [];

        if (!active) return;

        setUser(account);
        setKelasList(classes);
        setSelectedKelasIds(
          account.kelasDiajar.map((kelas) => kelas.id)
        );
      } catch (err) {
        if (active) {
          setLoadError(message(err, "Gagal memuat data pengguna."));
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
    if (!submittingRef.current) {
      onClose();
    }
  }

  function toggleKelas(id: string) {
    setSelectedKelasIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || loading || loadError || submittingRef.current) {
      return;
    }

    const form = new FormData(event.currentTarget);

    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const nik = String(form.get("nik") ?? "").trim();
    const nis = String(form.get("nis") ?? "").trim();
    const nip = String(form.get("nip") ?? "").trim();
    const kelasId = String(form.get("kelasId") ?? "").trim();

    // Passwords must not be trimmed.
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
        ? { nis, kelasId: kelasId || null }
        : { nip }),
      ...(user.role === "GURU"
        ? { kelasIds: selectedKelasIds }
        : {}),
    };

    submittingRef.current = true;
    setSaving(true);

    try {
      const updated = await adminApi.updateUser(user.id, payload);
      submittingRef.current = false;
      onSaved(updated);
    } catch (err) {
      setError(message(err, "Gagal menyimpan perubahan."));
      submittingRef.current = false;
      setSaving(false);
    }
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
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Coba Lagi
              </button>
            </div>
          </>
        ) : user ? (
          <form onSubmit={handleSubmit}>
            <fieldset
              className={formStyles.formFields}
              disabled={saving}
              aria-busy={saving}
            >
              <div className={formStyles.field}>
                <label htmlFor="edit-role">Role</label>
                <input
                  id="edit-role"
                  value={ROLE_LABELS[user.role]}
                  readOnly
                />
              </div>

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
                    <label htmlFor="edit-nip">NIP (opsional)</label>
                    <input
                      id="edit-nip"
                      name="nip"
                      inputMode="numeric"
                      defaultValue={user.nip ?? ""}
                    />
                  </div>
                )}
              </div>

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

                    {kelasList.map((kelas) => (
                      <option key={kelas.id} value={kelas.id}>
                        {kelas.nama}
                        {kelas.jurusan
                          ? ` — ${kelas.jurusan.nama}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {user.role === "GURU" && (
                <fieldset className={formStyles.classSection}>
                  <legend>Kelas yang Diajar</legend>

                  <p className={formStyles.hint}>
                    Pilih kelas yang diajar. Hapus centang untuk
                    membatalkan penugasan kelas.
                  </p>

                  {kelasList.length === 0 ? (
                    <p className={formStyles.hint}>
                      Belum ada kelas.
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
                  )}

                  <p
                    className={formStyles.hint}
                    aria-live="polite"
                  >
                    {selectedKelasIds.length} kelas dipilih.
                  </p>
                </fieldset>
              )}

              <div>
                <p className={formStyles.hint}>
                  Kosongkan kedua kolom password jika tidak ingin
                  mengganti password.
                </p>

                <div className={formStyles.grid}>
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
                    />
                  </div>
                </div>
              </div>

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
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className={formStyles.primaryButton}
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </button>
              </div>
            </fieldset>
          </form>
        ) : null}
      </div>
    </dialog>
  );
}
