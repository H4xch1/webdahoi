"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  UserRound,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

import styles from "./profile.module.css";

// ---------------------------------------------
// Types
// ---------------------------------------------

interface StudentProfile {
  id: string;
  name: string;
  email: string;

  nik: string;
  nis: string | null;
  nisn: string | null;
  nip: string | null;

  role: string;
  kelasId: string | null;
  avatarUrl: string | null;
  createdAt: string;

  kelas: {
    id: string;
    nama: string;

    jurusan: {
      id: string;
      nama: string;
    };

    tingkat: {
      id: string;
      nama: string;
    } | null;
  } | null;
}

interface InfoFieldProps {
  label: string;
  children: ReactNode;
}

// ---------------------------------------------
// Helpers
// ---------------------------------------------

function hasMessage(
  value: unknown,
): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

function hasUser(
  value: unknown,
): value is { user: StudentProfile } {
  if (
    typeof value !== "object" ||
    value === null ||
    !("user" in value)
  ) {
    return false;
  }

  const user = value.user;

  return (
    typeof user === "object" &&
    user !== null &&
    "id" in user &&
    typeof user.id === "string" &&
    "name" in user &&
    typeof user.name === "string" &&
    "email" in user &&
    typeof user.email === "string" &&
    "role" in user &&
    typeof user.role === "string"
  );
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "M";
}

function formatJoinDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Belum tersedia";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function displayValue(
  value: string | null | undefined,
): string {
  return value?.trim() || "Belum diisi";
}

function InfoField({
  label,
  children,
}: InfoFieldProps) {
  return (
    <div className={styles.infoField}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ---------------------------------------------
// Page
// ---------------------------------------------

export default function MuridProfilePage() {
  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [attempt, setAttempt] =
    useState(0);

  useEffect(() => {
    const controller =
      new AbortController();

    setLoading(true);
    setError("");
    setProfile(null);

    async function loadProfile() {
      try {
        const response = await fetch(
          "/backend-api/auth/me",
          {
            method: "GET",

            credentials: "include",
            cache: "no-store",

            headers: {
              Accept: "application/json",
            },

            signal: controller.signal,
          },
        );

        const body: unknown =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          const fallback =
            response.status === 401
              ? "Sesi berakhir. Silakan masuk kembali."
              : "Gagal mengambil profil.";

          throw new Error(
            hasMessage(body)
              ? body.message
              : fallback,
          );
        }

        if (!hasUser(body)) {
          throw new Error(
            "Format respons profil tidak valid.",
          );
        }

        if (body.user.role !== "MURID") {
          throw new Error(
            "Halaman ini hanya tersedia untuk akun murid.",
          );
        }

        if (!controller.signal.aborted) {
          setProfile(body.user);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          err instanceof TypeError
            ? "Tidak dapat terhubung ke server. Periksa koneksi internet."
            : err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat memuat profil.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [attempt]);

  return (
    <main
      className={styles.page}
      aria-busy={loading}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            Ruang Murid / Akun
          </p>

          <h1 className={styles.title}>
            Profile
          </h1>

          <p className={styles.subtitle}>
            Informasi identitas dan akademik
            akun Anda.
          </p>
        </div>

        <div className={styles.actions}>
          <Link
            href="/murid"
            className={styles.secondary}
          >
            Dashboard
          </Link>

          <button
            type="button"
            className={styles.secondary}
            disabled={loading}
            onClick={() =>
              setAttempt(
                (value) => value + 1,
              )
            }
          >
            <RefreshCw
              size={16}
              aria-hidden="true"
            />

            {loading
              ? "Memuat..."
              : "Muat ulang"}
          </button>
        </div>
      </header>

      {loading && (
        <section
          className={styles.empty}
          role="status"
        >
          Memuat profil Anda...
        </section>
      )}

      {!loading && error && (
        <section className={styles.panel}>
          <p
            className={styles.error}
            role="alert"
          >
            {error}
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primary}
              onClick={() =>
                setAttempt(
                  (value) => value + 1,
                )
              }
            >
              Coba lagi
            </button>

            <Link
              href="/login"
              className={styles.secondary}
            >
              Masuk kembali
            </Link>
          </div>
        </section>
      )}

      {!loading && !error && profile && (
        <>
          <section
            className={styles.profileHero}
            aria-label="Ringkasan profil"
          >
            <div
              className={styles.avatar}
              aria-hidden="true"
            >
              {getInitials(profile.name)}
            </div>

            <div className={styles.identity}>
              <span className={styles.badge}>
                <GraduationCap
                  size={15}
                  aria-hidden="true"
                />
                Murid
              </span>

              <h2>{profile.name}</h2>

              <p>{profile.email}</p>

              <p className={styles.classLabel}>
                {profile.kelas
                  ? `${profile.kelas.nama} · ${profile.kelas.jurusan.nama}`
                  : "Belum terdaftar di kelas"}
              </p>
            </div>
          </section>

          <div className={styles.columns}>
            <section
              className={styles.panel}
              aria-labelledby="identity-title"
            >
              <div
                className={styles.sectionHeading}
              >
                <span
                  className={styles.sectionIcon}
                >
                  <UserRound
                    size={20}
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <h2 id="identity-title">
                    Identitas Murid
                  </h2>

                  <p>
                    Data pribadi yang tercatat
                    di sekolah.
                  </p>
                </div>
              </div>

              <dl className={styles.infoGrid}>
                <InfoField label="Nama lengkap">
                  {profile.name}
                </InfoField>

                <InfoField label="Email">
                  {profile.email}
                </InfoField>

                <InfoField label="NIS">
                  {displayValue(profile.nis)}
                </InfoField>

                <InfoField label="NISN">
                  {displayValue(profile.nisn)}
                </InfoField>

                <InfoField label="NIK">
                  {displayValue(profile.nik)}
                </InfoField>

                <InfoField label="Peran akun">
                  Murid
                </InfoField>
              </dl>
            </section>

            <section
              className={styles.panel}
              aria-labelledby="academic-title"
            >
              <div
                className={styles.sectionHeading}
              >
                <span
                  className={styles.sectionIcon}
                >
                  <BookOpen
                    size={20}
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <h2 id="academic-title">
                    Informasi Akademik
                  </h2>

                  <p>
                    Kelas dan program
                    pembelajaran Anda.
                  </p>
                </div>
              </div>

              <dl className={styles.infoGrid}>
                <InfoField label="Kelas">
                  {displayValue(
                    profile.kelas?.nama,
                  )}
                </InfoField>

                <InfoField label="Jurusan">
                  {displayValue(
                    profile.kelas?.jurusan.nama,
                  )}
                </InfoField>

                <InfoField label="Tingkat">
                  {displayValue(
                    profile.kelas?.tingkat?.nama,
                  )}
                </InfoField>

                <InfoField label="Terdaftar sejak">
                  {formatJoinDate(
                    profile.createdAt,
                  )}
                </InfoField>
              </dl>

              {!profile.kelas && (
                <p
                  className={styles.notice}
                  role="status"
                >
                  Anda belum memiliki kelas.
                  Hubungi admin sekolah untuk
                  mengatur penempatan kelas.
                </p>
              )}
            </section>
          </div>

          <section
            className={styles.accountNotice}
          >
            <ShieldCheck
              size={23}
              aria-hidden="true"
              className={styles.noticeIcon}
            />

            <div>
              <h2>
                Data dikelola oleh sekolah
              </h2>

              <p>
                Jika nama, email, NIS, NISN,
                NIK, atau kelas tidak sesuai,
                hubungi administrator sekolah
                untuk melakukan perbaikan.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
