"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import styles from "./page.module.css";

export default function ManageAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadAdmins() {
      setLoading(true);
      setError("");

      try {
        const admins = await adminApi.listUsers("ADMIN_UTAMA");

        if (active) {
          setUsers(admins);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat data admin."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAdmins();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const keyword = search.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    [user.name, user.nik, user.email].some((value) =>
      (value ?? "").toLowerCase().includes(keyword)
    )
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Manage Admin</h1>
          <p className={styles.subtitle}>
            Daftar akun Admin Utama.
          </p>
        </div>

        <Link
          href="/admin/register?role=ADMIN_UTAMA"
          className={styles.registerButton}
        >
          + Register Admin
        </Link>
      </header>

      <section
        className={styles.panel}
        aria-label="Daftar admin utama"
      >
        <div className={styles.toolbar}>
          <label className={styles.searchLabel}>
            Cari Admin
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Nama, NIK, atau email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className={styles.message} role="status">
            Memuat data admin...
          </p>
        ) : error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : (
          <>
            <p className={styles.count}>
              Menampilkan {filteredUsers.length} dari {users.length} admin
            </p>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">NIK</th>
                    <th scope="col">Nama Lengkap</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.empty}>
                        {keyword
                          ? "Tidak ada admin yang cocok."
                          : "Belum ada data admin."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.nik || "—"}</td>
                        <td>{user.name}</td>
                        <td>{user.email || "—"}</td>
                        <td>
                          <span className={styles.badge}>
                            Admin Utama
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Link href="/admin" className={styles.backLink}>
        ← Kembali ke Dashboard
      </Link>
    </main>
  );
}
