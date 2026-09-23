"use client";

import { useCallback, useEffect, useState } from "react";
import UserTable from "@/components/admin/UserTable";
import RegisterForm from "@/components/admin/RegisterForm";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import styles from "./page.module.css";

export default function AdminGuruPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    adminApi.listUsers("GURU").then(setUsers).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(id: string) {
    if (!confirm("Hapus guru ini?")) return;
    await adminApi.deleteUser(id);
    load();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Manage Guru</h1>
        <button className={styles.register} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Tutup" : "Register Guru"}
        </button>
      </header>

      {showForm && (
        <RegisterForm
          roles={["GURU", "KEPSEK", "KURIKULUM"]}
          withJurusan
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}

      <UserTable users={users} showRole onDelete={remove} />
    </main>
  );
}
