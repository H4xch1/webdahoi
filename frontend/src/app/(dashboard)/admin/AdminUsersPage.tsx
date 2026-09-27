"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  adminApi,
  type AdminUser,
  type Role,
} from "@/lib/adminApi";

import EditUserModal from "./EditUserModal";
import styles from "./AdminUsersPage.module.css";

interface Props {
  role: Role;
  label: string;
}

export default function AdminUsersPage({ role, label }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const deletingRef = useRef(false);
  const canDelete = role !== "ADMIN_UTAMA";

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setLoading(true);
      setError("");

      try {
        const data = await adminApi.listUsers(role);

        if (active) {
          setUsers(data);
        }
      } catch (err) {
        if (active) {
          setUsers([]);
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat data."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, [role, reloadKey]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = users.filter((user) =>
    [user.name, user.nik, user.email, user.nis, user.nip].some(
      (value) =>
        value?.toLowerCase().includes(normalizedSearch)
    )
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput);
  }

  function handleReset() {
    setSearchInput("");
    setSearch("");
  }

  function handleSaved(updated: AdminUser) {
    setUsers((previous) =>
      previous
        .map((user) => (user.id === updated.id ? updated : user))
        .filter((user) => user.role === role)
        .sort((a, b) => a.name.localeCompare(b.name))
    );

    setEditingId(null);
    setError("");
    setSuccess("Perubahan pengguna berhasil disimpan.");
  }

  async function handleDelete(user: AdminUser) {
    if (!canDelete || deletingRef.current || editingId) return;

    const confirmed = window.confirm(
      `Hapus akun "${user.name}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    deletingRef.current = true;
    setDeletingId(user.id);
    setError("");
    setSuccess("");

    try {
      await adminApi.deleteUser(user.id);

      setUsers((previous) =>
        previous.filter((item) => item.id !== user.id)
      );

      setSuccess("Akun berhasil dihapus.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus akun."
      );
    } finally {
      deletingRef.current = false;
      setDeletingId(null);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Manage {label}</h1>
          <p>Kelola data akun {label.toLowerCase()}.</p>
        </div>

        <Link
          href={`/admin/register?role=${role}`}
          className={styles.registerButton}
        >
          Register {label} +
        </Link>
      </header>

      <section
        className={styles.panel}
        aria-label={`Data ${label}`}
      >
        <div className={styles.toolbar}>
          <form
            onSubmit={handleSearch}
            className={styles.searchForm}
            role="search"
          >
            <label
              htmlFor={`search-${role}`}
              className={styles.searchLabel}
            >
              Cari {label}
            </label>

            <div className={styles.searchControls}>
              <input
                id={`search-${role}`}
                type="search"
                value={searchInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchInput(value);

                  if (!value) setSearch("");
                }}
                placeholder="Nama, NIK, email, NIS, atau NIP..."
                className={styles.searchInput}
              />

              <button
                type="submit"
                className={styles.searchButton}
              >
                Cari
              </button>

              <button
                type="button"
                onClick={handleReset}
                className={styles.secondaryButton}
              >
                Reset
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => {
              setSuccess("");
              setReloadKey((value) => value + 1);
            }}
            disabled={loading || deletingId !== null}
            className={styles.secondaryButton}
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}

        {success && (
          <p role="status" className={styles.success}>
            {success}
          </p>
        )}

        <p className={styles.count} role="status">
          {loading
            ? "Memuat data..."
            : `Menampilkan ${filteredUsers.length} dari ${users.length} akun`}
        </p>

        <div className={styles.tableWrapper}>
          <table className={styles.table} aria-busy={loading}>
            <thead>
              <tr>
                <th scope="col">NIK</th>
                <th scope="col">Nama Lengkap</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    {error
                      ? "Data tidak tersedia. Silakan coba Refresh."
                      : normalizedSearch
                        ? "Tidak ada akun yang cocok dengan pencarian."
                        : `Belum ada akun ${label.toLowerCase()}.`}
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
                        {role === "ADMIN_UTAMA" ? "Admin Utama" : label}
                      </span>
                    </td>

                    <td>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          onClick={() => {
                            setError("");
                            setSuccess("");
                            setEditingId(user.id);
                          }}
                          disabled={deletingId !== null}
                          className={styles.editButton}
                          aria-label={`Edit akun ${user.name}`}
                        >
                          Edit
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(user)}
                            disabled={deletingId !== null}
                            className={styles.deleteButton}
                            aria-label={`Hapus akun ${user.name}`}
                          >
                            {deletingId === user.id
                              ? "Menghapus..."
                              : "Hapus"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Link href="/admin" className={styles.backLink}>
        ← Kembali ke Dashboard
      </Link>

      {editingId && (
        <EditUserModal
          key={editingId}
          userId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}
