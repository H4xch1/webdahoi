"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import UserTable from "@/components/admin/UserTable";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import styles from "./page.module.css";

export default function AdminKepsekPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .listUsers("KEPSEK")
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: string) {
    if (!confirm("Hapus kepala sekolah ini?")) return;
    await adminApi.deleteUser(id);
    load();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Manage Kepala Sekolah</h1>
        <Link className={styles.register} href="/admin/register?role=KEPSEK">
          Register Kepsek
        </Link>
      </header>

      {loading ? (
        <p className={styles.loading}>Memuat data...</p>
      ) : (
        <UserTable users={users} showRole onDelete={remove} />
      )}
    </main>
  );
}
